import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  RendererStyleFlags2,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where,
} from '@firebase/firestore';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { NgxSpinnerService } from 'ngx-spinner';
import { RoomService } from '../services/room.service';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RoomUserInfo } from '../models/roomUserInfo.interface';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, OnDestroy {
  client!: IAgoraRTCClient;
  audioTrack?: IMicrophoneAudioTrack;
  videoTrack?: ICameraVideoTrack | undefined;
  screenTrack?: ILocalVideoTrack;
  usersListMenu = false;
  chatMenu = false;
  closeIcon = faTimes;
  token: string;
  db: any;
  loading = false;
  users: { [s: string]: string | number }[] = [];
  usersList: RoomUserInfo[] = [];
  chatMessages: { [s: string]: string }[] = [];
  videoCalls: any[] = [];
  speakers: string[] = [];
  subs: Subscription[] = [];
  streamOption: { [s: string]: boolean } = {
    audio: false,
    video: false,
    screen: false,
  };
  message?: string;
  cameraIds: MediaDeviceInfo[] = [];
  currentCamera = 0;
  mediaList: any[] = [];

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private route: ActivatedRoute,
    private spinner: NgxSpinnerService,
    private roomService: RoomService,
    private authService: AuthService
  ) {
    this.db = getFirestore();
    this.token = this.router.getCurrentNavigation()?.extras.state?.token;
    const publisher =
      this.router.getCurrentNavigation()?.extras.state?.publisher;
    if (publisher) {
      this.roomService.publisher.next(true);
    }
    let channelExists = false;
    let userAlreadyJoined = false;
    this.subs.push(
      this.roomService.streamOptions.subscribe((options) => {
        this.streamOption.audio = options.audio as boolean;
        this.streamOption.video = options.video as boolean;
        this.streamOption.screen = options.screen as boolean;
      })
    );
    this.spinner.show();
    this.loading = true;
    const data = query(
      collection(this.db, 'rooms'),
      where('channel', '==', this.route.snapshot.params['id'])
    );
    getDocs(data)
      .then((docs) => {
        docs.forEach((d) => {
          if (d.data()) {
            channelExists = true;
          }
        });
      })
      .then(() => {
        if (!channelExists) {
          this.router.navigate(['/'], {
            state: { message: "This room doesn't exist!" },
          });
        } else if (channelExists) {
          getDocs(data).then((docs) => {
            docs.forEach((doc_) => {
              const user_ = query(
                collection(this.db, doc_.ref.path, 'usersList'),
                where('email', '==', this.authService.userInfo.userInfo.email)
              );
              getDocs(user_)
                .then((docs_) => {
                  docs_.forEach((doc__) => {
                    userAlreadyJoined = true;
                  });
                })
                .then(() => {
                  if (userAlreadyJoined)
                    this.router.navigate(['/'], {
                      state: { message: 'You are already in this room!' },
                    });
                  else {
                    this.createRoom();
                  }
                });
            });
          });
        }
        this.spinner.hide();
        this.loading = false;
      });
  }

  ngOnInit(): void {}

  async createRoom() {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.client.on('user-joined', async (user) => {
      const data = query(
        collection(this.db, 'rooms'),
        where('channel', '==', this.route.snapshot.params['id'])
      );
      getDocs(data).then((docs) => {
        docs.forEach((doc_) => {
          const user_ = query(
            collection(this.db, doc_.ref.path, 'usersList'),
            where('uuid', '==', user.uid)
          );
          getDocs(user_).then((docs_) => {
            docs_.forEach((doc__) => {
              this.usersList.push({
                name: doc__.data().name,
                uid: doc__.data().uuid,
                email: doc__.data().email,
                speaking: doc__.data().speaking,
              });
            });
          });
        });
      });
    });
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
        const audio = user.audioTrack;
        audio?.play();
      } else if (mediaType === 'video') {
        const data = query(
          collection(this.db, 'rooms'),
          where('channel', '==', this.route.snapshot.params['id'])
        );
        getDocs(data).then((docs) => {
          docs.forEach((doc_) => {
            const user_ = query(
              collection(this.db, doc_.ref.path, 'users'),
              where('uuid', '==', user.uid)
            );
            getDocs(user_).then((docs) => {
              docs.forEach((doc__) => {
                this.users.push(doc__.data().name);
                this.roomService.usersCountChanged.next(this.users.length);
                setTimeout(() => {
                  user.videoTrack?.play(`stream-${this.users.length - 1}`);
                });
              });
            });
          });
        });
      }
    });

    await this.client.join(
      environment.APPID,
      this.route.snapshot.params['id'],
      this.token
    );

    getDocs(
      query(
        collection(this.db, 'rooms'),
        where('channel', '==', this.route.snapshot.params['id'])
      )
    ).then((docs) => {
      docs.forEach((doc_) => {
        const user_ = query(collection(this.db, doc_.ref.path, 'usersList'));
        onSnapshot(user_, (docs_) => {
          docs_.forEach((doc) => {
            const userData = doc.data();
            const user = this.usersList.filter((u) => {
              if (u.uid === userData.uuid) return true;
              else return false;
            })[0];
            this.usersList[this.usersList.indexOf(user)] = {
              ...user,
              speaking: userData.speaking,
            };
          });
        });
      });
    });

    getDocs(
      query(
        collection(this.db, 'rooms'),
        where('channel', '==', this.route.snapshot.params['id'])
      )
    ).then((docs) => {
      docs.forEach((doc_) => {
        const user_ = query(collection(this.db, doc_.ref.path, 'users'));
        onSnapshot(user_, (docs_) => {
          this.users = [];
          let i = 0;
          docs_.forEach((doc) => {
            const userData = doc.data();
            this.users.push({ name: userData.name, uid: userData.uid });
          });
        });
      });
    });

    this.client.enableAudioVolumeIndicator();
    this.client.on('volume-indicator', () => {
      if (this.audioTrack && this.audioTrack.enabled) {
        const user = this.usersList.filter((u) => {
          if (u.uid === this.client.uid) return true;
          else return false;
        })[0];
        this.usersList[this.usersList.indexOf(user)] = {
          ...user,
          speaking: true,
        };
        const data = query(
          collection(this.db, 'rooms'),
          where('channel', '==', this.route.snapshot.params['id'])
        );
        getDocs(data).then((docs) => {
          docs.forEach((doc_) => {
            const user_ = query(
              collection(this.db, doc_.ref.path, 'usersList'),
              where('uuid', '==', user.uid)
            );
            getDocs(user_).then((docs_) => {
              docs_.forEach((doc__) => {
                updateDoc(doc__.ref, {
                  speaking: true,
                });
              });
            });
          });
        });
      } else {
        const user = this.usersList.filter((u) => {
          if (u.uid === this.client.uid) return true;
          else return false;
        })[0];
        this.usersList[this.usersList.indexOf(user)] = {
          ...user,
          speaking: false,
        };
        const data = query(
          collection(this.db, 'rooms'),
          where('channel', '==', this.route.snapshot.params['id'])
        );
        getDocs(data).then((docs) => {
          docs.forEach((doc_) => {
            const user_ = query(
              collection(this.db, doc_.ref.path, 'usersList'),
              where('uuid', '==', user.uid)
            );
            getDocs(user_).then((docs_) => {
              docs_.forEach((doc__) => {
                updateDoc(doc__.ref, {
                  speaking: false,
                });
              });
            });
          });
        });
      }
    });
    const data = query(
      collection(this.db, 'rooms'),
      where('channel', '==', this.route.snapshot.params['id'])
    );
    const docs = await getDocs(data);
    await docs.forEach((doc) => {
      addDoc(collection(this.db, doc.ref.path, 'usersList'), {
        uuid: this.client.uid,
        name: this.authService.userInfo.userInfo.name,
        email: this.authService.userInfo.userInfo.email,
        speaking: false,
      });
    });

    this.usersList.push({
      name: this.authService.userInfo.userInfo.name!,
      uid: this.client.uid as number,
      email: this.authService.userInfo.userInfo.email!,
      speaking: false,
    });

    this.subs.push(
      this.roomService.streamOptions.subscribe((options) => {
        // Audio Streaming
        if (options.changeType === 'audio' && options.audio && !this.audioTrack)
          AgoraRTC.createMicrophoneAudioTrack()
            .then((track) => {
              this.audioTrack = track;
              this.client.publish([this.audioTrack]);
            })
            .catch((e) => {
              this.roomService.streamOptionsChangedUI.next({
                audio: false,
                video: this.streamOption.video,
                screen: this.streamOption.screen,
              });
            });
        else if (options.changeType === 'audio' && this.audioTrack) {
          if (options.audio) {
            AgoraRTC.createMicrophoneAudioTrack()
              .then((track) => {
                this.audioTrack = track;
                this.audioTrack.setEnabled(options.audio as boolean);
              })
              .catch((e) => {
                this.roomService.streamOptionsChangedUI.next({
                  audio: false,
                  video: this.streamOption.video,
                  screen: this.streamOption.screen,
                });
              });
          } else {
            this.audioTrack.setEnabled(options.audio as boolean);
          }
        }
        // Video Streaming
        else if (options.changeType === 'video') {
          if (this.screenTrack && this.screenTrack?.isPlaying) {
            this.screenTrack.close();
            this.roomService.usersCountChanged.next(this.users.length);
            this.roomService.streamOptionsChangedUI.next({
              audio: this.streamOption.audio,
              video: true,
              screen: false,
            });
            this.client.unpublish([this.screenTrack]);
            const data = query(
              collection(this.db, 'rooms'),
              where('channel', '==', this.route.snapshot.params['id'])
            );
            getDocs(data).then((docs) => {
              docs.forEach((doc_) => {
                const user = query(
                  collection(this.db, doc_.ref.path, 'users'),
                  where('uuid', '==', this.client.uid)
                );
                getDocs(user).then((docs) => {
                  docs.forEach((doc__) => {
                    deleteDoc(doc__.ref);
                  });
                });
              });
            });
          }
          if (options.video && !this.videoTrack) {
            AgoraRTC.createCameraVideoTrack({
              optimizationMode: 'detail',
              encoderConfig: '1080p',
            })
              .then((track) => {
                this.videoTrack = track;
                AgoraRTC.getCameras().then((cameras) => {
                  this.cameraIds = cameras;
                });
                const userIndex = this.users.indexOf({
                  name: this.authService.userInfo.userInfo.name!,
                  uid: this.client.uid as number,
                });
                if (userIndex === -1) {
                  this.users.push({
                    name: this.authService.userInfo.userInfo.name!,
                    uid: this.client.uid as number,
                  });
                  this.roomService.usersCountChanged.next(this.users.length);
                }
                const data = query(
                  collection(this.db, 'rooms'),
                  where('channel', '==', this.route.snapshot.params['id'])
                );
                getDocs(data).then(() => {
                  docs.forEach((doc) => {
                    addDoc(collection(this.db, doc.ref.path, 'users'), {
                      uuid: this.client.uid,
                      name: this.authService.userInfo.userInfo.name,
                    }).then(() => {
                      this.client.publish([this.videoTrack!]);
                    });
                  });
                  setTimeout(() => {
                    this.videoTrack!.play(
                      `stream-${
                        userIndex === -1 ? this.users.length - 1 : userIndex
                      }`
                    );
                  });
                });
              })
              .catch((e) => {
                this.roomService.streamOptionsChangedUI.next({
                  audio: this.streamOption.audio,
                  video: false,
                  screen: this.streamOption.screen,
                });
              });
          } else if (options.video && this.videoTrack) {
            if (this.streamOption.video) {
              if (this.currentCamera >= this.cameraIds?.length - 1)
                this.currentCamera = 0;
              else this.currentCamera++;
              this.videoTrack.close();
              this.client.unpublish([this.videoTrack]).then(() => {
                this.videoTrack = undefined;
              });
              AgoraRTC.createCameraVideoTrack({
                optimizationMode: 'detail',
                encoderConfig: '1080p',
                cameraId: this.cameraIds[this.currentCamera].deviceId,
              }).then((track) => {
                this.videoTrack = track;
                this.client.publish([this.videoTrack]);
                const userIndex = this.users.indexOf({
                  name: this.authService.userInfo.userInfo.name!,
                  uid: this.client.uid as number,
                });
                setTimeout(() => {
                  this.videoTrack!.play(
                    `stream-${
                      userIndex === -1 ? this.users.length - 1 : userIndex
                    }`
                  );
                });
              });
            } else {
              AgoraRTC.createCameraVideoTrack({
                optimizationMode: 'detail',
                encoderConfig: '1080p',
              })
                .then((track) => {
                  this.videoTrack = track;
                  this.client.publish([this.videoTrack]);
                  const userIndex = this.users.indexOf({
                    name: this.authService.userInfo.userInfo.name!,
                    uid: this.client.uid as number,
                  });
                  if (userIndex === -1) {
                    this.users.push({
                      name: this.authService.userInfo.userInfo.name!,
                      uid: this.client.uid as number,
                    });
                    this.roomService.usersCountChanged.next(this.users.length);
                  }
                  const data = query(
                    collection(this.db, 'rooms'),
                    where('channel', '==', this.route.snapshot.params['id'])
                  );
                  getDocs(data).then(() => {
                    docs.forEach((doc) => {
                      addDoc(collection(this.db, doc.ref.path, 'users'), {
                        uuid: this.client.uid,
                        name: this.authService.userInfo.userInfo.name,
                      });
                    });
                    setTimeout(() => {
                      this.videoTrack!.play(
                        `stream-${
                          userIndex === -1 ? this.users.length - 1 : userIndex
                        }`
                      );
                    });
                  });
                })
                .catch((e) => {
                  this.roomService.streamOptionsChangedUI.next({
                    audio: this.streamOption.audio,
                    video: false,
                    screen: this.streamOption.screen,
                  });
                });
            }
          } else if (!options.video && this.videoTrack) {
            this.users.splice(
              this.users.indexOf({
                name: this.authService.userInfo.userInfo.name!,
                uid: this.client.uid as number,
              }),
              1
            );
            this.roomService.usersCountChanged.next(this.users.length);
            this.videoTrack.close();
            this.client.unpublish([this.videoTrack]);
            const data = query(
              collection(this.db, 'rooms'),
              where('channel', '==', this.route.snapshot.params['id'])
            );
            getDocs(data).then((docs) => {
              docs.forEach((doc_) => {
                const user = query(
                  collection(this.db, doc_.ref.path, 'users'),
                  where('uuid', '==', this.client.uid)
                );
                getDocs(user).then((docs) => {
                  docs.forEach((doc__) => {
                    deleteDoc(doc__.ref);
                  });
                });
              });
            });
          }
        } else if (options.changeType === 'screen') {
          // Screen Sharing
          if (this.videoTrack && this.videoTrack?.isPlaying) {
            this.videoTrack.close();
            this.client.unpublish([this.videoTrack]);
            this.roomService.usersCountChanged.next(this.users.length);
            this.roomService.streamOptionsChangedUI.next({
              audio: this.streamOption.audio,
              video: false,
              screen: true,
            });
            const data = query(
              collection(this.db, 'rooms'),
              where('channel', '==', this.route.snapshot.params['id'])
            );
            getDocs(data).then((docs) => {
              docs.forEach((doc_) => {
                const user = query(
                  collection(this.db, doc_.ref.path, 'users'),
                  where('uuid', '==', this.client.uid)
                );
                getDocs(user).then((docs) => {
                  docs.forEach((doc__) => {
                    deleteDoc(doc__.ref);
                  });
                });
              });
            });
          }
          if (options.screen && !this.screenTrack) {
            AgoraRTC.createScreenVideoTrack(
              {
                encoderConfig: '1080p',
                optimizationMode: 'detail',
              },
              'disable'
            )
              .then((track) => {
                this.screenTrack = track;
                this.client.publish([this.screenTrack]);
                const userIndex = this.users.indexOf({
                  name: this.authService.userInfo.userInfo.name!,
                  uid: this.client.uid as number,
                });
                if (userIndex === -1) {
                  this.users.push({
                    name: this.authService.userInfo.userInfo.name!,
                    uid: this.client.uid as number,
                  });
                  this.roomService.usersCountChanged.next(this.users.length);
                }
                const data = query(
                  collection(this.db, 'rooms'),
                  where('channel', '==', this.route.snapshot.params['id'])
                );
                getDocs(data).then(() => {
                  docs.forEach((doc) => {
                    addDoc(collection(this.db, doc.ref.path, 'users'), {
                      uuid: this.client.uid,
                      name: this.authService.userInfo.userInfo.name,
                    });
                  });
                  setTimeout(() => {
                    this.screenTrack!.play(
                      `stream-${
                        userIndex === -1 ? this.users.length - 1 : userIndex
                      }`
                    );
                  });
                });
              })
              .catch((e) => {
                this.roomService.streamOptionsChangedUI.next({
                  audio: this.streamOption.audio,
                  video: this.streamOption.video,
                  screen: false,
                });
              });
          } else if (!options.screen && this.screenTrack) {
            this.users.splice(
              this.users.indexOf({
                name: this.authService.userInfo.userInfo.name!,
                uid: this.client.uid as number,
              }),
              1
            );
            this.roomService.usersCountChanged.next(this.users.length);
            this.screenTrack.close();
            this.client.unpublish([this.screenTrack]);
            const data = query(
              collection(this.db, 'rooms'),
              where('channel', '==', this.route.snapshot.params['id'])
            );
            getDocs(data).then((docs) => {
              docs.forEach((doc_) => {
                const user = query(
                  collection(this.db, doc_.ref.path, 'users'),
                  where('uuid', '==', this.client.uid)
                );
                getDocs(user).then((docs) => {
                  docs.forEach((doc__) => {
                    deleteDoc(doc__.ref);
                  });
                });
              });
            });
          } else if (options.screen && this.screenTrack) {
            AgoraRTC.createScreenVideoTrack(
              {
                encoderConfig: '1080p',
                optimizationMode: 'detail',
              },
              'disable'
            )
              .then((track) => {
                this.screenTrack = track;
                this.client.publish([this.screenTrack]);
                const userIndex = this.users.indexOf({
                  name: this.authService.userInfo.userInfo.name!,
                  uid: this.client.uid as number,
                });
                if (userIndex === -1) {
                  this.users.push({
                    name: this.authService.userInfo.userInfo.name!,
                    uid: this.client.uid as number,
                  });
                  this.roomService.usersCountChanged.next(this.users.length);
                }
                const data = query(
                  collection(this.db, 'rooms'),
                  where('channel', '==', this.route.snapshot.params['id'])
                );
                getDocs(data).then(() => {
                  docs.forEach((doc) => {
                    addDoc(collection(this.db, doc.ref.path, 'users'), {
                      uuid: this.client.uid,
                      name: this.authService.userInfo.userInfo.name,
                    });
                  });
                  setTimeout(() => {
                    this.screenTrack!.play(
                      `stream-${
                        userIndex === -1 ? this.users.length - 1 : userIndex
                      }`
                    );
                  });
                });
              })
              .catch((e) => {
                this.roomService.streamOptionsChangedUI.next({
                  audio: this.streamOption.audio,
                  video: this.streamOption.video,
                  screen: false,
                });
              });
          }
        }
      })
    );
  }

  onShowMenu(e: any) {
    this.renderer.setStyle(
      document.querySelector('body'),
      'height',
      '100vh',
      RendererStyleFlags2.Important
    );
    this.renderer.setStyle(
      document.querySelector('html'),
      'height',
      '100vh',
      RendererStyleFlags2.Important
    );
    if (e === 'users') this.usersListMenu = true;
    else if (e === 'chat') this.chatMenu = true;
  }

  closeMenu() {
    this.onCloseMessage();
    this.renderer.removeStyle(document.querySelector('body'), 'height');
    this.renderer.removeStyle(document.querySelector('html'), 'height');
    this.renderer.setStyle(
      document.querySelector('body'),
      'height',
      '*',
      RendererStyleFlags2.Important
    );
    this.renderer.setStyle(
      document.querySelector('html'),
      'height',
      '*',
      RendererStyleFlags2.Important
    );
    if (this.usersListMenu) this.usersListMenu = false;
    else if (this.chatMenu) this.chatMenu = false;
  }

  onHandleMessage(data: string) {
    this.message = data;
  }

  onCloseMessage() {
    this.message = undefined;
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
    this.client.unpublish();
    this.audioTrack?.close();
    this.screenTrack?.close();
    this.videoTrack?.close();
    const data = query(
      collection(this.db, 'rooms'),
      where('channel', '==', this.route.snapshot.params['id'])
    );
    getDocs(data).then((docs) => {
      docs.forEach((doc_) => {
        const user = query(
          collection(this.db, doc_.ref.path, 'users'),
          where('uuid', '==', this.client.uid)
        );
        getDocs(user).then((docs) => {
          docs.forEach((doc__) => {
            deleteDoc(doc__.ref);
          });
        });
      });
    });
    getDocs(data).then((docs) => {
      docs.forEach((doc_) => {
        const user = query(
          collection(this.db, doc_.ref.path, 'usersList'),
          where('uuid', '==', this.client.uid)
        );
        getDocs(user).then((docs) => {
          docs.forEach((doc__) => {
            deleteDoc(doc__.ref);
          });
        });
      });
    });
    if (this.usersList.length <= 1) {
      getDocs(data).then((docs) => {
        docs.forEach((doc) => {
          deleteDoc(doc.ref);
        });
      });
    }
  }
}

import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  RendererStyleFlags2,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from '@firebase/firestore';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { NgxSpinnerService } from 'ngx-spinner';
import { RoomService } from '../services/room.service';
import AgoraRTC, {
  ICameraVideoTrack,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { environment } from 'src/environments/environment';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, OnDestroy {
  usersListMenu = false;
  chatMenu = false;
  closeIcon = faTimes;
  token: string;
  db: any;
  loading = false;
  users: string[] = [];
  usersList: string[] = [];
  chatMessages: { [s: string]: string }[] = [];
  videoCalls: any[] = [];
  speakers: string[] = [];
  subs: Subscription[] = [];
  streamOption: { [s: string]: boolean } = {
    audio: false,
    video: false,
    screen: false,
  };

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
          this.createRoom();
        }
        this.spinner.hide();
        this.loading = false;
      });
  }

  ngOnInit(): void {}

  async createRoom() {
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    await client.join(
      environment.APPID,
      this.route.snapshot.params['id'],
      this.token
    );

    this.usersList.push(this.authService.userInfo.userInfo.name!);

    let audioTrack: IMicrophoneAudioTrack;
    let videoTrack: ICameraVideoTrack;
    let screenTrack: ILocalVideoTrack;

    if (this.streamOption.audio)
      audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    if (this.streamOption.video)
      videoTrack = await AgoraRTC.createCameraVideoTrack();
    if (audioTrack! && videoTrack!)
      await client.publish([audioTrack, videoTrack]);
    else if (videoTrack!) await client.publish([videoTrack]);
    else if (audioTrack!) await client.publish([audioTrack]);

    if (videoTrack!) {
      this.users.push(this.authService.userInfo.userInfo.name!);
      this.roomService.usersCountChanged.next(this.users.length);
      setTimeout(() => {
        videoTrack!.play(`stream-${this.users.length}`);
      });
    }

    this.subs.push(
      this.roomService.streamOptions.subscribe((options) => {
        // Audio Streaming
        if (options.changeType === 'audio')
          audioTrack.setEnabled(options.audio as boolean);
        // Video Streaming
        else if (options.changeType === 'video') {
          if (screenTrack && screenTrack?.isPlaying) {
            this.users.splice(
              this.users.indexOf(this.authService.userInfo.userInfo.name!),
              1
            );
            screenTrack.close();
            this.roomService.usersCountChanged.next(this.users.length);
            this.roomService.streamOptionsChangedUI.next({
              audio: this.streamOption.audio,
              video: true,
              screen: false,
            });
          }
          if (options.video && !videoTrack) {
            AgoraRTC.createCameraVideoTrack().then((track) => {
              videoTrack = track;
              this.users.push(this.authService.userInfo.userInfo.name!);
              this.roomService.usersCountChanged.next(this.users.length);
              setTimeout(() => {
                videoTrack!.play(`stream-${this.users.length}`);
              });
            });
          } else if (options.video && videoTrack) {
            this.users.push(this.authService.userInfo.userInfo.name!);
            this.roomService.usersCountChanged.next(this.users.length);
            videoTrack.setEnabled(true);
            setTimeout(() => {
              videoTrack!.play(`stream-${this.users.length}`);
            });
          } else if (!options.video && videoTrack) {
            this.users.splice(
              this.users.indexOf(this.authService.userInfo.userInfo.name!),
              1
            );
            this.roomService.usersCountChanged.next(this.users.length);
            videoTrack.setEnabled(false);
          }
        } else if (options.changeType === 'screen') {
          // Screen Sharing
          if (videoTrack && videoTrack?.isPlaying) {
            this.users.splice(
              this.users.indexOf(this.authService.userInfo.userInfo.name!),
              1
            );
            this.roomService.usersCountChanged.next(this.users.length);
            videoTrack.setEnabled(false);
            this.roomService.streamOptionsChangedUI.next({
              audio: this.streamOption.audio,
              video: false,
              screen: true,
            });
          }
          if (options.screen && !screenTrack) {
            AgoraRTC.createScreenVideoTrack(
              {
                encoderConfig: '1080p',
                optimizationMode: 'detail',
              },
              'disable'
            ).then((track) => {
              screenTrack = track;
              if (
                this.users.indexOf(this.authService.userInfo.userInfo.name!) ===
                -1
              ) {
                this.users.push(this.authService.userInfo.userInfo.name!);
                this.roomService.usersCountChanged.next(this.users.length);
              }
              setTimeout(() => {
                screenTrack!.play(`stream-${this.users.length}`);
              });
            });
          } else if (!options.screen && screenTrack) {
            this.users.splice(
              this.users.indexOf(this.authService.userInfo.userInfo.name!),
              1
            );
            this.roomService.usersCountChanged.next(this.users.length);
            screenTrack.close();
          } else if (options.screen && screenTrack) {
            AgoraRTC.createScreenVideoTrack(
              {
                encoderConfig: '1080p',
                optimizationMode: 'detail',
              },
              'disable'
            ).then((track) => {
              screenTrack = track;
              if (
                this.users.indexOf(this.authService.userInfo.userInfo.name!) ===
                -1
              ) {
                this.users.push(this.authService.userInfo.userInfo.name!);
                this.roomService.usersCountChanged.next(this.users.length);
              }
              setTimeout(() => {
                screenTrack!.play(`stream-${this.users.length}`);
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

  ngOnDestroy() {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

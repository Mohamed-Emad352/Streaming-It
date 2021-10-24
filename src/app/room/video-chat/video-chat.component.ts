import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  faDesktop,
  faMicrophone,
  faMicrophoneSlash,
  faPhone,
  faVideo,
  faVideoSlash,
  faVolumeUp,
  faUsers,
  faCommentAlt,
  faCopy,
  faSyncAlt,
} from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { RoomService } from 'src/app/services/room.service';

@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.scss'],
})
export class VideoChatComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() users?: { [s: string]: string | number }[];
  @Input() speakers?: string[];
  speakerIcon = faVolumeUp;
  audioIcon = faMicrophone;
  videoIcon = faVideo;
  screenIcon = faDesktop;
  swapIcon = faSyncAlt;
  leaveIcon = faPhone;
  audioMutedIcon = faMicrophoneSlash;
  videoDisabledIcon = faVideoSlash;
  usersListIcon = faUsers;
  chatIcon = faCommentAlt;
  copyIcon = faCopy;
  audio = false;
  video = false;
  screen = false;
  @Output() showMenuEvent = new EventEmitter<string>();
  subs: Subscription[] = [];
  @Input() camerasId!: MediaDeviceInfo[];

  constructor(
    private renderer: Renderer2,
    private roomService: RoomService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.roomService.publisher.subscribe((pub) => {
        if (pub) {
          this.toggleAudio();
        }
      })
    );
    this.subs.push(
      this.roomService.usersCountChanged.subscribe((count) => {
        this.optimizeUI();
      })
    );
    this.subs.push(
      this.roomService.streamOptionsChangedUI.subscribe((options) => {
        this.audio = options.audio as boolean;
        this.screen = options.screen as boolean;
        this.video = options.video as boolean;
      })
    );
  }

  ngAfterViewInit() {
    this.optimizeUI();
  }

  optimizeUI() {
    setTimeout(() => {
      document.querySelectorAll('.user').forEach((u) => {
        if (this.users?.length === 1) {
          this.renderer.setStyle(u, 'grid-column', '1 / span 12');
          this.renderer.setStyle(u, 'grid-row', '1 / 3');
        } else {
          this.renderer.removeStyle(u, 'grid-column');
          this.renderer.removeStyle(u, 'grid-row');
          this.renderer.setStyle(u, 'grid-column', 'span 6');
        }
      });
    });
  }

  toggleAudio() {
    this.audio = !this.audio;
    this.roomService.streamOptions.next({
      audio: this.audio,
      video: this.video,
      screen: this.screen,
      changeType: 'audio',
    });
  }

  toggleVideo() {
    this.video = !this.video;
    this.roomService.streamOptions.next({
      audio: this.audio,
      video: this.video,
      screen: this.screen,
      changeType: 'video',
    });
  }

  toggleScreen() {
    this.screen = !this.screen;
    this.roomService.streamOptions.next({
      audio: this.audio,
      video: this.video,
      screen: this.screen,
      changeType: 'screen',
    });
  }

  swapVideo() {
    this.roomService.streamOptions.next({
      audio: this.audio,
      video: this.video,
      screen: this.screen,
      changeType: 'screen',
    });
  }

  showMenu(menuType: string) {
    this.showMenuEvent.emit(menuType);
  }

  onCopyRoomLink(div: HTMLSpanElement) {
    navigator.clipboard.writeText(this.route.snapshot.params['id']);
    this.renderer.setProperty(div, 'innerText', 'Copied!');
    setTimeout(() => {
      this.renderer.setProperty(div, 'innerText', 'Copy room code ');
    }, 5000);
  }

  onFullscreen(div: HTMLDivElement) {
    div.children[1].requestFullscreen();
    document.exitFullscreen();
  }

  ngOnDestroy() {
    this.subs.forEach((sub) => {
      sub.unsubscribe();
    });
  }
}

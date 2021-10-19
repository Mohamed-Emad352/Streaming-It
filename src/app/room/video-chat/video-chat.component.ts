import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewInit,
  Component,
  EventEmitter,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
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
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-video-chat',
  templateUrl: './video-chat.component.html',
  styleUrls: ['./video-chat.component.scss'],
})
export class VideoChatComponent implements OnInit, AfterViewInit {
  users = [1, 2, 3, 4, 5, 6];
  speakers = ['mohamed', 'ahmed', 'khaled', 'mostafa'];
  speakerIcon = faVolumeUp;
  audioIcon = faMicrophone;
  videoIcon = faVideo;
  screenIcon = faDesktop;
  leaveIcon = faPhone;
  audioMutedIcon = faMicrophoneSlash;
  videoDisabledIcon = faVideoSlash;
  usersListIcon = faUsers;
  chatIcon = faCommentAlt;
  audio = false;
  video = false;
  screen = false;
  @Output() showMenuEvent = new EventEmitter<string>();

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {}

  ngAfterViewInit() {
    this.optimizeUI();
  }

  optimizeUI() {
    document.querySelectorAll('.user').forEach((u) => {
      if (document.querySelectorAll('.user').length === 1) {
        this.renderer.setStyle(u, 'grid-column', '1 / span 12');
        this.renderer.setStyle(u, 'grid-row', '1 / 3');
      } else {
      }
    });
  }

  toggleAudio() {
    this.audio = !this.audio;
  }

  toggleVideo() {
    this.video = !this.video;
  }

  toggleScreen() {
    this.screen = !this.screen;
  }

  showMenu(menuType: string) {
    this.showMenuEvent.emit(menuType);
  }
}

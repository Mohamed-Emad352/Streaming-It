import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {
  faTimes,
  faVolumeMute,
  faVolumeUp,
} from '@fortawesome/free-solid-svg-icons';
import { RoomUserInfo } from 'src/app/models/roomUserInfo.interface';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  @Input() users: RoomUserInfo[] = [];
  soundIcon = faVolumeUp;
  soundIconMute = faVolumeMute;
  kickIcon = faTimes;
  @Output() messageEvent = new EventEmitter<string>();
  constructor() {}

  ngOnInit(): void {}

  closeMessage() {}
}

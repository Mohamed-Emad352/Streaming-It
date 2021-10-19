import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  RendererStyleFlags2,
} from '@angular/core';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, OnDestroy {
  usersListMenu = false;
  chatMenu = false;
  closeIcon = faTimes;

  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {}

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

  ngOnDestroy() {}
}

import {
  Component,
  ElementRef,
  Input,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { faVolumeUp } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  @Input() users: string[] = [];
  soundIcon = faVolumeUp;
  currentUser: any;
  currentMenu: any;
  constructor(private renderer: Renderer2) {}

  ngOnInit(): void {
    document.querySelector('.page')?.addEventListener('click', (e) => {
      try {
        if (
          this.currentMenu &&
          e.target !== this.currentMenu &&
          !this.currentMenu.parentElement.contains(e.target as Node)
        ) {
          this.currentMenu.remove();
        }
      } catch {}
    });
  }

  showMenu(user: HTMLDivElement) {
    if (this.currentMenu) {
      this.currentMenu.remove();
      this.currentMenu = null;
    }
    this.currentUser = user.parentElement;
    const menu = this.renderer.createElement('div');
    this.renderer.addClass(menu, 'menu-options');
    menu.innerHTML = `Kick out`;
    this.currentMenu = menu;
    this.renderer.appendChild(user, menu);
  }
}

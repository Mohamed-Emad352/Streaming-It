import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  @Input() chatMessages?: { [s: string]: string }[];

  constructor(private auth: AuthService) {}

  ngOnInit(): void {}

  checkMessageOwner(message: HTMLDivElement) {
    if (message.dataset['email'] === this.auth.userInfo.userInfo.email)
      return true;
    else return false;
  }
}

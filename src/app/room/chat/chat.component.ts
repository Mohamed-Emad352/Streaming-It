import { Component, ElementRef, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  chatMessages = [
    {
      name: 'Mohamed Emad',
      message: 'Hello there!',
      email: 'memad352s@gmail.com',
    },
    {
      name: 'Mostafa Ayman',
      message: 'Hey how u doing?',
      email: 'memad212@gmail.com',
    },
    {
      name: 'Mostafa Ayman',
      message:
        'Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati distinctio iusto qui sit id? Vel, iure corrupti maiores distinctio veniam officia perspiciatis sit quasi laudantium consequatur laborum sapiente repellendus tempore.',
      email: 'memad30@ymail.com',
    },
    {
      name: 'Mohamed Emad',
      message: 'Hello there!',
      email: 'memad91@ymail.com',
    },
    {
      name: 'Mostafa Ayman',
      message: 'Hey how u doing?',
      email: 'memad12@gmail.com',
    },
    {
      name: 'Mohamed Emad',
      message: 'Hello there!',
      email: 'memad3462@xmail.com',
    },
    {
      name: 'Mostafa Ayman',
      message: 'Hey how u doing?',
      email: 'memad352@gmail.com',
    },
  ];

  constructor(private auth: AuthService) {}

  ngOnInit(): void {}

  checkMessageOwner(message: HTMLDivElement) {
    if (message.dataset['email'] === this.auth.userInfo.userInfo.email)
      return true;
    else return false;
  }
}

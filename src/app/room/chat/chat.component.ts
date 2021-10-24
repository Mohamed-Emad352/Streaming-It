import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { collection, getFirestore, query } from '@firebase/firestore';
import { addDoc, getDocs, where } from 'firebase/firestore';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
  @Input() chatMessages?: { [s: string]: string }[];

  constructor(private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit(): void {}

  checkMessageOwner(message: HTMLDivElement) {
    if (message.dataset['email'] === this.auth.userInfo.userInfo.email)
      return true;
    else return false;
  }

  onSendMessage(frm: NgForm) {
    const db = getFirestore();
    const data = query(
      collection(db, 'rooms'),
      where('channel', '==', this.route.snapshot.params['id'])
    );
    getDocs(data)
      .then((docs) => {
        docs.forEach((doc) => {
          addDoc(collection(db, doc.ref.path, 'chatMessages'), {
            name: this.auth.userInfo.userInfo.name,
            email: this.auth.userInfo.userInfo.email,
            message: frm.controls['message'].value,
            time: new Date(),
          });
        });
      })
      .then(() => {
        frm.reset();
      });
  }
}

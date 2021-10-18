import { Injectable, OnInit } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { environment } from '../../environments/environment';
import {
  getFirestore,
  addDoc,
  collection,
  where,
  query,
  getDocs,
} from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';
import { UserInfo } from '../models/userInfo.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  db: any;
  user!: BehaviorSubject<any>;
  userInfo!: UserInfo;

  constructor() {}

  initialize() {
    this.user = new BehaviorSubject<any>(null);
    this.userInfo = new UserInfo();
    initializeApp(environment.firebaseConfig);
    this.db = getFirestore();
    getAuth().onAuthStateChanged(() => {
      if (getAuth().currentUser) {
        const userData = query(
          collection(this.db, 'users'),
          where('email', '==', getAuth().currentUser?.email)
        );
        getDocs(userData).then((doc) => {
          doc.forEach((d) => {
            if (d.data()) {
              this.userInfo.userInfo = {
                email: d.data().email,
                name: d.data().name,
              };
            }
          });
          this.user.next(getAuth().currentUser);
        });
      }
    });
  }

  logIn(email: string, password: string) {
    const auth = getAuth();
    return signInWithEmailAndPassword(auth, email, password);
  }

  signUp(email: string, name: string, password: string) {
    return addDoc(collection(this.db, 'users'), {
      email: email,
      name: name,
    }).then(() => {
      return createUserWithEmailAndPassword(getAuth(), email, password);
    });
  }

  logOut() {
    signOut(getAuth());
    this.user.next(null);
  }
}

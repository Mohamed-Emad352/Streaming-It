import {
  AfterContentChecked,
  AfterContentInit,
  AfterViewChecked,
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { Router } from '@angular/router';
import { getAuth } from '@firebase/auth';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { UserInfo } from '../models/userInfo.model';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { UiService } from '../services/ui.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterContentChecked, OnDestroy {
  auth: boolean = false;
  userInfo!: UserInfo;
  isAuth = false;
  isLoading = false;
  userSub!: Subscription;
  db: any;
  message?: string;
  closeIcon = faTimes;

  constructor(
    private ui: UiService,
    private router: Router,
    private authService: AuthService,
    private tokenService: TokenService,
    private spinner: NgxSpinnerService
  ) {
    this.message = this.router.getCurrentNavigation()?.extras.state?.message;
  }

  ngOnInit(): void {
    this.userInfo = this.authService.userInfo;
    this.userSub = this.authService.user.subscribe((user) => {
      if (user) this.isAuth = true;
      else this.isAuth = false;
    });
    this.db = getFirestore();
  }

  ngAfterContentChecked() {
    setTimeout(() => {
      this.ui.authSubject.subscribe((a) => {
        this.auth = a;
      });
    });
  }

  onAuthNavigation() {
    this.ui.authAnimation.next('out');
    this.message = undefined;
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 400);
  }

  onLogout() {
    this.authService.logOut();
  }

  onGenerateRoom() {
    if (getAuth().currentUser) {
      this.spinner.show();
      this.tokenService.generateToken('publisher').subscribe((data) => {
        this.spinner.hide();
        addDoc(collection(this.db, 'rooms'), {
          channel: data.channel,
        }).then(() => {
          this.router.navigate(['/room', data.channel], {
            state: { token: data.token, publisher: true },
          });
          this.spinner.hide();
        });
      });
    } else {
      this.router.navigate(['/auth', 'login']);
    }
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }
}

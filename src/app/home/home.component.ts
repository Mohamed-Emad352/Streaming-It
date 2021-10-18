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
import { Subscription } from 'rxjs';
import { UserInfo } from '../models/userInfo.model';
import { AuthService } from '../services/auth.service';
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

  constructor(
    private ui: UiService,
    private renderer: Renderer2,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userInfo = this.authService.userInfo;
    this.userSub = this.authService.user.subscribe((user) => {
      if (user) this.isAuth = true;
      else this.isAuth = false;
    });
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
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 400);
  }

  onLogout() {
    this.authService.logOut();
  }

  ngOnDestroy() {
    this.userSub.unsubscribe();
  }
}

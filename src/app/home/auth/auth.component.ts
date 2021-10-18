import { Component, OnDestroy, OnInit } from '@angular/core';
import { UiService } from 'src/app/services/ui.service';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  animations: [
    trigger('fadeinout', [
      state('out', style({ opacity: 0, transform: 'translateY(-40px)' })),
      transition('void => *', [
        style({
          opacity: 0,
          transform: 'translateY(-40px)',
        }),
        animate('0.4s ease-in-out'),
      ]),
      transition('* => out', [animate('0.4s ease-in-out')]),
    ]),
  ],
})
export class AuthComponent implements OnInit, OnDestroy {
  closeIcon = faTimes;
  animationState: string = '';
  loadingSub!: Subscription;

  constructor(
    private ui: UiService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.ui.authSubject.next(true);
    this.ui.authAnimation.subscribe((val) => {
      this.animationState = val;
    });
    this.loadingSub = this.ui.loadingSpinner.subscribe((state) => {
      if (state) this.spinner.show();
      else this.spinner.hide();
    });
  }

  onAuthNavigation() {
    this.ui.authAnimation.next('out');
    setTimeout(() => {
      this.router.navigate(['/']);
    }, 400);
  }

  ngOnDestroy(): void {
    this.ui.authSubject.next(false);
    this.ui.authAnimation.next('');
    this.loadingSub.unsubscribe();
  }
}

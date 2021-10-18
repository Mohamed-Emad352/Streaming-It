import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import {
  faExclamationCircle,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { NgxSpinnerService } from 'ngx-spinner';
import { AuthService } from 'src/app/services/auth.service';
import { UiService } from 'src/app/services/ui.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  dangerIcon = faExclamationCircle;
  error = false;
  timesIcon = faTimes;

  constructor(
    private auth: AuthService,
    private ui: UiService,
    private router: Router,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {}

  onLogin(form: NgForm) {
    this.spinner.show();
    this.auth
      .logIn(form.controls['email'].value, form.controls['password'].value)
      .then(() => {
        this.ui.authAnimation.next('out');
        setTimeout(() => {
          this.spinner.hide();
          this.router.navigate(['/']);
        }, 400);
      })
      .catch(() => {
        this.error = true;
        this.spinner.hide();
      });
  }

  onCloseError() {
    this.error = false;
  }
}

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  AbstractControlOptions,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { collection, getDocs, getFirestore, query } from '@firebase/firestore';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { where } from 'firebase/firestore';
import { AuthService } from 'src/app/services/auth.service';
import { UiService } from 'src/app/services/ui.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent implements OnInit {
  form!: FormGroup;
  dangerIcon = faExclamationCircle;
  db: any;
  fetchingEmail = false;

  constructor(
    private auth: AuthService,
    private ui: UiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.db = getFirestore();
    this.form = new FormGroup(
      {
        email: new FormControl(
          '',
          [Validators.email, Validators.required],
          [this.validateEmail.bind(this)]
        ),
        name: new FormControl('', [Validators.required]),
        password: new FormControl('', [
          Validators.minLength(6),
          Validators.required,
        ]),
        confirmPassword: new FormControl('', [Validators.minLength(6)]),
      },
      this.passwordValidator
    );
  }

  onSignup() {
    this.ui.loadingSpinner.next(true);
    this.auth
      .signUp(
        this.form.get('email')?.value,
        this.form.get('name')?.value,
        this.form.get('password')?.value
      )
      .then(() => {
        this.ui.authAnimation.next('out');
        setTimeout(() => {
          this.ui.loadingSpinner.next(false);
          this.router.navigate(['/']);
        }, 400);
      });
  }

  passwordValidator(
    form: AbstractControl
  ): ValidatorFn | { [s: string]: boolean } | null {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null
      : { passwordDontMatch: true };
  }

  async validateEmail(): Promise<{ [s: string]: boolean } | null> {
    this.fetchingEmail = true;
    const userData = query(
      collection(this.db, 'users'),
      where('email', '==', this.form.get('email')!.value)
    );
    const docs = await getDocs(userData);
    let exists = false;
    docs.forEach((doc) => {
      this.fetchingEmail = false;
      exists = true;
    });
    this.fetchingEmail = false;
    if (exists) return { emailExists: true };
    else return null;
  }
}

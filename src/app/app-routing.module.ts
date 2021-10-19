import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoomAuthenticationGuard } from './guards/roomAuthentication-guard.guard';
import { AuthComponent } from './home/auth/auth.component';
import { LoginComponent } from './home/Auth/login/login.component';
import { SignupComponent } from './home/Auth/signup/signup.component';
import { HomeComponent } from './home/home.component';
import { RoomComponent } from './room/room.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: 'auth',
        component: AuthComponent,
        children: [
          { path: 'login', component: LoginComponent },
          { path: 'signup', component: SignupComponent },
          { path: '', redirectTo: '/', pathMatch: 'full' },
        ],
      },
    ],
  },
  {
    path: 'room/:id',
    component: RoomComponent,
    canActivate: [RoomAuthenticationGuard],
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

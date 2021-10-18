import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  public authSubject = new BehaviorSubject<boolean>(false);
  public authAnimation = new BehaviorSubject<string>('');
  public loadingSpinner = new BehaviorSubject<boolean>(false);
  constructor() {}
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoomService {
  public publisher = new BehaviorSubject<boolean>(false);
  public streamOptions = new BehaviorSubject<{ [s: string]: boolean | string }>(
    {
      audio: false,
      video: false,
      screen: false,
      changeType: 'audio',
    }
  );
  public streamOptionsChangedUI = new Subject<{
    [s: string]: boolean | string;
  }>();
  public usersCountChanged = new BehaviorSubject<number>(0);
  constructor() {}
}

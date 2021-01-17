import { Injectable } from '@angular/core';
import { AppService } from './app.service';

declare const browser: any;

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private app: AppService) { }

  create(message: string, type: string | any = 'basic') {
    if (this.app.isWebExtension) {
      browser.notifications.create({
        type: type,
        title: 'Firestore Manager',
        iconUrl: 'assets/images/firestore_logo.png',
        message: message
      });
    }
  }
}

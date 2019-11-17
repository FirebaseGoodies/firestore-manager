import { Injectable } from '@angular/core';

@Injectable()
export class NotificationService {

  constructor() { }

  create(message: string, type: string | any = 'basic') {
    try {
      browser.notifications.create({
        type: type,
        title: 'Firestore Manager',
        iconUrl: 'assets/images/firestore_logo.png',
        message: message
      });
    } catch(error) {
      console.log(error.message);
    }
  }
}

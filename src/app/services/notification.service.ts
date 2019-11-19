import { Injectable } from '@angular/core';
import { DummyService } from './dummy.service';

@Injectable()
export class NotificationService {

  constructor(private dummy: DummyService) { }

  create(message: string, type: string | any = 'basic') {
    if (this.dummy.isWebExtension) {
      browser.notifications.create({
        type: type,
        title: 'Firestore Manager',
        iconUrl: 'assets/images/firestore_logo.png',
        message: message
      });
    }
  }
}

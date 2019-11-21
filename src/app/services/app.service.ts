import { Injectable } from '@angular/core';

@Injectable()
export class AppService {

  isWebExtension: boolean = false;

  constructor() {
    try {
      const id = browser.runtime.id;
      console.info('Extension id:', id);
      this.isWebExtension = true;
    } catch(error) {
      console.log(error.message);
      //this.isWebExtension = false;
    }
  }

}

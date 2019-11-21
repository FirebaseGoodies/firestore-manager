import { Injectable } from '@angular/core';

@Injectable()
export class AppService {

  private static instance = null;
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

  static getInstance() {
    if (AppService.instance == null) {
      AppService.instance = new AppService();
    }
    return AppService.instance;
  }

}

import { Injectable } from '@angular/core';

@Injectable()
export class AppService {

  isWebExtension: boolean = false;

  constructor() {
    try {
      this.isWebExtension = !!browser;
    } catch(error) {
      // console.log(error.message);
      // this.isWebExtension = false;
    }
  }

}

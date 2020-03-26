import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
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

  getUrl(path: string) {
    const sanitizedPath = path.replace('/^[.|\/]+/', '');
    return this.isWebExtension ? browser.extension.getURL('index.html?page=' + sanitizedPath) : './' + sanitizedPath;
  }

}

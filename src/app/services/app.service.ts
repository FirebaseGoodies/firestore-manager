import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  isWebExtension: boolean = false;
  links: any = {
    github: 'https://github.com/AXeL-dev/firestore-manager',
    releases: 'https://github.com/AXeL-dev/firestore-manager/releases',
    issueTracker: 'https://github.com/AXeL-dev/firestore-manager/issues',
    firefoxAddon: 'https://addons.mozilla.org/firefox/addon/firestore-manager'
  };

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

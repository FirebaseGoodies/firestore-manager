import { Injectable } from '@angular/core';
import { sanitizePath } from 'src/app/helpers/url.helper';

declare const browser: any;

@Injectable({
  providedIn: 'root'
})
export class AppService {

  isWebExtension: boolean = false;
  explorerUrl: string;
  backupUrl: string;
  links: any = {
    github: 'https://github.com/FirebaseGoodies/firestore-manager',
    releases: 'https://github.com/FirebaseGoodies/firestore-manager/releases',
    issueTracker: 'https://github.com/FirebaseGoodies/firestore-manager/issues',
    firefoxAddon: 'https://addons.mozilla.org/firefox/addon/firestore-manager'
  };

  constructor() {
    try {
      this.isWebExtension = !!browser;
    } catch(error) {
      // console.log(error.message);
      // this.isWebExtension = false;
    }
    this.explorerUrl = this.getUrl('explorer');
    this.backupUrl = this.getUrl('backup');
  }

  getUrl(path?: string) {
    let url = this.isWebExtension ? 'index.html' : './';
    if (path?.length) {
      url += (this.isWebExtension ? '?page=' : '') + sanitizePath(path);
    }
    return this.isWebExtension ? browser.extension.getURL(url) : url;
  }

  openUrl(url: string, isActive: boolean = true): Promise<any>|any {
    if (this.isWebExtension) {
      return browser.tabs.create({
        url: url,
        active: isActive
      });
    } else {
      return window.open(url, '_blank');
    }
  }

}

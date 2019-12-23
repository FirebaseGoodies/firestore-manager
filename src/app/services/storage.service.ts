import { Injectable } from '@angular/core';
import { AppService } from './app.service';

@Injectable()
export class StorageService {
  private static tmpStorage = [];

  constructor(private app: AppService) {}

  static getTmp(key: string) {
    return StorageService.tmpStorage[key];
  }

  static setTmp(key: string, value: any) {
    StorageService.tmpStorage[key] = value;
  }

  static saveTmp(values: { [key: string]: any }) {
    Object.keys(values).forEach(key => {
      StorageService.setTmp(key, values[key]);
    });
  }

  get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.app.isWebExtension) {
        browser.storage.local.get(key).then((storage) => {
          resolve(storage[key]);
        });
      }
      else {
        const value = localStorage.getItem(key);
        let finalValue;
        try {
          finalValue = JSON.parse(value);
        }
        catch(error) {
          finalValue = value;
        }
        resolve(finalValue);
      }
    });
  }

  save(key: string, value: any): void {
    if (this.app.isWebExtension) {
      browser.storage.local.set({[key]: value});
    }
    else {
      let finalValue;
      try {
        finalValue = JSON.stringify(value);
      }
      catch(error) {
        finalValue = value;
      }
      localStorage.setItem(key, finalValue);
    }
  }

  getMany(...keys: string[]): Promise<any> {
    let promises: Promise<any>[] = [];
    keys.forEach((key: string) => {
      promises.push(this.get(key));
    });
    return Promise.all(promises);
  }
}

import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class TranslateService {

  private defaultLanguage: string = 'en';
  private translations: object = {};

  constructor(private app: AppService, private http: HttpClient) { }

  init(): Promise<void> {
    return new Promise(resolve => {
      if (! this.app.isWebExtension) {
        this.loadTranslations().then(() => resolve());
      } else {
        resolve();
      }
    });
  }

  private loadTranslations(): Promise<void> {
    return this.http.get(`./_locales/${this.defaultLanguage}/messages.json`).toPromise().then(translations => {
      this.translations = translations;
      // console.log(this.translations);
    });
  }

  getLanguage(): string {
    return this.app.isWebExtension ? browser.i18n.getUILanguage() : this.defaultLanguage;
  }

  get(key: string, substitutions?: string | string[]): string {
    return this.app.isWebExtension ? browser.i18n.getMessage(key, substitutions) : this.translate(key, substitutions);
  }

  private translate(key: string, substitutions?: string | string[]): string {
    // console.log('key:', key);
    return this.translations[key] ? this.replace(this.translations[key], substitutions) : key;
  }

  private replace(translation: Object, substitutions?: string | string[]): string {
    let message = translation['message'];
    if (substitutions) {
      Object.keys(translation['placeholders']).forEach((placeholder, index) => {
        const substitution = typeof substitutions === 'string' ? substitutions : (substitutions[index] ? substitutions[index] : null);
        // console.log(message, placeholder, index, substitution);
        if (substitution === null) {
          return;
        }
        message = message.replace(new RegExp(`\\$${placeholder}\\$`, 'gi'), substitution);
      });
    }
    // console.log('translation:', message);
    return message;
  }
}

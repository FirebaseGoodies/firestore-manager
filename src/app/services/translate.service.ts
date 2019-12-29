import { Injectable } from '@angular/core';
import { AppService } from './app.service';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage.service';

@Injectable()
export class TranslateService {

  languages: object = {
    English: 'en',
    French: 'fr'
  };
  private defaultLanguage: string = 'en';
  private translations: object = {};

  constructor(private app: AppService, private http: HttpClient, private storage: StorageService) { }

  static init(self: TranslateService): Function {
    return () => new Promise(resolve => {
      if (! self.app.isWebExtension) {
        self.storage.get('lang').then((lang) => {
          if (lang) {
            self.defaultLanguage = lang;
          }
        }).finally(() => {
          // console.log(`Loading ${self.defaultLanguage} translations`);
          self.loadTranslations(self.defaultLanguage).then(() => resolve());
        });
      } else {
        resolve();
      }
    });
  }

  private loadTranslations(lang: string): Promise<void> {
    return this.http.get(`./_locales/${lang}/messages.json`).toPromise().then(translations => {
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

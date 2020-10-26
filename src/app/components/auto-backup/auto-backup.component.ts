import { Component, OnInit } from '@angular/core';
import { Database } from 'src/app/models/database.model';
import { StorageService } from 'src/app/services/storage.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Options } from 'src/app/models/options.model';
import { NotificationService } from 'src/app/services/notification.service';
import { TranslateService } from 'src/app/services/translate.service';
import { AuthService } from 'src/app/services/auth.service';
import { AppService } from 'src/app/services/app.service';
import { download } from 'src/app/helpers/download.helper';
import { Router } from '@angular/router';

@Component({
  selector: 'fm-auto-backup',
  templateUrl: './auto-backup.component.html',
  styleUrls: ['./auto-backup.component.css'],
  providers: [AuthService]
})
export class AutoBackupComponent implements OnInit {

  database: Database = null;
  isInProgress: boolean = true;
  status: string = null;
  lang: string = null;
  private options: Options = new Options();

  constructor(
    private storage: StorageService,
    private firestore: FirestoreService,
    private notification: NotificationService,
    private translation: TranslateService,
    private auth: AuthService,
    private app: AppService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Get data from storage
    this.database = StorageService.getTmp('database');
    this.lang = this.translation.getLanguage();
    this.storage.get('options').then((options: Options) => {
      if (options) {
        this.options = {...this.options, ...options}; // merge
      }
    }).finally(() => {
      this.backup();
    });
  }

  private async backup() {
    if (this.database.collections.length) {
      // Sign in if authentication enabled
      if (this.database.authentication?.enabled) {
        await this.auth.signIn(this.database.authentication);
      }

      // Fetch collections
      let promises: Promise<any>[] = [];
      this.database.collections.forEach((collection: string) => {
        promises.push(this.firestore.getCollection(collection));
      });

      Promise.all(promises).finally(() => {
        // Save to file
        const cache = this.firestore.getSyncedCache();
        const json = JSON.stringify(cache, null, 4);
        const content = new Blob([json], { type: 'text/json' });
        const filename = `${this.database.config.projectId}-${this.now().toISOString().slice(0, 10)}.json`;

        if (this.app.isWebExtension) {
          browser.downloads.download({
            url: URL.createObjectURL(content),
            filename: filename,
            saveAs: false,
            conflictAction: 'uniquify'
          });
        } else {
          download(content, filename);
        }

        // Notify
        if (this.options.enableNotifications) {
          this.notification.create(this.translation.get('AutoBackupSavedTo', filename));
        }

        this.status = 'success';
        this.isInProgress = false;
      });
    } else {
      this.status = 'warning';
    }
  }

  now() {
    return new Date();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  async close() {
    if (this.app.isWebExtension) {
      const currentTab = await browser.tabs.getCurrent();
      browser.tabs.remove(currentTab.id);
    } else {
      window.close();
    }
  }

}

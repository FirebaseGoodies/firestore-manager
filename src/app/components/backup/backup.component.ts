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
  selector: 'fm-backup',
  templateUrl: './backup.component.html',
  styleUrls: ['./backup.component.css'],
  providers: [AuthService]
})
export class BackupComponent implements OnInit {

  database: Database = null;
  status: string = null;
  message: string = null;
  date: Date = new Date();
  private options: Options = new Options();

  constructor(
    private storage: StorageService,
    private firestore: FirestoreService,
    private notification: NotificationService,
    private translation: TranslateService,
    private auth: AuthService,
    private router: Router,
    public app: AppService
  ) { }

  ngOnInit(): void {
    // Get data from storage
    this.database = StorageService.getTmp('database');
    this.storage.get('options').then((options: Options) => {
      if (options) {
        this.options = {...this.options, ...options}; // merge
      }
    }).finally(() => {
      this.backup();
    });
  }

  private async backup() {
    if (this.database.collections?.length) {
      // Sign in if authentication enabled
      if (this.database.authentication?.enabled) {
        await this.auth.signIn(this.database.authentication);
      }

      // Fetch collections
      let promises: Promise<any>[] = [];
      this.database.collections.forEach((collection: string) => {
        promises.push(this.firestore.getCollection(collection));
      });

      Promise.all(promises).finally(async () => {
        // Save to file
        const cache = this.firestore.getSyncedCache();
        const json = JSON.stringify(cache, null, 4);
        const content = new Blob([json], { type: 'text/json' });
        const filename = `${this.database.config.projectId}-${this.date.toISOString().slice(0, 10)}.json`;

        if (this.app.isWebExtension) {
          try {
            await browser.downloads.download({
              url: URL.createObjectURL(content),
              filename: filename,
              saveAs: false,
              conflictAction: 'uniquify'
            });
            this.status = 'success';
          } catch(error) {
            this.status = 'error';
            console.error(error.message);
          }
        } else {
          download(content, filename);
          this.status = 'success';
        }

        // Set message
        switch(this.status) {
          case 'error':
            this.message = 'BackupError';
            break;
          case 'success':
          default:
            this.message = 'BackupDone';
            break;
        }

        // Notify
        if (this.options.enableNotifications) {
          this.notification.create(this.translation.get('BackupSavedTo', filename));
        }

        // Close
        this.close();
      });
    } else {
      this.message = 'BackupEmptyDatabase';
      this.status = 'warning';
    }
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  async close() {
    if (this.app.isWebExtension) {
      const currentTab = await browser.tabs.getCurrent();
      browser.tabs.remove(currentTab.id);
    } else {
      // window.close(); // doesn't work
    }
  }

}

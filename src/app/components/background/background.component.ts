import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/services/app.service';
import { Router } from '@angular/router';
import { Database } from 'src/app/models/database.model';
import { StorageService } from 'src/app/services/storage.service';
import { FirestoreService } from 'src/app/services/firestore.service';
import { Options } from 'src/app/models/options.model';
import { NotificationService } from 'src/app/services/notification.service';
import { TranslateService } from 'src/app/services/translate.service';
import { AutoBackupDirectoryName } from 'src/app/models/auto-backup.model';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'fm-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.css']
})
export class BackgroundComponent implements OnInit {

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
    if (this.app.isWebExtension) {
      this.init();
    } else {
      this.router.navigate(['/']);
    }
  }

  private init() {
    // Get settings
    this.storage.get('options').then((options: Options) => {
      if (options) {
        this.options = {...this.options, ...options}; // merge
      }
    });

    // Auto backup check loop
    setTimeout(async () => {
      const databases: Database[] = await this.storage.get('databases');
      databases.forEach((database: Database) => {
        if (database.autoBackup?.enabled && this.isScheduledTime(database.autoBackup?.schedule as any)) {
          this.export(database);
        }
      });
    }, 60000); // every minute
  }

  private isScheduledTime(schedule: { days: number[], time: string }) {
    const now = new Date();
    now.setMilliseconds(0);
    const splittedTime = schedule.time.split(':');
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), +splittedTime[0], +splittedTime[1], 0);

    return schedule.days.indexOf(now.getDay()) !== -1 && now === scheduledTime;
  }

  private async export(database: Database) {
    if (database.collections.length) {
      // Sign in if authentication enabled
      if (database.authentication?.enabled) {
        await this.auth.signIn(database.authentication);
      }

      // Fetch collections
      let promises: Promise<any>[] = [];
      database.collections.forEach((collection: string) => {
        promises.push(this.firestore.getCollection(collection));
      });

      // Save to file
      Promise.all(promises).finally(() => {
        const cache = this.firestore.getSyncedCache();
        const json = JSON.stringify(cache, null, 4);
        const content = new Blob([json], { type: 'text/json' });
        const filename = `${AutoBackupDirectoryName}/${database.config.projectId}.json`;

        browser.downloads.download({
          url: URL.createObjectURL(content),
          filename: filename
        });

        // Notify
        if (this.options.enableNotifications) {
          this.notification.create(this.translation.get('AutoBackupDone', [database.config.projectId, filename]));
        }
      });
    }
  }

}

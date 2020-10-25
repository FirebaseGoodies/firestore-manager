import { Component, OnInit } from '@angular/core';
import { AppService } from 'src/app/services/app.service';
import { Router } from '@angular/router';
import { Database } from 'src/app/models/database.model';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'fm-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.css']
})
export class BackgroundComponent implements OnInit {

  constructor(
    private storage: StorageService,
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
    // Auto backup check
    setTimeout(async () => {
      const databases: Database[] = await this.storage.get('databases');
      // console.log('Auto backup check:', databases);
      databases.forEach((database: Database, index: number) => {
        if (database.autoBackup?.enabled && this.isScheduledTime(database.autoBackup?.schedule as any)) {
          const url = this.app.getUrl('autoBackup&dbindex=' + index);
          // console.log('is scheduled time for:', database.config.projectId, url);
          this.app.openUrl(url, false);
        }
      });
      // re-loop
      this.init();
    }, 60000); // every minute
  }

  private isScheduledTime(schedule: { days: number[], time: string }) {
    const now = new Date();
    const splittedTime = schedule.time.split(':');
    const scheduledTime = {
      hours: +splittedTime[0],
      minutes: +splittedTime[1]
    };

    return schedule.days.indexOf(now.getDay()) !== -1 && now.getHours() === scheduledTime.hours && now.getMinutes() === scheduledTime.minutes;
  }

}

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
    // Auto backup check loop
    setTimeout(async () => {
      const databases: Database[] = await this.storage.get('databases');
      databases.forEach((database: Database, index: number) => {
        if (database.autoBackup?.enabled && this.isScheduledTime(database.autoBackup?.schedule as any)) {
          this.app.openUrl(this.app.getUrl('autoBackup&index=' + index), false);
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

}

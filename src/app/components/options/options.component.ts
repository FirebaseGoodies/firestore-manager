import { Component, OnInit } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { Options } from 'src/app/models/options.model';
import { AppService } from 'src/app/services/app.service';

@Component({
  selector: 'fm-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.css']
})
export class OptionsComponent implements OnInit {

  options: Options = new Options();
  app: AppService;

  constructor(private storage: StorageService, app: AppService) {
    this.app = app;
  }

  ngOnInit() {
    this.storage.get('options').then((options: Options) => {
      if (options) {
        this.options = {...this.options, ...options}; // merge
      }
    });
  }

  saveOptions() {
    this.storage.save('options', this.options);
  }

}

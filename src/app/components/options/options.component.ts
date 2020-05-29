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

  constructor(private storage: StorageService, public app: AppService) {
    if (this.app.isWebExtension) {
      document.documentElement.style.height = 'auto';
      if (navigator.userAgent.indexOf('Chrome') != -1) {
        document.body.style.width = '500px';
        document.body.style.padding = '10px';
        document.body.style.overflowX = 'hidden';
      }
    }
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

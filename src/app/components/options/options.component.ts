import { Component, OnInit } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { Options } from 'src/app/models/options.model';

@Component({
  selector: 'fm-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.css']
})
export class OptionsComponent implements OnInit {

  options: Options = {
    editorMode: 'code',
    diffStyle: 'word',
    diffOutputFormat: 'line-by-line',
    displayCollectionsCount: false
  };

  constructor(private storage: StorageService) { }

  ngOnInit() {
    this.storage.get('options').then((options) => {
      if (options) {
        this.options.editorMode = options.editorMode ? options.editorMode : this.options.editorMode;
        this.options.diffStyle = options.diffStyle ? options.diffStyle : this.options.diffStyle;
        this.options.diffOutputFormat = options.diffOutputFormat ? options.diffOutputFormat : this.options.diffOutputFormat;
        this.options.displayCollectionsCount = options.displayCollectionsCount ? options.displayCollectionsCount : this.options.displayCollectionsCount;
      }
    });
  }

  saveOptions() {
    this.storage.save('options', this.options);
  }

}

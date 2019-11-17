import { Component, OnInit } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'fm-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.css']
})
export class OptionsComponent implements OnInit {

  editorMode: 'tree' | 'form' | 'code' = 'tree';
  private options: any = {};

  constructor(private storage: StorageService) { }

  ngOnInit() {
    this.storage.get('options').then((options) => {
      if (options) {
        this.options = options;
        this.editorMode = options.editorMode ? options.editorMode : 'tree';
      }
    });
  }

  onEditorModeChange() {
    this.options.editorMode = this.editorMode;
    this.storage.save('options', this.options);
  }

}

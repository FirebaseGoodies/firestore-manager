import { JsonEditorMode } from 'ang-jsoneditor';
import { DiffStyle, DiffFormat } from 'ngx-diff2html';

export class Options {
  editorMode: JsonEditorMode;
  diffStyle: DiffStyle;
  diffOutputFormat: DiffFormat;
  displayCollectionsCount: boolean;
  displayDocumentsCount: boolean;
  enableNotifications: boolean;

  constructor() {
    this.editorMode = 'code';
    this.diffStyle = 'word';
    this.diffOutputFormat = 'line-by-line';
    this.displayCollectionsCount = false;
    this.displayDocumentsCount = true;
    this.enableNotifications = true;
  }
}

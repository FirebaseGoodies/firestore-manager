
export class Options {
  editorMode: 'tree' | 'form' | 'code';
  diffStyle: 'word' | 'char';
  diffOutputFormat: 'side-by-side' | 'line-by-line';
  displayCollectionsCount: boolean;
  displayDocumentsCount: boolean;
  enableNotifications: boolean;

  constructor() {
    this.editorMode = 'code';
    this.diffStyle = 'word';
    this.diffOutputFormat = 'line-by-line';
    this.displayCollectionsCount = false;
    this.displayDocumentsCount = false;
    this.enableNotifications = true;
  }
}

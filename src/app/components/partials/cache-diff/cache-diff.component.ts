import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { NzFormatEmitEvent, NzTreeNode } from 'ng-zorro-antd/core';
import { diff_match_patch } from 'diff-match-patch';
import { Diff2Html } from 'diff2html';

@Component({
  selector: 'fm-cache-diff',
  templateUrl: './cache-diff.component.html',
  styleUrls: ['./cache-diff.component.css']
})
export class CacheDiffComponent implements AfterViewInit {

  @Input() enableSaveButton: boolean = false;
  @Output() enableSaveButtonChange:EventEmitter<boolean> = new EventEmitter<boolean>();
  collectionNodes: any[] = [];
  diff: string = null;
  diffStyle: 'word' | 'char' = 'word';
  outputFormat: 'side-by-side' | 'line-by-line' = 'line-by-line';
  newNodes: string[] = [];
  removedNodes: string[] = []; // Not used
  isLoading: boolean = true;
  private activeNode: NzTreeNode | any = null;

  constructor(private firestore: FirestoreService) { }

  ngAfterViewInit() {
    this.getCacheDiff().then(() => {
      // Select first node
      if (this.collectionNodes.length) {
        this.activeNode = this.collectionNodes[0];
        this.activeNode.selected = true;
        this.diff = this.getTextDiff(this.activeNode.oldContent, this.activeNode.newContent, this.activeNode.title);
        this.collectionNodes = [...this.collectionNodes]; // refresh
        this.enableSaveButton = false;
      } else {
        this.enableSaveButton = true;
      }
      this.enableSaveButtonChange.emit(this.enableSaveButton);
      this.isLoading = false;
    });
  }

  private getCacheDiff(): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => { // used to allow showing the modal without freezes
        const cache = this.firestore.cache;
        const unchangedCache = this.firestore.getUnchangedCache();
        // Check collections diff
        Object.keys(cache).forEach((collectionName: string) => {
          const newCache = JSON.stringify(cache[collectionName], null, 4);
          const oldCache = JSON.stringify(unchangedCache[collectionName], null, 4);
          if (newCache !== oldCache) {
            const node: any = { title: collectionName, key: collectionName, expanded: true, children: [], oldContent: oldCache, newContent: newCache };
            // Check documents diff
            Object.keys(cache[collectionName]).forEach((documentName: string) => {
              const newCache = JSON.stringify(cache[collectionName][documentName], null, 4);
              const oldCache = JSON.stringify(unchangedCache[collectionName][documentName], null, 4);
              if (newCache !== oldCache) {
                let oldContent = oldCache;
                let newContent = newCache;
                if (!oldCache) {
                  this.newNodes.push(collectionName + '.' + documentName); // add collection name to avoid conflict with documents from other collections
                  oldContent = '';//newContent;
                }
                node.children.push({ title: documentName, key: documentName, oldContent: oldContent, newContent: newContent, isLeaf: true });
              }
            });
            // Add node
            this.collectionNodes.push(node);
          }
        });
        resolve();
      }, 1000);
    });
  }

  private getTextDiff(text1: string, text2: string, filename: string = 'compare') {
    // Get diff
    const dmp = new diff_match_patch();
    const chars = dmp.diff_linesToChars_(text1, text2);
    const lineText1 = chars.chars1;
    const lineText2 = chars.chars2;
    const lineArray = chars.lineArray;
    const diffs = dmp.diff_main(lineText1, lineText2, false);
    dmp.diff_charsToLines_(diffs, lineArray);
    const patchMake = dmp.patch_make(text1, diffs);
    const patchToText = dmp.patch_toText(patchMake);
    // console.info(patchToText);

    // Make it look more like a unified diff style
    // ToDo: find a non tricky way to do that
    let lines = patchToText.split("\n");
    lines.forEach((line: string, index: number) => {
      if (line.startsWith('-')) {
        lines[index] = line.replace(/%0A(.)/g, "%0A-$1");
      } else if (line.startsWith('+')) {
        lines[index] = line.replace(/%0A(.)/g, "%0A+$1");
      }
    });
    const diff = lines.join("\n");
    // console.info(diff);

    let strInput = "--- " + filename + "\n+++ " + filename + "\n" + diff;
    strInput = decodeURIComponent(strInput);
    // console.info(strInput);

    // Return diff in HTML format
    const htmlDiff = Diff2Html.getPrettyHtml(strInput, {inputFormat: 'diff', matching: 'lines', outputFormat: this.outputFormat, diffStyle: this.diffStyle});
    return htmlDiff;
  }

  reloadDiff() {
    this.diff = this.getTextDiff(this.activeNode.oldContent, this.activeNode.newContent, this.activeNode.title);
  }

  onCollectionNodeClick(event: Required<NzFormatEmitEvent>) {
    // console.log(event);
    const node: any = event.node;
    node.isSelected = true;
    node.isExpanded = true; //!node.isExpanded;
    this.activeNode = node.origin;
    this.diff = this.getTextDiff(node.origin.oldContent, node.origin.newContent, node.title);
  }

  isNewNode(node: NzTreeNode): boolean {
    return this.newNodes.includes(node.parentNode.key + '.' + node.key);
  }

  isRemovedNode(node: NzTreeNode): boolean {
    return this.removedNodes.includes(node.parentNode.key + '.' + node.key);
  }

}

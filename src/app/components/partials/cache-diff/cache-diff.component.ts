import { Component, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { NzFormatEmitEvent, NzTreeNode } from 'ng-zorro-antd/core';
import { DiffStyle, DiffFormat } from 'ngx-diff2html';

@Component({
  selector: 'fm-cache-diff',
  templateUrl: './cache-diff.component.html',
  styleUrls: ['./cache-diff.component.css']
})
export class CacheDiffComponent implements AfterViewInit {

  @Input() diffStyle: DiffStyle = 'word';
  @Input() outputFormat: DiffFormat = 'line-by-line';
  @Input() enableSaveButton: boolean = false;
  @Output() enableSaveButtonChange:EventEmitter<boolean> = new EventEmitter<boolean>();
  collectionNodes: any[] = [];
  newNodes: string[] = [];
  removedNodes: string[] = []; // Not used
  isLoading: boolean = true;
  diff: string = null;
  diffContent: any = null;

  constructor(private firestore: FirestoreService) { }

  ngAfterViewInit() {
    this.getCacheDiff().then(() => {
      // Select first node
      if (this.collectionNodes.length) {
        const node = this.collectionNodes[0];
        node.selected = true;
        this.diffContent = {
          left: node.oldContent,
          right: node.newContent,
          filename: node.title
        };
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
                node.children.push({ title: documentName, key: collectionName + '.' + documentName, oldContent: oldContent, newContent: newContent, isLeaf: true });
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

  onCollectionNodeClick(event: Required<NzFormatEmitEvent>) {
    // console.log(event);
    const node: any = event.node;
    node.isSelected = true;
    node.isExpanded = true; //!node.isExpanded;
    this.diffContent = {
      left: node.origin.oldContent,
      right: node.origin.newContent,
      filename: node.title
    };
  }

  isNewNode(node: NzTreeNode): boolean {
    return this.newNodes.includes(node.key);
  }

  isRemovedNode(node: NzTreeNode): boolean {
    return this.removedNodes.includes(node.key);
  }

}

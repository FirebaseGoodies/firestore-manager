import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FirestoreService } from 'src/app/services/firestore.service';
import { NzFormatEmitEvent } from 'ng-zorro-antd/core';
import { Observable, Subject } from 'rxjs';

export interface DiffContent {
  leftContent: string;
  rightContent: string;
}

@Component({
  selector: 'fm-cache-diff',
  templateUrl: './cache-diff.component.html',
  styleUrls: ['./cache-diff.component.css']
})
export class CacheDiffComponent implements OnInit {

  @Input() disableSaveButton: boolean = false;
  @Output() disableSaveButtonChange:EventEmitter<boolean> = new EventEmitter<boolean>();
  collectionNodes: any[] = [];
  diff: DiffContent;
  contentObservable: Subject<DiffContent> = new Subject<DiffContent>();
  contentObservable$: Observable<DiffContent> = this.contentObservable.asObservable();

  constructor(private firestore: FirestoreService) { }

  ngOnInit() {
    const cache = this.firestore.cache;
    const unchangedCache = this.firestore.getUnchangedCache();
    // Check collections diff
    Object.keys(cache).forEach((collectionName: string) => {
      const newCache = JSON.stringify(cache[collectionName], null, 4);
      const oldCache = JSON.stringify(unchangedCache[collectionName], null, 4);
      if (newCache !== oldCache) {
        const node: any = { title: collectionName, key: collectionName, children: [], leftDiff: oldCache, rightDiff: newCache };
        // Check documents diff
        Object.keys(cache[collectionName]).forEach((documentName: string) => {
          const newCache = JSON.stringify(cache[collectionName][documentName], null, 4);
          const oldCache = JSON.stringify(unchangedCache[collectionName][documentName], null, 4);
          if (newCache !== oldCache) {
            node.children.push({ title: documentName, key: documentName, leftDiff: oldCache, rightDiff: newCache, isLeaf: true });
          }
        });
        // Add node
        this.collectionNodes.push(node);
      }
    });
    // Select first node
    if (this.collectionNodes.length) {
      this.diff = {
        leftContent: this.collectionNodes[0].leftDiff,
        rightContent: this.collectionNodes[0].rightDiff
      };
      this.collectionNodes[0].selected = true;
      this.disableSaveButton = false;
    } else {
      this.disableSaveButton = true;
    }
    this.disableSaveButtonChange.emit(this.disableSaveButton);
  }

  onCollectionNodeClick(event: Required<NzFormatEmitEvent>) {
    // console.log(event);
    const node: any = event.node;
    this.diff = {
      leftContent: node.origin.leftDiff,
      rightContent: node.origin.rightDiff
    };
    this.contentObservable.next(this.diff);
    node.isExpanded = node.isSelected; //!node.isExpanded;
  }

}

import { Component, OnInit, ViewChild, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { jsonValidator } from 'src/app/validators/json.validator';
import { FirestoreService } from 'src/app/services/firestore.service';
import { StorageService } from 'src/app/services/storage.service';
import { NzFormatEmitEvent, NzTreeNode } from 'ng-zorro-antd/core';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CacheDiffComponent } from '../partials/cache-diff/cache-diff.component';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { ComponentCanDeactivate } from 'src/app/services/can-deactivate-guard.service';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { Options } from 'src/app/models/options.model';
import { AppService } from 'src/app/services/app.service';
import { TranslateService } from 'src/app/services/translate.service';

const Chars = {
  Numeric: [...'0123456789'],
  Alpha: [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  AlphaNumeric: [...'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']
};

@Component({
  selector: 'fm-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.css']
})
export class ExplorerComponent implements OnInit, OnDestroy, ComponentCanDeactivate {

  private databaseIndex: number;
  databaseUrl: string;
  collectionNodes: any[] = [];
  collectionNodesSelectedKeys: any[] = [];
  collectionNodesCheckedKeys: any[] = [];
  collectionNodesExpandedKeys: any[] = [];
  enableCollectionDeleteMode: boolean = false;
  permanentlyDeleteDocuments: boolean = false;
  unsavedChanges: boolean = false;
  isSaveModalVisible: boolean = false;
  isSaveButtonLoading: boolean = false;
  isSaveButtonDisabled: boolean = false;
  isReloadingCollections: boolean = false;
  isSearchCollectionLoading: boolean = false;
  isSettingsDrawerVisible: boolean = false;
  isSettingsDrawerLoaded: boolean = false;
  addCollectionForm: FormGroup;
  isAddCollectionButtonLoading: boolean = false;
  isDrawerVisible: boolean = false;
  searchValue: string = null;
  collectionList: string[] = [];
  collectionContentExample: string = `{\n\t"field": "value",\n\t...\n}`;
  editorOptions: JsonEditorOptions;
  @ViewChild('collectionSearch', { static: false }) collectionSearch: NzSelectComponent;
  @ViewChild(JsonEditorComponent, { static: false }) editor: JsonEditorComponent;
  @ViewChild(CacheDiffComponent, { static: false }) cacheDiff: CacheDiffComponent;
  private selectedCollection: string = null;
  private selectedDocument: string = null;
  isWebExtension: boolean = false;
  options: Options = {
    editorMode: 'code',
    diffStyle: 'word',
    diffOutputFormat: 'line-by-line'
  };

  constructor(
    private fb: FormBuilder,
    private firestore: FirestoreService,
    private storage: StorageService,
    private notification: NotificationService,
    private translation: TranslateService,
    private app: AppService,
    private message: NzMessageService,
    private modal: NzModalService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
    this.isWebExtension = this.app.isWebExtension;
  }

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    return !environment.production || !this.unsavedChanges;
  }

  ngOnInit() {
    // Get data from storage
    this.databaseIndex = StorageService.getTmp('database_index');
    this.databaseUrl = StorageService.getTmp('firebase_config').databaseURL;
    this.storage.getMany('databases', 'options').then(([databases, options]) => {
      if (databases && databases[this.databaseIndex].collections) {
        const collections = databases[this.databaseIndex].collections;
        this.collectionList = collections;
        this.setCollectionNodes(collections);
      }
      if (options) {
        this.options = options;
      }
      this.editor.setMode(this.options.editorMode);
    });
    // Init add collection form
    this.addCollectionForm = this.fb.group({
      name: [null, [Validators.required]],
      content: [null, [Validators.required, jsonValidator]]
    });
    // Init editor options
    this.editorOptions = new JsonEditorOptions();
    this.editorOptions.modes = ['tree', 'form', 'code'];
  }

  ngOnDestroy() {
    this.firestore.unsubscribe();
  }

  private setCollectionNodes(collections: string[]): void {
    collections.forEach((collectionName: string) => {
      this.collectionNodes.push({ title: collectionName, key: collectionName });
    });
    this.collectionNodes = [...this.collectionNodes]; // refresh
  }

  searchCollection(value: string): void {
    if (value && value.length) {
      // Check if collection exists
      this.isSearchCollectionLoading = true;
      this.firestore.isCollection(value).then((isCollection: boolean) => {
        if (isCollection && this.collectionList.indexOf(value) === -1) {
          this.saveCollection(value).then((saved: boolean) => {
            if (saved) {
              this.collectionSearch.nzOpen = false;
              this.collectionSearch.blur();
            }
          });
        }
      }).catch((error) => {
        console.log(error.message);
        this.message.create('error', error.message);
      }).finally(() => {
        this.isSearchCollectionLoading = false;
      });
    }
  }

  private saveCollection(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Add to list
      this.collectionList.push(name);
      // Save to storage
      this.storage.get('databases').then((databases) => {
        if (databases && (!databases[this.databaseIndex].collections || databases[this.databaseIndex].collections.indexOf(name) === -1)) {
          databases[this.databaseIndex].collections = databases[this.databaseIndex].collections || [];
          databases[this.databaseIndex].collections.push(name);
          this.storage.save('databases', databases);
          // Add to nodes
          const node: any = { title: name, key: name };
          this.addNode(node).then(() => {
            node.level = 0;
            this.collectionNodesExpandedKeys = [node.key];
            this.collectionNodesSelectedKeys = [node.key];
            this.selectNode(node);
          });
          resolve(true);
        }
        resolve(false);
      });
    });
  }

  private addNode(node: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.firestore.getCollection(node.key).then((documents) => {
        const keys = Object.keys(documents);
        if (keys.length) {
          node.children = [];
          Object.keys(documents).forEach((documentId: string) => {
            node.children.push({ title: documentId, key: documentId, isLeaf: true });
          });
          node.expanded = true;
        }
        this.collectionNodes.push(node);
        this.collectionNodes = [...this.collectionNodes]; // refresh
        resolve();
      });
    });
  }

  submitCollectionForm(): void {
    for (const i in this.addCollectionForm.controls) {
      this.addCollectionForm.controls[i].markAsDirty();
      this.addCollectionForm.controls[i].updateValueAndValidity();
    }
  }

  onAddCollectionClick() {
    if (this.addCollectionForm.valid) {
      this.isAddCollectionButtonLoading = true;
      const name = this.addCollectionForm.controls.name.value;
      // Check if collection already exists
      this.firestore.isCollection(name).then((exists: boolean) => {
        if (exists) {
          this.addCollectionForm.controls.name.setErrors({ notUnique: true });
        } else {
          // Add collection
          const content = JSON.parse(this.addCollectionForm.controls.content.value);
          this.firestore.addCollection(name, content).then((results) => {
            // console.log(results);
            this.saveCollection(name);
          }).catch(error => {
            console.log(error.message);
          });
          this.isDrawerVisible = false;
        }
      }).catch((error) => {
        console.log(error.message);
        this.message.create('error', error.message);
      }).finally(() => {
        this.isAddCollectionButtonLoading = false;
      });
    }
  }

  onDeleteCollectionClick() {
    this.collectionNodesCheckedKeys = [];
    this.collectionNodesSelectedKeys = [];
    this.collectionNodesExpandedKeys = [];
    this.permanentlyDeleteDocuments = false;
    this.enableCollectionDeleteMode = true;
  }

  onCollectionDeleteConfirm() {
    let collectionsToKeep = [];
    this.collectionNodes.forEach(node => {
      // Save unchecked nodes
      if (! node.checked) {
        collectionsToKeep.push(node.key);
      }
      // Delete documents
      if (node.children) {
        node.children.forEach(child => {
          if (child.checked) {
            this.firestore.deleteDocument(node.key, child.key, this.permanentlyDeleteDocuments).then(() => {
              console.log(node.key + ' > ' + child.key + (this.permanentlyDeleteDocuments ? ' permanently ' : '') + ' deleted!');
            });
          }
        });
      }
    });
    // Delete collections
    this.collectionNodesCheckedKeys.forEach(collection => {
      if (this.firestore.deleteCollection(collection)) {
        console.log(collection + ' deleted!');
      }
    });
    this.collectionList = collectionsToKeep; // update search list
    this.collectionNodes = []; // free nodes
    // Save to storage
    this.storage.get('databases').then((databases) => {
      if (databases) {
        databases[this.databaseIndex].collections = collectionsToKeep;
        this.storage.save('databases', databases);
        // Set nodes
        this.setCollectionNodes(collectionsToKeep);
        this.enableCollectionDeleteMode = false;
      }
    });
  }

  onRandomContentClick(event) {
    event.preventDefault();
    // Generate random content
    this.addCollectionForm.controls.content.setValue(`{
      "id": "${this.randomString(3, Chars.Numeric)}",
      "firstname": "${this.randomString(6, Chars.Alpha)}",
      "lastname": "${this.randomString(8, Chars.Alpha)}",
      "email": "${this.randomString(8) + '@test.com'}",
      "location": {
        "street": {
          "number": "${this.randomString(4, Chars.Numeric)}",
          "name": "${this.randomString(10)}"
        },
        "city": "${this.randomString(6, Chars.Alpha)}",
        "postcode": "${this.randomString(5, Chars.Numeric)}"
      }\n}`);
  }

  private randomString(length: number, chars: any[] = Chars.AlphaNumeric) {
    return [...Array(length)].map(i => chars[Math.random()*chars.length|0]).join('');
  }

  onCollectionNodeClick(event: Required<NzFormatEmitEvent>) {
    // console.log(event);
    const node = event.node;
    if (node.isSelected) {
      this.expandNode(node).then(() => this.selectNode(node));
    } else {
      node.isExpanded = false;
    }
  }

  private selectNode(node: any) {
    if (node.level > 0) {
      this.firestore.getDocument(node.parentNode.key, node.key).then((document) => {
        this.updateEditor(document);
        this.selectedCollection = node.parentNode.key;
        this.selectedDocument = node.key;
      });
    } else {
      this.firestore.getCollection(node.key).then((documents) => {
        this.updateEditor(documents);
        this.selectedCollection = node.key;
        this.selectedDocument = null;
      });
    }
  }

  private updateEditor(json: any) {
    this.editor.set(json);
    if (['tree', 'form'].indexOf(this.editor.getMode()) !== -1) {
      this.editor.expandAll();
    }
  }

  onCollectionNodeExpand(event: Required<NzFormatEmitEvent>) {
    // console.log(event);
    const node = event.node;
    if (node && node.isExpanded) {
      this.expandNode(node);
    }
  }

  private expandNode(node: NzTreeNode): Promise<void> {
    return new Promise((resolve, reject) => {
      node.isExpanded = true;
      // Check if node doesn't have childrens
      if (!node.isLeaf && node.getChildren().length === 0) {
        node.isLoading = true;
        // Add node childrens
        this.firestore.getCollection(node.key).then((documents) => {
          Object.keys(documents).forEach((documentId: string) => {
            node.addChildren([{ title: documentId, key: documentId, isLeaf: true }]);
          });
          node.isLoading = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  onCollectionNodeCheck(event: Required<NzFormatEmitEvent>) {
    // console.log(event);
    this.collectionNodesCheckedKeys = event.keys;
  }

  onSelectAllClick() {
    if (this.collectionNodesCheckedKeys.length) {
      this.collectionNodesCheckedKeys = [];
    } else {
      this.collectionNodesCheckedKeys = [];
      this.collectionNodes.forEach(node => {
        this.collectionNodesCheckedKeys.push(node.key);
      });
    }
  }

  onEditorDataChange(event) {
    // console.log(event);
    if (!event.target && this.selectedCollection !== null) {
      // Save to cache
      if (this.selectedDocument === null) {
        this.firestore.cache[this.selectedCollection] = event;
        this.unsavedChanges = true;
      } else {
        this.firestore.cache[this.selectedCollection][this.selectedDocument] = event;
        this.unsavedChanges = true;
      }
    }
  }

  onViewUnsavedChangesClick() {
    this.isSaveButtonDisabled = true;
    this.isSaveModalVisible = true
  }

  onSaveButtonStatusChange(value: boolean) {
    this.isSaveButtonDisabled = value;
    this.cdr.detectChanges();
  }

  onSaveChangesClick() {
    this.isSaveButtonLoading = true;
    let promises: Promise<any>[] = [];
    // Save changed documents
    this.cacheDiff.collectionNodes.forEach(node => {
      if (node.children) {
        node.children.forEach(child => {
          promises.push(this.firestore.saveDocument(node.key, child.key));
        });
      }
    });
    Promise.all(promises).then(() => {
      // Clear cache
      this.firestore.clearCache();
      this.selectedCollection = null;
      this.updateEditor({});
      this.collectionNodesExpandedKeys = [];
      this.collectionNodesSelectedKeys = [];
      this.collectionNodes.forEach(node => {
        node.children = []; // Remove child nodes (to refetch them)
      });
      this.collectionNodes = [...this.collectionNodes]; // refresh
      this.isSaveButtonLoading = false;
      this.isSaveModalVisible = false;
      this.unsavedChanges = false;
      // Display success message
      this.message.create('success', this.translation.get('Changes successfully saved!'));
      this.notification.create(this.translation.get('Saving changes completed!'));
    });
  }

  onSettingsDrawerClose() {
    // Reload options from storage
    this.storage.get('options').then((options) => {
      if (options) {
        this.options = options;
        this.editor.setMode(this.options.editorMode);
      }
    }).finally(() => {
      this.isSettingsDrawerVisible = false;
    });
  }

  onGoBackIconClick() {
    this.modal.confirm({
      nzTitle: this.translation.get('Confirm go back to the main page?'),
      nzContent: this.translation.get('Any unsaved changes will be lost.'),
      nzOnOk: () => this.router.navigate(['/manager'])
    });
  }

  onReloadCollectionClick() {
    // console.log(this.firestore.cache);
    const cacheBackup = {...this.firestore.cache}; // get/assign a copy
    let promises: Promise<any>[] = [];
    this.isReloadingCollections = true;
    // Clear cache
    this.firestore.clearCache();
    this.selectedCollection = null;
    this.updateEditor({});
    this.collectionNodesSelectedKeys = [];
    // Reload collections
    this.collectionNodes.forEach(node => {
      promises.push(this.reloadCollection(node));
    });
    Promise.all(promises).then(() => {
      // console.log('All collections reloaded');
      this.collectionNodes = [...this.collectionNodes]; // refresh
      // Restore cache
      this.firestore.cache = cacheBackup;
      this.isReloadingCollections = false;
    });
  }

  private reloadCollection(node: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.firestore.getCollection(node.key).then((documents) => {
        // console.log('Reload collection: ' + node.key);
        node.children = [];
        Object.keys(documents).forEach((documentId: string) => {
          node.children.push({ title: documentId, key: documentId, isLeaf: true });
        });
        resolve();
      });
    });
  }

}

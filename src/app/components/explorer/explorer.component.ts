import { Component, OnInit, ViewChild, ChangeDetectorRef, HostListener, OnDestroy, ElementRef, TemplateRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { jsonValidator } from 'src/app/validators/json.validator';
import { FirestoreService } from 'src/app/services/firestore.service';
import { StorageService } from 'src/app/services/storage.service';
import { NzFormatEmitEvent, NzTreeNode } from 'ng-zorro-antd/core';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzFormatBeforeDropEvent } from 'ng-zorro-antd/core';
import { NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { CacheDiffComponent } from '../partials/cache-diff/cache-diff.component';
import { Router } from '@angular/router';
import { NotificationService } from 'src/app/services/notification.service';
import { ComponentCanDeactivate } from 'src/app/services/can-deactivate-guard.service';
import { Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { NzSelectComponent } from 'ng-zorro-antd/select';
import { NzTreeComponent } from 'ng-zorro-antd/tree';
import { Options } from 'src/app/models/options.model';
import { AppService } from 'src/app/services/app.service';
import { TranslateService } from 'src/app/services/translate.service';
import { download } from 'src/app/helpers/download.helper';
import { Database } from 'src/app/models/database.model';
import { AuthService } from 'src/app/services/auth.service';
import { Filter, FilterValueType } from 'src/app/models/filter.model';
import { booleanify, isNumber, jsonify } from 'src/app/helpers/parser.helper';
//import { slideInOut } from 'src/app/animations/slide-in-out.animation';

const Chars = {
  Numeric: [...'0123456789'],
  Alpha: [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  AlphaNumeric: [...'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']
};

@Component({
  selector: 'fm-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.css'],
  providers: [AuthService],
  //animations: [slideInOut]
})
export class ExplorerComponent implements OnInit, OnDestroy, ComponentCanDeactivate {

  database: Database;
  collectionNodes: any[] = [];
  collectionNodesSelectedKeys: string[] = [];
  collectionNodesCheckedKeys: string[] = [];
  collectionNodesExpandedKeys: string[] = [];
  isCollectionDeleteModeEnabled: boolean = false;
  permanentlyDeleteDocuments: boolean = false;
  unsavedChanges: boolean = false;
  discardUnsavedChanges: boolean = false;
  isSaveModalVisible: boolean = false;
  isSaveButtonLoading: boolean = false;
  isSaveButtonDisabled: boolean = false;
  isCollectionListLoading: boolean = false;
  isSearchCollectionLoading: boolean = false;
  isSettingsDrawerVisible: boolean = false;
  isSettingsDrawerLoaded: boolean = false;
  addCollectionForm: FormGroup;
  addDocumentForm: FormGroup;
  isAddCollectionButtonLoading: boolean = false;
  isAddCollectionDrawerVisible: boolean = false;
  isAddDocumentDrawerVisible: boolean = false;
  isAddDocumentButtonLoading: boolean = false;
  searchValue: string = null;
  collectionList: string[] = [];
  documentContentExample: string = `{\n\t"field": "value",\n\t...\n}`;
  editorOptions: JsonEditorOptions;
  @ViewChild('collectionSearch', { static: false }) private collectionSearch: NzSelectComponent;
  @ViewChild('collectionTree', { static: false }) private collectionTree: NzTreeComponent;
  @ViewChild('collectionSider', { static: false, read: ElementRef }) private collectionSider: ElementRef;
  @ViewChild('reloadModalTpl', { static: false }) private reloadModalTpl: TemplateRef<any>;
  @ViewChild(JsonEditorComponent, { static: false }) private editor: JsonEditorComponent;
  @ViewChild(CacheDiffComponent, { static: false }) private cacheDiff: CacheDiffComponent;
  selectedCollection: NzTreeNode = null;
  selectedDocument: NzTreeNode = null;
  options: Options = new Options();
  formatterDuplicateTimes = (value: number) => `x ${value}`;
  parserDuplicateTimes = (value: string) => value.replace('x ', '');
  collectionListLoadingMessage: string = 'Loading';
  filters: Filter[] = [];
  filterValueTypes: { label: string, value: FilterValueType }[] = [];

  constructor(
    private fb: FormBuilder,
    private firestore: FirestoreService,
    private storage: StorageService,
    private notification: NotificationService,
    private translation: TranslateService,
    private auth: AuthService,
    private message: NzMessageService,
    private modal: NzModalService,
    private contextMenu: NzContextMenuService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public app: AppService
  ) { }

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    return !environment.production || !this.unsavedChanges;
  }

  ngOnInit() {
    // Get data from storage
    this.database = StorageService.getTmp('database');
    if (this.database && this.database.collections) {
      this.collectionList = this.database.collections;
      this.setCollectionNodes(this.database.collections);
    }
    this.getOptions(() => {
      this.editor.setMode(this.options.editorMode);
    });
    // Sign in if authentication enabled
    if (this.database.authentication && this.database.authentication.enabled) {
      this.startLoading('Authentication');
      this.auth.signIn(this.database.authentication).catch(() => {
        if (this.auth.lastError) {
          this.displayError(this.auth.lastError);
        }
      }).finally(() => {
        this.stopLoading();
      });
    }
    // Init forms
    this.addCollectionForm = this.fb.group({
      name: [null, [Validators.required]],
      content: [null, [Validators.required, jsonValidator]]
    });
    this.addDocumentForm = this.fb.group({
      name: [null, [Validators.required, Validators.pattern("^[a-zA-Z0-9 _-]+$")]],
      useRandomName: [false, []],
      collection: [null, [Validators.required]],
      content: [null, [Validators.required, jsonValidator]],
      duplicate: [false, [Validators.required]],
      duplicateTimes: [2, [Validators.pattern("^[0-9]*$")]]
    });
    // Init editor options
    this.editorOptions = new JsonEditorOptions();
    this.editorOptions.modes = ['tree', 'form', 'code'];
    if (this.translation.getLanguage() == 'fr') {
      this.editorOptions.language = 'fr-FR';
    }
    // Set filter value types
    this.filterValueTypes = Object.keys(FilterValueType).map((key: string) => {
      return { label: key, value: FilterValueType[key] };
    });
  }

  ngOnDestroy() {
    this.firestore.unsubscribe();
    // Sign out if authentication enabled
    if (this.database.authentication && this.database.authentication.enabled) {
      this.auth.signOut();
    }
  }

  private startLoading(message: string = 'Loading') {
    this.collectionListLoadingMessage = message;
    this.isCollectionListLoading = true;
  }

  private stopLoading() {
    this.isCollectionListLoading = false;
  }

  private getOptions(finallyCallback: Function) {
    this.storage.get('options').then((options: Options) => {
      if (options) {
        this.options = {...this.options, ...options}; // merge
      }
    }).finally(() => {
      finallyCallback();
    });
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
          this.startLoading();
          this.saveCollection(value).then((saved: boolean) => {
            if (saved) {
              this.collectionSearch.nzOpen = false;
              this.collectionSearch.blur();
            }
          }).finally(() => {
            this.stopLoading();
          });
        }
      }).catch((error) => {
        this.displayError(error);
      }).finally(() => {
        this.isSearchCollectionLoading = false;
      });
    }
  }

  private saveCollection(name: string, addToNodes: boolean = true): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Add to list
      this.collectionList.push(name);
      // Save to storage
      this.storage.get('databases').then((databases: Database[]) => {
        if (databases && (!databases[this.database.index].collections || databases[this.database.index].collections.indexOf(name) === -1)) {
          databases[this.database.index].collections = databases[this.database.index].collections || [];
          databases[this.database.index].collections.push(name);
          this.storage.save('databases', databases);
          // Add to nodes
          if (addToNodes) {
            const node: NzTreeNode|any = { title: name, key: name };
            this.addNode(node).then(() => {
              node.level = 0;
              this.collectionNodesExpandedKeys = [node.key];
              this.collectionNodesSelectedKeys = [node.key];
              this.selectNode(node);
              resolve(true);
            });
          } else {
            resolve(true);
          }
        } else {
          resolve(false);
        }
      });
    });
  }

  private addNode(node: NzTreeNode|any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.firestore.getCollection(node.title).then((documents) => {
        const keys = Object.keys(documents);
        if (keys.length) {
          node.children = [];
          Object.keys(documents).forEach((documentId: string) => {
            node.children.push({ title: documentId, key: node.key + '.' + documentId, isLeaf: true });
          });
          node.expanded = true;
        }
        this.collectionNodes.push(node);
        this.collectionNodes = [...this.collectionNodes]; // refresh
        this.scrollDownCollectionList();
        resolve();
      });
    });
  }

  private scrollDownCollectionList() {
    setTimeout(() => { // setTimeout used to wait for nodes to be refreshed
      try {
        this.collectionSider.nativeElement.scrollTo({left: 0 , top: this.collectionSider.nativeElement.scrollHeight, behavior: 'smooth'});
      } catch(error) {
        console.log(error.message);
      }
    }, 500);
  }

  submitForm(form: FormGroup): void {
    for (const i in form.controls) {
      form.controls[i].markAsDirty();
      form.controls[i].updateValueAndValidity();
    }
  }

  onAddCollectionClick() {
    if (this.addCollectionForm.valid) {
      this.isAddCollectionButtonLoading = true;
      const name = this.addCollectionForm.controls.name.value;
      // Check if collection already exists
      this.firestore.isCollection(name).then((exists: boolean) => {
        if (exists) {
          this.addCollectionForm.controls.name.setErrors({ alreadyExists: true });
        } else {
          // Add collection
          const content = JSON.parse(this.addCollectionForm.controls.content.value);
          this.firestore.addCollection(name, content).then((results) => {
            // console.log(results);
            // Save collection
            this.startLoading('Updating');
            this.saveCollection(name).finally(() => {
              this.stopLoading();
            });
            this.isAddCollectionDrawerVisible = false;
          }).catch(error => {
            this.displayError(error);
          });
        }
      }).catch((error) => {
        this.displayError(error);
      }).finally(() => {
        this.isAddCollectionButtonLoading = false;
      });
    }
  }

  onAddDocumentClick() {
    if (this.addDocumentForm.valid) {
      this.isAddDocumentButtonLoading = true;
      const documentName = this.addDocumentForm.controls.name.value;
      const useRandomName = this.addDocumentForm.controls.useRandomName.value;
      const collectionName = this.addDocumentForm.controls.collection.value;
      const content = JSON.parse(this.addDocumentForm.controls.content.value);
      const duplicate = this.addDocumentForm.controls.duplicate.value;
      const duplicateTimes = duplicate ? this.addDocumentForm.controls.duplicateTimes.value : 1;
      const addDocument: Function = () => {
        let promises: Promise<any>[] = [];
        for (let doc = 0; doc < duplicateTimes; doc++) {
          promises.push(this.firestore.addDocument(collectionName, content, doc === 0 ? documentName : null));
        }
        Promise.all(promises).then((results) => {
          // console.log(results);
          // Reload collections
          this.startLoading('Updating');
          setTimeout(() => { // Set timeout used to wait for data to be updated (fixes issue when only 1 document is returned)
            this.reloadCollections().catch((error) => {
              this.displayError(error);
            }).finally(() => {
              this.stopLoading();
            });
          }, 1000);
          this.isAddDocumentDrawerVisible = false;
        }).catch(error => {
          this.displayError(error);
        }).finally(() => {
          this.isAddDocumentButtonLoading = false;
        });
      };
      // Add document
      if (useRandomName) {
        addDocument();
      } else {
        // Check if document already exists
        this.firestore.isDocument(collectionName, documentName).then((exists: boolean) => {
          if (exists) {
            this.addDocumentForm.controls.name.setErrors({ alreadyExists: true });
            this.isAddDocumentButtonLoading = false;
          } else {
            addDocument();
          }
        }).catch(error => {
          this.displayError(error);
          this.isAddDocumentButtonLoading = false;
        });
      }
    }
  }

  onDeleteCollectionClick() {
    if (this.collectionNodes.length) {
      this.collectionNodesCheckedKeys = [];
      this.collectionNodesSelectedKeys = [];
      this.collectionNodesExpandedKeys = [];
      this.permanentlyDeleteDocuments = false;
      this.isCollectionDeleteModeEnabled = true;
    }
  }

  onCollectionDeleteConfirm() {
    this.startLoading('Deleting');
    let collectionsToKeep = [];
    let promises: Promise<any>[] = [];
    this.collectionNodes.forEach(node => {
      // Save unchecked nodes
      if (! node.checked) {
        collectionsToKeep.push(node.title);
      }
      // Delete documents
      if (node.children) {
        node.children.forEach(child => {
          if (child.checked) {
            promises.push(this.firestore.deleteDocument(node.title, child.title, this.permanentlyDeleteDocuments));
          }
        });
      }
    });
    Promise.all(promises).then(() => {
      // Delete collections
      this.collectionNodesCheckedKeys.forEach(collection => {
        this.firestore.deleteCollection(collection);
      });
      this.collectionList = collectionsToKeep; // update search list
      this.collectionNodes = []; // free nodes
      // Save to storage
      this.storage.get('databases').then((databases: Database[]) => {
        if (databases) {
          databases[this.database.index].collections = collectionsToKeep;
          this.storage.save('databases', databases);
          // Set nodes
          this.setCollectionNodes(collectionsToKeep);
          this.isCollectionDeleteModeEnabled = false;
        }
      });
    }).catch((error) => {
      this.displayError(error);
    }).finally(() => {
      this.stopLoading();
    });
  }

  onRandomContentClick(event: Event, form: FormGroup) {
    event.preventDefault();
    // Generate random content
    form.controls.content.setValue(`{
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

  private randomString(length: number, chars: string[] = Chars.AlphaNumeric) {
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
    this.closeContextMenu();
  }

  private selectNode(node: NzTreeNode|any) {
    if (node.level > 0) {
      this.firestore.getDocument(node.parentNode.title, node.title).then((document) => {
        this.updateEditor(document);
        this.selectedCollection = node.parentNode;
        this.selectedDocument = node;
      });
    } else {
      this.firestore.getCollection(node.title).then((documents) => {
        this.updateEditor(documents);
        this.selectedCollection = node;
        this.selectedDocument = null;
      });
    }
  }

  private updateEditor(json: JSON) {
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
        // Load collection
        this.loadCollection(node, true, false).catch((error) => {
          this.displayError(error);
        }).finally(() => {
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
        this.firestore.cache[this.selectedCollection.title] = event;
        this.unsavedChanges = true;
      } else {
        this.firestore.cache[this.selectedCollection.title][this.selectedDocument.title] = event;
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
          promises.push(this.firestore.saveDocument(node.title, child.title));
        });
      }
    });
    Promise.all(promises).then(() => {
      // Clear cache
      this.firestore.clearCache();
      // this.selectedCollection = null;
      // this.updateEditor({});
      this.collectionNodesExpandedKeys = [];
      this.collectionNodesSelectedKeys = [];
      this.collectionNodes.forEach(node => {
        node.children = []; // Remove child nodes (to refetch them)
      });
      // Define function to execute at the end
      const done: Function = () => {
        this.collectionNodes = [...this.collectionNodes]; // refresh
        this.isSaveButtonLoading = false;
        this.isSaveModalVisible = false;
        this.unsavedChanges = false;
        // Display success message
        this.displayMessage('ChangesSuccessfullySaved');
        this.displayNotification('SavingChangesCompleted');
      };
      // Reload selected collection/document
      const selectedNode = this.collectionNodes.find((node) => node.key === this.selectedCollection.key);
      if (selectedNode) {
        //console.log(selectedNode);
        this.loadCollection(selectedNode).then(() => {
          this.collectionNodesExpandedKeys = [this.selectedCollection.key];
          if (this.selectedDocument) {
            this.selectNode({
              level: 1,
              key: this.selectedDocument.key,
              title: this.selectedDocument.title,
              parentNode: selectedNode
            });
            this.collectionNodesSelectedKeys = [this.selectedDocument.key];
          } else {
            this.selectNode(selectedNode);
            this.collectionNodesSelectedKeys = [this.selectedCollection.key];
          }
        }).catch((error) => {
          this.displayError(error);
        }).finally(() => {
          done();
        });
      } else {
        done();
      }
    }).catch((error) => {
      this.displayError(error);
      this.isSaveButtonLoading = false;
    });
  }

  onSettingsDrawerClose() {
    // Reload options from storage
    this.getOptions(() => {
      this.editor.setMode(this.options.editorMode);
      this.isSettingsDrawerVisible = false;
    });
  }

  onGoBackIconClick() {
    this.modal.confirm({
      nzTitle: this.translation.get('ConfirmGoBack'),
      nzContent: this.translation.get('AnyUnsavedChangesWillBeLost'),
      nzOkText: this.translation.get('Confirm'),
      nzCancelText: this.translation.get('Cancel'),
      nzOnOk: () => this.router.navigate(['/manager'])
    });
  }

  onReloadCollectionClick() {
    if (this.collectionNodes.length) {
      if (this.unsavedChanges) {
        this.modal.confirm({
          nzTitle: this.translation.get('ReloadAllCollections'),
          nzContent: this.reloadModalTpl,
          nzOkText: this.translation.get('Confirm'),
          nzCancelText: this.translation.get('Cancel'),
          nzOnOk: () => this.reload()
        });
      } else {
        this.reload();
      }
    }
  }

  private reload(): void {
    this.startLoading('Reloading');
    this.reloadCollections(!this.discardUnsavedChanges).catch((error) => {
      this.displayError(error);
    }).finally(() => {
      if (this.discardUnsavedChanges) {
        this.unsavedChanges = false;
      }
      this.stopLoading();
    });
  }

  private reloadCollections(restoreCache: boolean = true): Promise<void> {
    // console.log(this.firestore.cache);
    const cacheBackup = this.firestore.getCacheBackup();
    let promises: Promise<any>[] = [];
    // Clear cache
    this.firestore.clearCache();
    // this.selectedCollection = null;
    // this.updateEditor({});
    this.collectionNodesExpandedKeys = [];
    this.collectionNodesSelectedKeys = [];
    // Reload collections
    this.collectionNodes.forEach(node => {
      promises.push(this.loadCollection(node, true));
    });
    return Promise.all(promises).then(() => {
      // console.log('All collections reloaded');
      this.collectionNodes = [...this.collectionNodes]; // refresh
      // Restore cache
      if (restoreCache) {
        this.restoreCache(cacheBackup);
      }
      // Restore selected collection/document
      this.restoreSelection();
    }).catch((error) => {
      this.displayError(error);
    });
  }

  private restoreCache(cacheBackup: any) {
    Object.keys(cacheBackup).forEach(collectionName => {
      Object.keys(cacheBackup[collectionName]).forEach(documentName => {
        if (! this.firestore.cache[collectionName]) {
          this.firestore.cache[collectionName] = cacheBackup[collectionName];
        }
        this.firestore.cache[collectionName][documentName] = cacheBackup[collectionName][documentName];
      });
    });
  }

  private restoreSelection() {
    if (this.selectedCollection) {
      this.collectionNodesExpandedKeys = [this.selectedCollection.key];
      if (this.selectedDocument && this.firestore.cache[this.selectedCollection.title][this.selectedDocument.title]) {
        this.updateEditor(this.firestore.cache[this.selectedCollection.title][this.selectedDocument.title]);
        this.collectionNodesSelectedKeys = [this.selectedDocument.key];
      } else {
        this.updateEditor(this.firestore.cache[this.selectedCollection.title]);
        this.collectionNodesSelectedKeys = [this.selectedCollection.key];
      }
    }
  }

  private restoreCollectionCache(cacheBackup: any, collection: NzTreeNode) {
    Object.keys(this.firestore.cache[collection.title]).forEach(documentName => {
      if (cacheBackup[collection.title] && cacheBackup[collection.title][documentName]) {
        this.firestore.cache[collection.title][documentName] = cacheBackup[collection.title][documentName];
      }
    });
  }

  private loadCollection(node: NzTreeNode|any, force: boolean = false, resetFilter: boolean = true): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!force && node.children && node.children.length) {
        resolve();
      } else {
        this.firestore.getCollection(node.title).then((documents) => {
          // console.log('Loading collection:', node.title, 'forced:', force);
          node.children = [];
          Object.keys(documents).forEach((documentId: string) => {
            if (node instanceof NzTreeNode) {
              node.addChildren([{ title: documentId, key: node.key + '.' + documentId, isLeaf: true }]);
            } else {
              node.children.push({ title: documentId, key: node.key + '.' + documentId, isLeaf: true });
            }
          });
          resolve();
        }).catch((error) => {
          reject(error);
        }).finally(() => {
          // Reset collection filter
          if (resetFilter && this.filters[node.title]) {
            this.filters[node.title].isApplied = false;
          }
        });
      }
    });
  }

  onExportJsonClick() {
    if (this.collectionNodes.length) {
      this.startLoading('Exporting');
      this.reloadCollections().then(() => {
        const c = JSON.stringify(this.firestore.cache, null, 4);
        const file = new Blob([c], {type: 'text/json'});
        download(file, this.database.config.projectId + '.json');
      }).catch((error) => {
        this.displayError(error);
      }).finally(() => {
        this.stopLoading();
      });
    }
  }

  onImportFileChanged(event: any) {
    const selectedFile = event.target.files[0];
    this.startLoading('Importing');
    this.importFile(selectedFile).then(() => {
      // Display success message
      this.displayMessage('DataSuccessfullyImported');
      this.displayNotification('ImportCompleted');
    }).catch((error) => {
      this.displayError(error);
    }).finally(() => {
      this.stopLoading();
    });
  }

  private importFile(file: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Read file
      const fileReader: any = new FileReader();
      fileReader.readAsText(file, 'UTF-8');
      fileReader.onload = () => {
        // Parse data from file
        try {
          const data = JSON.parse(fileReader.result);
          const collections = Object.keys(data);
          if (collections.length) {
            let newCollections: string[] = [];
            let promises: Promise<any>[] = [];
            // Loop on all collections (in data)
            collections.forEach(collectionName => {
              // Loop on documents
              Object.keys(data[collectionName]).forEach(documentName => {
                // Set/update document (will create the collection also if not exist)
                // console.log(collectionName, documentName, data[collectionName][documentName]);
                promises.push(this.firestore.setDocument(collectionName, documentName, data[collectionName][documentName]));
              });
              // Save collection if not exist
              if (this.collectionList.indexOf(collectionName) === -1) {
                newCollections.push(collectionName);
              }
            });
            Promise.all(promises).then((results) => {
              // console.log(results);
              // Save new collections
              let promise: Promise<any> = Promise.resolve(); // used to execute promises syncly
              newCollections.forEach(collectionName => {
                promise = promise.then(() => this.saveCollection(collectionName, false));
              });
              // Update collection nodes
              this.setCollectionNodes(newCollections);
              // Reload collections
              this.reloadCollections().then(() => {
                resolve();
              }).catch((error) => {
                reject(error);
              });
            }).catch((error) => {
              reject(error);
            });
          } else {
            reject({ message: this.translation.get('FileIsEmpty') });
          }
        }
        catch(error) {
          reject(error);
        }
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  }

  expandAllCollectionNodes() {
    this.startLoading('Expanding');
    let promises: Promise<any>[] = [];
    this.collectionNodes.forEach(node => {
      if (! this.collectionNodesExpandedKeys[node.key]) {
        promises.push(this.loadCollection(node));
        this.collectionNodesExpandedKeys.push(node.key);
      }
    });
    Promise.all(promises).then(() => {
      // Refresh nodes
      this.collectionNodesExpandedKeys = [...this.collectionNodesExpandedKeys];
      this.collectionNodes = [...this.collectionNodes];
    }).catch((error) => {
      this.displayError(error);
    }).finally(() => {
      this.stopLoading();
    });
  }

  private displayError(error) {
    console.log(error.message);
    this.message.create('error', error.message);
  }

  private displayMessage(message: string, type: string = 'success') {
    this.message.create(type, this.translation.get(message));
  }

  private displayNotification(message: string) {
    if (this.options.enableNotifications) {
      this.notification.create(this.translation.get(message));
    }
  }

  initFilter(event: Event, collection: NzTreeNode) {
    event.stopPropagation();
    if (!this.filters[collection.title]) {
      this.filters[collection.title] = new Filter();
    }
  }

  applyFilter(collection: NzTreeNode|any) {
    // console.log(this.filters[collection.title]);
    if (collection) {
      this.startLoading('Filtering');
      collection.filterIsVisible = false;
      this.filterCollection(collection).finally(() => {
        this.filters[collection.title].isApplied = true;
        this.stopLoading();
      });
    }
  }

  removeFilter(collection: NzTreeNode|any) {
    if (collection && this.filters[collection.title].isApplied) {
      this.startLoading('RemovingFilter');
      collection.filterIsVisible = false;
      this.filterCollection(collection, true).finally(() => {
        this.filters[collection.title].isApplied = false;
        this.stopLoading();
      });
    }
  }

  private getFilterValue(filter: Filter) {
    switch(filter.valueType) {
      case 'number':
        return isNumber(filter.value) ? +filter.value : filter.value;
      case 'boolean':
        return booleanify(filter.value);
      case 'object':
        return jsonify(filter.value);
      default:
        return filter.value;
    }
  }

  private filterCollection(collection: NzTreeNode, removal: boolean = false): Promise<void> {
    // Get cache backup
    const cacheBackup = this.firestore.getCacheBackup();
    // Filter collection
    const filter: Filter = this.filters[collection.title];
    const filterValue = this.getFilterValue(filter);
    return this.firestore.filterCollection(collection.title, removal ? undefined : ref => ref.where(filter.field, filter.operator, filterValue)).then((documents) => {
      // console.log('Filter collection:', collection.title);
      collection.children = [];
      const children = [];
      Object.keys(documents).forEach((documentId: string) => {
        children.push({ title: documentId, key: collection.key + '.' + documentId, isLeaf: true });
      });
      collection.addChildren(children);
      this.restoreCollectionCache(cacheBackup, collection);
      // Restore selected collection/document
      if (this.selectedCollection && this.selectedCollection.key === collection.key) {
        this.collectionNodesExpandedKeys = [];
        this.collectionNodesSelectedKeys = [];
        this.restoreSelection();
      }
    }).catch((error) => {
      this.displayError(error);
    });
  }

  beforeCollectionNodeDrop(arg: NzFormatBeforeDropEvent): Observable<boolean> {
    //console.log(arg);
    if (!arg.dragNode.isLeaf && !arg.node.isLeaf && arg.pos != 0) {
      return of(true);
    } else {
      return of(false);
    }
  }

  onCollectionNodeDrop(event: NzFormatEmitEvent) {
    //console.log(event);
    // Update storage
    this.storage.get('databases').then((databases: Database[]) => {
      if (databases) {
        const collections = this.collectionTree.getTreeNodes().filter((node: NzTreeNode) => node.level === 0).map((node: NzTreeNode) => node.title);
        //console.log(collections);
        databases[this.database.index].collections = collections;
        this.storage.save('databases', databases);
      }
    });
  }

  createContextMenu($event: MouseEvent, menu: NzDropdownMenuComponent): void {
    this.contextMenu.create($event, menu);
  }

  closeContextMenu(): void {
    this.contextMenu.close();
  }

  deleteDocument(node: NzTreeNode) {
    this.onDeleteCollectionClick();
    this.collectionNodesCheckedKeys = [node.key];
  }

  checkNode(node: NzTreeNode) {
    // Check node
    node.setChecked(true);
    this.collectionNodesCheckedKeys.push(node.key);
    // Check its childs too
    node.children.forEach((child: NzTreeNode) => {
      if (! child.isChecked) {
        child.setChecked(true);
        this.collectionNodesCheckedKeys.push(child.key);
      }
    });
  }

  uncheckNode(node: NzTreeNode) {
    // Uncheck node
    node.setChecked(false);
    const index = this.collectionNodesCheckedKeys.indexOf(node.key);
    if (index >= 0) {
      this.collectionNodesCheckedKeys.splice(index, 1);
    }
    // If any child is checked add it to checked keys list
    node.children.forEach((child: NzTreeNode) => {
      if (child.isChecked && this.collectionNodesCheckedKeys.indexOf(child.key) === -1) {
        this.collectionNodesCheckedKeys.push(child.key);
      }
    });
    // Uncheck parent node
    if (node.parentNode && node.parentNode.isChecked) {
      this.uncheckNode(node.parentNode);
    }
  }

  reloadCollection(node: NzTreeNode) {
    // Take cache backup
    const cacheBackup = {};
    if (this.firestore.cache[node.title]) {
      cacheBackup[node.title] = this.firestore.getCacheBackup(node.title);
    }
    // Clear cache
    this.firestore.clearCache(node.title);
    // Reload collection
    node.isLoading = true;
    node.children = [];
    this.loadCollection(node, true).catch((error) => {
      this.displayError(error);
    }).finally(() => {
      this.restoreCache(cacheBackup);
      node.isLoading = false;
    });
  }

  addDocument(collection: NzTreeNode) {
    this.addDocumentForm.controls.name.setValue(null);
    this.addDocumentForm.controls.useRandomName.setValue(false);
    this.addDocumentForm.controls.collection.setValue(collection.key);
    this.addDocumentForm.controls.content.setValue(null);
    this.isAddDocumentDrawerVisible = true;
  }

  cloneDocument(document: NzTreeNode) {
    const collection = document.parentNode.key;
    const content = this.firestore.cache[collection][document.title];
    this.addDocumentForm.controls.name.setValue(null);
    this.addDocumentForm.controls.useRandomName.setValue(false);
    this.addDocumentForm.controls.collection.setValue(collection);
    this.addDocumentForm.controls.content.setValue(JSON.stringify(content, null, 4));
    this.isAddDocumentDrawerVisible = true;
  }

  onUseRandomNameChange(isChecked: boolean) {
    if (isChecked) {
      this.addDocumentForm.controls.name.disable();
    } else {
      this.addDocumentForm.controls.name.enable();
      this.addDocumentForm.controls.name.reset();
    }
  }

  renameCollection(collection: NzTreeNode|any, name: string) {
    if (name && name.length) {
      collection.isRenameButtonLoading = true;
      // Check if collection already exists
      this.firestore.isCollection(name).then((exists: boolean) => {
        if (exists) {
          this.displayError({ message: this.translation.get('CollectionAlreadyExists') });
        } else {
          // Rename collection
          this.startLoading('Renaming');
          // Take cache backup & clear cache
          const cacheBackup = {};
          if (this.firestore.cache[collection.title]) {
            cacheBackup[name] = this.firestore.getCacheBackup(collection.title);
          }
          this.firestore.clearCache(collection.title);
          // Get collection
          this.firestore.getCollection(collection.title).then((documents) => {
            let promises: Promise<any>[] = [];
            Object.keys(documents).forEach(documentName => {
              // Move documents from the old collection to the new one
              promises.push(this.firestore.addDocument(name, documents[documentName], documentName));
              promises.push(this.firestore.deleteDocument(collection.title, documentName, true));
            });
            Promise.all(promises).then(() => {
              // Fetch new collection (to fill cache)
              this.firestore.getCollection(name).then((documents) => {
                // Retore new collection cache
                this.restoreCache(cacheBackup);
                // Delete old collection
                this.firestore.deleteCollection(collection.title);
                // Replace collection
                this.replaceCollection(collection.title, name).then(() => {
                  collection.title = name;
                  collection.key = name;
                  collection.children = [];
                  collection.isExpanded = false;
                  collection.isSelected = false;
                  this.disableRenameMode(null, collection);
                  this.stopLoading();
                });
              }).catch(error => {
                this.displayError(error);
                this.stopLoading();
              });
            }).catch(error => {
              this.displayError(error);
              this.stopLoading();
            });
          }).catch(error => {
            this.displayError(error);
            this.stopLoading();
          });
        }
      }).catch((error) => {
        this.displayError(error);
      }).finally(() => {
        collection.isRenameButtonLoading = false;
      });
    }
  }

  renameDocument(document: NzTreeNode|any, name: string) {
    if (name && name.length) {
      document.isRenameButtonLoading = true;
      // Check if document already exists
      const collectionName = document.parentNode.title;
      this.firestore.isDocument(collectionName, name).then((exists: boolean) => {
        if (exists) {
          this.displayError({ message: this.translation.get('DocumentAlreadyExists') });
        } else {
          // Rename document
          this.startLoading('Renaming');
          // Take cache backup & clear cache
          const cacheBackup = {};
          if (this.firestore.cache[collectionName] && this.firestore.cache[collectionName][document.title]) {
            cacheBackup[collectionName] = {};
            cacheBackup[collectionName][name] = this.firestore.getCacheBackup(collectionName, document.title);
          }
          this.firestore.clearCache(collectionName, document.title);
          // Get document
          this.firestore.getDocument(collectionName, document.title).then((content) => {
            // Add new document
            this.firestore.addDocument(collectionName, content, name).then((results) => {
              // console.log(results);
              // Fetch new document (to fill cache)
              this.firestore.getDocument(collectionName, name).then((content) => {
                // Retore new document cache
                this.restoreCache(cacheBackup);
                // Delete old document
                this.firestore.deleteDocument(collectionName, document.title, true).catch(error => {
                  this.displayError(error);
                }).finally(() => {
                  // Replace document
                  document.title = name;
                  document.key = collectionName + '.' + name;
                  this.disableRenameMode(null, document);
                  this.stopLoading();
                });
              }).catch(error => {
                this.displayError(error);
                this.stopLoading();
              });
            }).catch(error => {
              this.displayError(error);
              this.stopLoading();
            });
          }).catch(error => {
            this.displayError(error);
            this.stopLoading();
          });
        }
      }).catch((error) => {
        this.displayError(error);
      }).finally(() => {
        document.isRenameButtonLoading = false;
      });
    }
  }

  enableRenameMode(event: Event, node: NzTreeNode|any) {
    event.stopPropagation();
    if (node.isSelected) {
      node.wasSelected = true;
      node.isSelected = false;
    }
    node.isRenameModeEnabled = true;
  }

  disableRenameMode(event: Event, node: NzTreeNode|any) {
    event && event.stopPropagation();
    node.isRenameModeEnabled = false;
    if (node.wasSelected) {
      node.isSelected = true;
      node.wasSelected = false;
    }
  }

  private replaceCollection(name: string, newName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Replace in list
      const index = this.collectionList.indexOf(name);
      if (index !== -1) {
        this.collectionList.splice(index, 1, newName);
      }
      // Replace in collection nodes array
      this.collectionNodes.forEach((node: NzTreeNode|any) => {
        if (node.title === name) {
          node.title = newName;
          node.key = newName;
        }
      });
      // Replace filter
      if (this.filters[name]) {
        this.filters[newName] = this.filters[name];
        this.filters[newName].isApplied = false;
        delete this.filters[name];
      }
      // Replace in storage
      this.storage.get('databases').then((databases: Database[]) => {
        if (databases && (!databases[this.database.index].collections || databases[this.database.index].collections.indexOf(name) !== -1)) {
          databases[this.database.index].collections = databases[this.database.index].collections || [];
          if (databases[this.database.index].collections.length > 0) {
            databases[this.database.index].collections.splice(databases[this.database.index].collections.indexOf(name), 1, newName);
          } else {
            databases[this.database.index].collections.push(newName);
          }
          this.storage.save('databases', databases);
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

}

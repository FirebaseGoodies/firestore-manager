import { Component, OnInit, ViewChild, ChangeDetectorRef, HostListener, OnDestroy, ElementRef, TemplateRef } from '@angular/core';
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
import { download } from 'src/app/helpers/download.helper';
import { Database } from 'src/app/models/database.model';
import { AuthService } from 'src/app/services/auth.service';

const Chars = {
  Numeric: [...'0123456789'],
  Alpha: [...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'],
  AlphaNumeric: [...'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ']
};

@Component({
  selector: 'fm-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.css'],
  providers: [AuthService]
})
export class ExplorerComponent implements OnInit, OnDestroy, ComponentCanDeactivate {

  database: Database;
  collectionNodes: any[] = [];
  collectionNodesSelectedKeys: any[] = [];
  collectionNodesCheckedKeys: any[] = [];
  collectionNodesExpandedKeys: any[] = [];
  enableCollectionDeleteMode: boolean = false;
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
  @ViewChild('collectionSider', { static: false, read: ElementRef }) private collectionSider: ElementRef;
  @ViewChild('reloadModalTpl', { static: false }) private reloadModalTpl: TemplateRef<any>;
  @ViewChild(JsonEditorComponent, { static: false }) private editor: JsonEditorComponent;
  @ViewChild(CacheDiffComponent, { static: false }) private cacheDiff: CacheDiffComponent;
  private selectedCollection: string = null;
  private selectedDocument: string = null;
  isWebExtension: boolean = false;
  options: Options = new Options();
  formatterDuplicateTimes = (value: number) => `x ${value}`;
  parserDuplicateTimes = (value: string) => value.replace('x ', '');
  collectionListLoadingTip: string = 'Loading';

  constructor(
    private fb: FormBuilder,
    private firestore: FirestoreService,
    private storage: StorageService,
    private notification: NotificationService,
    private translation: TranslateService,
    private app: AppService,
    private auth: AuthService,
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
    this.database = StorageService.getTmp('database');
    if (this.database && this.database.collections) {
      this.collectionList = this.database.collections;
      this.setCollectionNodes(this.database.collections);
    }
    this.storage.get('options').then((options: Options) => {
      if (options) {
        this.options = {...this.options, ...options}; // merge
      }
      this.editor.setMode(this.options.editorMode);
    });
    // Sign in if authentication enabled
    if (this.database.authentication) {
      this.auth.signOut(true); // first, make sure that user is signed out
      if (this.database.authentication.enabled) {
        this.collectionListLoadingTip = 'Authentication';
        this.isCollectionListLoading = true;
        this.auth.signIn(this.database.authentication).catch(() => {
          if (this.auth.lastError) {
            this.displayError(this.auth.lastError);
          }
        }).finally(() => {
          this.isCollectionListLoading = false;
        });
      }
    }
    // Init forms
    this.addCollectionForm = this.fb.group({
      name: [null, [Validators.required]],
      content: [null, [Validators.required, jsonValidator]]
    });
    this.addDocumentForm = this.fb.group({
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
  }

  ngOnDestroy() {
    this.firestore.unsubscribe();
    // Sign out if authentication enabled
    if (this.database.authentication && this.database.authentication.enabled) {
      this.auth.signOut();
    }
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
          this.collectionListLoadingTip = 'Loading';
          this.isCollectionListLoading = true;
          this.saveCollection(value).then((saved: boolean) => {
            if (saved) {
              this.collectionSearch.nzOpen = false;
              this.collectionSearch.blur();
            }
          }).finally(() => {
            this.isCollectionListLoading = false;
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
            const node: any = { title: name, key: name };
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
          this.addCollectionForm.controls.name.setErrors({ notUnique: true });
        } else {
          // Add collection
          const content = JSON.parse(this.addCollectionForm.controls.content.value);
          this.firestore.addCollection(name, content).then((results) => {
            // console.log(results);
            // Save collection
            this.collectionListLoadingTip = 'Updating';
            this.isCollectionListLoading = true;
            this.saveCollection(name).finally(() => {
              this.isCollectionListLoading = false;
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
      const collection = this.addDocumentForm.controls.collection.value;
      const content = JSON.parse(this.addDocumentForm.controls.content.value);
      const duplicate = this.addDocumentForm.controls.duplicate.value;
      const duplicateTimes = duplicate ? this.addDocumentForm.controls.duplicateTimes.value : 1;
      let promises: Promise<any>[] = [];
      for (let doc = 0; doc < duplicateTimes; doc++) {
        // Add document
        promises.push(this.firestore.addDocument(collection, content));
      }
      Promise.all(promises).then((results) => {
        // console.log(results);
        // Reload collections
        this.collectionListLoadingTip = 'Updating';
        this.isCollectionListLoading = true;
        setTimeout(() => { // Set timeout used to wait for data to be updated (fixes issue when only 1 document is returned)
          this.reloadCollections().catch((error) => {
            this.displayError(error);
          }).finally(() => {
            this.isCollectionListLoading = false;
          });
        }, 1000);
        this.isAddDocumentDrawerVisible = false;
      }).catch(error => {
        this.displayError(error);
      }).finally(() => {
        this.isAddDocumentButtonLoading = false;
      });
    }
  }

  onDeleteCollectionClick() {
    if (this.collectionNodes.length) {
      this.collectionNodesCheckedKeys = [];
      this.collectionNodesSelectedKeys = [];
      this.collectionNodesExpandedKeys = [];
      this.permanentlyDeleteDocuments = false;
      this.enableCollectionDeleteMode = true;
    }
  }

  onCollectionDeleteConfirm() {
    this.collectionListLoadingTip = 'Deleting';
    this.isCollectionListLoading = true;
    let collectionsToKeep = [];
    let promises: Promise<any>[] = [];
    this.collectionNodes.forEach(node => {
      // Save unchecked nodes
      if (! node.checked) {
        collectionsToKeep.push(node.key);
      }
      // Delete documents
      if (node.children) {
        node.children.forEach(child => {
          if (child.checked) {
            promises.push(this.firestore.deleteDocument(node.key, child.key, this.permanentlyDeleteDocuments));
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
          this.enableCollectionDeleteMode = false;
        }
      });
    }).finally(() => {
      this.isCollectionListLoading = false;
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
        }).catch((error) => {
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
        this.displayMessage('Changes successfully saved!');
        this.displayNotification('Saving changes completed!');
      };
      // Reload selected collection/document
      const selectedNode = this.collectionNodes.find((node) => node.key === this.selectedCollection);
      if (selectedNode) {
        this.loadCollection(selectedNode).then(() => {
          this.collectionNodesExpandedKeys = [this.selectedCollection];
          if (this.selectedDocument) {
            this.selectNode({
              level: 1,
              key: this.selectedDocument,
              parentNode: selectedNode
            });
            this.collectionNodesSelectedKeys = [this.selectedDocument];
          } else {
            this.selectNode(selectedNode);
            this.collectionNodesSelectedKeys = [this.selectedCollection];
          }
        }).catch((error) => {
          this.displayError(error);
        }).finally(() => {
          done();
        });
      } else {
        done();
      }
    });
  }

  onSettingsDrawerClose() {
    // Reload options from storage
    this.storage.get('options').then((options: Options) => {
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
      nzOkText: this.translation.get('Confirm'),
      nzCancelText: this.translation.get('Cancel'),
      nzOnOk: () => this.router.navigate(['/manager'])
    });
  }

  onReloadCollectionClick() {
    if (this.collectionNodes.length) {
      if (this.unsavedChanges) {
        this.modal.confirm({
          nzTitle: this.translation.get('Reload all collections?'),
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
    this.collectionListLoadingTip = 'Reloading';
    this.isCollectionListLoading = true;
    this.reloadCollections(!this.discardUnsavedChanges).catch((error) => {
      this.displayError(error);
    }).finally(() => {
      if (this.discardUnsavedChanges) {
        this.unsavedChanges = false;
      }
      this.isCollectionListLoading = false;
    });
  }

  private reloadCollections(restoreCache: boolean = true): Promise<void> {
    // console.log(this.firestore.cache);
    const cacheBackup = {...this.firestore.cache}; // get/assign a copy
    let promises: Promise<any>[] = [];
    // Clear cache
    this.firestore.clearCache();
    this.selectedCollection = null;
    this.updateEditor({});
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
        Object.keys(cacheBackup).forEach(collectionName => {
          Object.keys(cacheBackup[collectionName]).forEach(documentName => {
            if (! this.firestore.cache[collectionName]) {
              this.firestore.cache[collectionName] = cacheBackup[collectionName];
            }
            this.firestore.cache[collectionName][documentName] = cacheBackup[collectionName][documentName];
          });
        });
      }
    });
  }

  private loadCollection(node: any, force: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!force && node.children && node.children.length) {
        resolve();
      } else {
        this.firestore.getCollection(node.key).then((documents) => {
          // console.log('Reload collection: ' + node.key);
          node.children = [];
          Object.keys(documents).forEach((documentId: string) => {
            node.children.push({ title: documentId, key: documentId, isLeaf: true });
          });
          resolve();
        }).catch((error) => {
          reject(error);
        });
      }
    });
  }

  onExportJsonClick() {
    if (this.collectionNodes.length) {
      this.collectionListLoadingTip = 'Exporting';
      this.isCollectionListLoading = true;
      this.reloadCollections().then(() => {
        const c = JSON.stringify(this.firestore.cache, null, 4);
        const file = new Blob([c], {type: 'text/json'});
        download(file, this.database.config.projectId + '.json');
      }).catch((error) => {
        this.displayError(error);
      }).finally(() => {
        this.isCollectionListLoading = false;
      });
    }
  }

  onImportFileChanged(event: any) {
    const selectedFile = event.target.files[0];
    this.collectionListLoadingTip = 'Importing';
    this.isCollectionListLoading = true;
    this.importFile(selectedFile).then(() => {
      // Display success message
      this.displayMessage('Data successfully imported!');
      this.displayNotification('Import completed!');
    }).catch((error) => {
      this.displayError(error);
    }).finally(() => {
      this.isCollectionListLoading = false;
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
            reject({message: this.translation.get('File is empty!')});
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
    this.collectionListLoadingTip = 'Expanding';
    this.isCollectionListLoading = true;
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
      this.isCollectionListLoading = false;
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

}

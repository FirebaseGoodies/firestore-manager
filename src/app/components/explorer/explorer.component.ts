import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { jsonValidator } from 'src/app/validators/json.validator';
import { FirestoreService } from 'src/app/services/firestore.service';
import { StorageService } from 'src/app/services/storage.service';
import { NzFormatEmitEvent, NzTreeNode } from 'ng-zorro-antd/core';
import { JsonEditorComponent, JsonEditorOptions } from 'ang-jsoneditor';

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
export class ExplorerComponent implements OnInit {

  private databaseIndex: number;
  collectionNodes: any[] = [];
  addCollectionForm: FormGroup;
  isAddCollectionButtonLoading: boolean = false;
  isDrawerVisible: boolean = false;
  collectionList: string[] = [];
  displayTips: boolean = true;
  collectionContentExample: string = `{\n\t"field": "value",\n\t...\n}`;
  editorOptions: JsonEditorOptions;
  @ViewChild(JsonEditorComponent, { static: true }) editor: JsonEditorComponent;
  private selectedCollection: string = null;
  private selectedDocument: string = null;

  constructor(private fb: FormBuilder, private firestore: FirestoreService, private storage: StorageService) { }

  ngOnInit() {
    // Get data from storage
    this.databaseIndex = StorageService.getTmp('database_index');
    this.storage.get('databases').then((databases) => {
      if (databases && databases[this.databaseIndex].collections) {
        databases[this.databaseIndex].collections.forEach((collectionName: string) => {
          this.collectionNodes.push({ title: collectionName, key: collectionName });
        });
        this.collectionNodes = [...this.collectionNodes]; // refresh
      }
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

  searchCollection(value: string): void {
    if (value && value.length > 1) {
      // Check if collection exists
      this.firestore.isCollection(value).then((isCollection: boolean) => {
        if (isCollection && this.collectionList.indexOf(value) === -1) {
          this.saveCollection(value);
        }
      });
      this.displayTips = false;
    } else {
      this.displayTips = true;
    }
  }

  private saveCollection(name: string) {
    // Add to list
    this.collectionList.push(name);
    // Save to storage
    this.storage.get('databases').then((databases) => {
      if (databases && (!databases[this.databaseIndex].collections || databases[this.databaseIndex].collections.indexOf(name) === -1)) {
        databases[this.databaseIndex].collections = databases[this.databaseIndex].collections || [];
        databases[this.databaseIndex].collections.push(name);
        this.storage.save('databases', databases);
        // Add to nodes
        const node = { title: name, key: name };
        this.addNode(node).then(() => this.selectNode(node));
      }
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
        node.level = 0;
        node.selected = true;
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
        this.isAddCollectionButtonLoading = false;
      });
    }
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
      if (node.getChildren().length === 0) {
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

  onEditorDataChange(event) {
    // console.log(event);
    if (!event.target && this.selectedCollection !== null) {
      // Save to cache
      if (this.selectedDocument === null) {
        this.firestore.cache[this.selectedCollection] = event;
      } else {
        this.firestore.cache[this.selectedCollection][this.selectedDocument] = event;
      }
    }
  }

}

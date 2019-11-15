import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { jsonValidator } from 'src/app/validators/json.validator';
import { FirestoreService } from 'src/app/services/firestore.service';
import { StorageService } from 'src/app/services/storage.service';
import { NzFormatEmitEvent } from 'ng-zorro-antd/core';

@Component({
  selector: 'fm-explorer',
  templateUrl: './explorer.component.html',
  styleUrls: ['./explorer.component.css']
})
export class ExplorerComponent implements OnInit {

  private databaseIndex: number;
  collectionNodes = [];
  addCollectionForm: FormGroup;
  isAddCollectionButtonLoading: boolean = false;
  isDrawerVisible: boolean = false;
  selectedCollection: string = null;
  collectionList: string[] = [];
  displayTips = true;
  collectionContentExample: string = `{
    "document id": {
      "field": "value",
      ...
    },
    ...
  }`;

  constructor(private fb: FormBuilder, private firestore: FirestoreService, private storage: StorageService) { }

  ngOnInit() {
    this.databaseIndex = StorageService.getTmp('database_index');
    this.storage.get('databases').then((databases) => {
      if (databases && databases[this.databaseIndex].collections) {
        databases[this.databaseIndex].collections.forEach((collectionName: string) => {
          this.collectionNodes.push({ title: collectionName, key: collectionName });
        });
        this.collectionNodes = [...this.collectionNodes]; // refresh
      }
    });
    this.addCollectionForm = this.fb.group({
      name: [null, [Validators.required]],
      content: [null, [Validators.required, jsonValidator]]
    });
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
        this.collectionNodes.push({ title: name, key: name });
        this.collectionNodes = [...this.collectionNodes]; // refresh
      }
    });
  }

  submitCollectionForm(): void {
    for (const i in this.addCollectionForm.controls) {
      this.addCollectionForm.controls[i].markAsDirty();
      this.addCollectionForm.controls[i].updateValueAndValidity();
    }
  }

  onAddCollection() {
    if (this.addCollectionForm.valid) {
      this.isAddCollectionButtonLoading = true;
      const name = this.addCollectionForm.controls.name.value;
      this.firestore.isCollection(name).then((isCollection: boolean) => {
        if (isCollection) {
          this.addCollectionForm.controls.name.setErrors({ notUnique: true });
        } else {
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

  onGenerateContentClick(event) {
    event.preventDefault();
    const chars = [...'0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'];
    const docId = [...Array(20)].map(i => chars[Math.random()*chars.length|0]).join('');
    this.addCollectionForm.controls.content.setValue(`{
      "${docId}": {
        "field": "value"
      }\n}`);
  }

  onCollectionNodeClick(event: Required<NzFormatEmitEvent>) {
    console.log(event);
  }

  onCollectionNodeExpand(event: Required<NzFormatEmitEvent>) {
    // console.log(event);
    const node = event.node;
    if (node && node.getChildren().length === 0 && node.isExpanded) {
      this.firestore.getCollection(node.key, 'docId').then((documents) => {
        documents.forEach((document: any) => {
          node.addChildren([{ title: document.docId, key: document.docId, isLeaf: true }]);
        });
      });
    }
  }

}

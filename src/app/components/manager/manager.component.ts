import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'fm-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit, OnDestroy {

  databases: any[] = [];
  isDatabaseModalVisible: boolean = false;
  databaseModalOkButtonText: string = 'Add';
  isDatabaseModalOkButtonLoading: boolean = false;
  defaultDatabaseConfig: string = `{
    apiKey: "AIzaSyD9Br4JN2k7lMetLfguHXumHY3aaodw4yp",
    authDomain: "myproject.firebaseapp.com",
    databaseURL: "https://myproject.firebaseio.com",
    projectId: "myproject",
    storageBucket: "myproject.appspot.com",
    messagingSenderId: "2072647547562",
    appId: "1:2072647547562:web:90145c5cce7bdf532797b9"
  }`;
  databaseConfigKeyUp: Subject<string> = new Subject<string>();
  databaseConfig: string = '';
  private selectedDatabaseIndex: number = -1;
  private subscriptions: Subscription[] = [];
  explorerUrl: string = '';

  constructor(private storage: StorageService, private message: NzMessageService, private modalService: NzModalService) { }

  ngOnInit() {
    this.storage.get('databases').then((databases) => {
      if (databases) {
        this.databases = databases;
      }
    });
    this.explorerUrl = this.getExplorerUrl();
    this.subscriptions.push(this.databaseConfigKeyUp.pipe(
        map((event: any) => event.target.value),
        debounceTime(300),
        distinctUntilChanged()
      ).subscribe((config) => {
        //console.log(config);
        this.databaseConfig = config;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => subscription.unsubscribe());
  }

  onAddDatabaseButtonClick() {
    this.databaseModalOkButtonText = 'Add';
    this.databaseConfig = '';
    this.isDatabaseModalVisible = true;
  }

  onDatabaseModalConfirm() {
    this.isDatabaseModalOkButtonLoading = true;
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const config = eval('(' + this.databaseConfig + ')');
          //console.log(config);
          if (config.apiKey && config.authDomain && config.databaseURL && config.projectId && config.storageBucket && config.messagingSenderId && config.appId) {
            // Add
            if (this.databaseModalOkButtonText === 'Add') {
              this.databases.unshift({config: config});
            }
            // Edit
            else {
              this.databases[this.selectedDatabaseIndex].config = config;
            }
            this.saveDatabases();
            this.isDatabaseModalVisible = false;
          } else {
            throw new Error('Invalid configuration!');
          }
        }
        catch(error) {
          console.log(error.message);
          this.message.create('error', 'Please enter a valid configuration.');
        }
        this.isDatabaseModalOkButtonLoading = false;
        resolve();
      }, 300);
    });
  }

  onDatabaseModalCancel() {
    this.isDatabaseModalVisible = false;
  }

  onSelectAction(event, database) {
    this.storage.save('firebase_config', database.config);
    try {
      browser.tabs.create({'url': this.explorerUrl});
      event.preventDefault();
      window.close();
    }
    catch(error) {
      console.log(error.message);
    }
  }

  onEditAction(database, index) {
    this.databaseModalOkButtonText = 'Save';
    this.databaseConfig = this.stringify(database.config);
    this.selectedDatabaseIndex = index;
    this.isDatabaseModalVisible = true;
  }

  onDeleteAction(database, index) {
    //this.selectedDatabaseIndex = index;
    this.modalService.confirm({
      nzTitle: 'Delete',
      nzContent: 'Are you sure delete ' + database.config.projectId + ' ?',
      nzOkText: 'Delete',
      nzOkType: 'danger',
      nzOnOk: () => this.onDeleteActionConfirm(index),
      nzCancelText: 'Cancel'
    });
  }

  onDeleteActionConfirm(index) {
    this.databases.splice(index, 1);
    this.saveDatabases();
  }

  private getExplorerUrl() {
    let url;
    try {
      url = browser.runtime.getURL('index.html');
    }
    catch (error) {
      console.log(error.message);
      url = '/';
    }
    return url;
  }

  private saveDatabases() {
    this.databases = [...this.databases];
    this.storage.save('databases', this.databases);
  }

  private stringify(obj: any) {
    const str = Object.keys(obj).map(key => `\t${key}: "${obj[key]}"`).join(",\n");
    return `{\n${str}\n}`;
  }

}

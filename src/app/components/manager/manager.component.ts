import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { StorageService } from 'src/app/services/storage.service';
import { AppService } from 'src/app/services/app.service';
import { TranslateService } from 'src/app/services/translate.service';
import { DatabaseConfig, DatabaseConfigSample } from 'src/app/models/database-config.model';
import { download } from 'src/app/helpers/download.helper';
import { Database } from 'src/app/models/database.model';

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
  databaseConfigKeyUp: Subject<string> = new Subject<string>();
  databaseConfig: string = '';
  readonly databaseConfigSample: string = DatabaseConfigSample;
  private selectedDatabaseIndex: number = -1;
  private subscriptions: Subscription[] = [];
  private addButtonTranslation: string = 'Add';
  private saveButtonTranslation: string = 'Save';
  private explorerUrl: string = '';
  @ViewChild('importFileInput', { static: false, read: ElementRef }) private importFileInput: ElementRef;

  constructor(
    private storage: StorageService,
    private message: NzMessageService,
    private modalService: NzModalService,
    private translation: TranslateService,
    private app: AppService
  ) { }

  ngOnInit() {
    this.storage.get('databases').then((databases: Database[]) => {
      if (databases) {
        this.databases = databases;
      }
    });
    this.addButtonTranslation = this.translation.get('Add');
    this.saveButtonTranslation = this.translation.get('Save');
    this.explorerUrl = this.app.isWebExtension ? browser.runtime.getURL('index.html') : '.';
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
    this.databaseModalOkButtonText = this.addButtonTranslation;
    this.databaseConfig = '';
    this.isDatabaseModalVisible = true;
  }

  onDatabaseModalConfirm() {
    this.isDatabaseModalOkButtonLoading = true;
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const config: DatabaseConfig = eval('(' + this.databaseConfig + ')');
          //console.log(config);
          if (config.apiKey && config.authDomain && config.databaseURL && config.projectId && config.storageBucket && config.messagingSenderId && config.appId) {
            // Add
            if (this.databaseModalOkButtonText === this.addButtonTranslation) {
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
          this.message.create('error', this.translation.get('Please enter a valid configuration.'));
        }
        this.isDatabaseModalOkButtonLoading = false;
        resolve();
      }, 300);
    });
  }

  onDatabaseModalCancel() {
    this.isDatabaseModalVisible = false;
  }

  onOpenAction(event, index) {
    if (this.app.isWebExtension) {
      browser.tabs.create({'url': this.getDatabaseUrl(index)});
      event.preventDefault();
      window.close();
    }
  }

  getDatabaseUrl(index: number) {
    return `${this.explorerUrl}/?index=${index}`;
  }

  onEditAction(database, index) {
    this.databaseModalOkButtonText = this.saveButtonTranslation;
    this.databaseConfig = this.stringify(database.config);
    this.selectedDatabaseIndex = index;
    this.isDatabaseModalVisible = true;
  }

  onDeleteAction(database, index) {
    //this.selectedDatabaseIndex = index;
    this.modalService.confirm({
      nzTitle: this.translation.get('Delete'),
      nzContent: this.translation.get('Confirm delete?', database.config.projectId),
      nzOkText: this.translation.get('Delete'),
      nzOkType: 'danger',
      nzOnOk: () => this.onDeleteActionConfirm(index),
      nzCancelText: this.translation.get('Cancel')
    });
  }

  onDeleteActionConfirm(index) {
    this.databases.splice(index, 1);
    this.saveDatabases();
  }

  private saveDatabases() {
    this.databases = [...this.databases];
    this.storage.save('databases', this.databases);
  }

  private stringify(obj: any) {
    const str = Object.keys(obj).map(key => `\t${key}: "${obj[key]}"`).join(",\n");
    return `{\n${str}\n}`;
  }

  onImportClick() {
    if (this.app.isWebExtension) {
      browser.runtime.getBackgroundPage().then((background: any) => {
        if (!background) {
          console.warn(`Background page doesn't work in private windows ...`);
          return;
        }
        background.importDatabases();
      });
    } else {
      this.importFileInput.nativeElement.click();
    }
  }

  onImportFileChanged(event: any) {
    const selectedFile = event.target.files[0];
    // Read file
    const fileReader: any = new FileReader();
    fileReader.readAsText(selectedFile, 'UTF-8');
    fileReader.onload = () => {
      // Parse data from file
      try {
        const databases = JSON.parse(fileReader.result);
        if (databases) {
          // ToDo: check if databases config is valid
          this.databases = [...databases];
          this.storage.save('databases', this.databases);
          // Display success message
          this.message.create('success', this.translation.get('Databases successfully imported!'));
        }
      }
      catch(error) {
        this.displayError(error);
      }
    };
    fileReader.onerror = (error) => {
      this.displayError(error);
    };
  }

  private displayError(error) {
    console.log(error.message);
    this.message.create('error', error.message);
  }

  onExportClick() {
    if (this.databases.length) {
      const c = JSON.stringify(this.databases, null, 4);
      const file = new Blob([c], {type: 'text/json'});
      download(file, 'databases.json');
    }
  }

}

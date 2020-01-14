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
import { Authentication, AuthenticationType, AuthenticationData } from 'src/app/models/auth.model';

@Component({
  selector: 'fm-manager',
  templateUrl: './manager.component.html',
  styleUrls: ['./manager.component.css']
})
export class ManagerComponent implements OnInit, OnDestroy {

  databases: any[] = [];
  isDatabaseModalVisible: boolean = false;
  isAuthenticationModalVisible: boolean = false;
  databaseModalOkButtonText: string = 'Add';
  isDatabaseModalOkButtonLoading: boolean = false;
  databaseConfigKeyUp: Subject<string> = new Subject<string>();
  databaseConfig: string = '';
  readonly databaseConfigSample: string = DatabaseConfigSample;
  authentication: Authentication = {
    type: AuthenticationType.None,
    data: AuthenticationData
  };
  readonly authenticationTypes: any = AuthenticationType;
  isAuthenticationPasswordVisible: boolean = false;
  private selectedDatabaseIndex: number = -1;
  private subscriptions: Subscription[] = [];
  private addButtonTranslation: string = 'Add';
  private saveButtonTranslation: string = 'Save';
  private explorerUrl: string = '';
  private isPopup: boolean = false;
  @ViewChild('importFileInput', { static: false, read: ElementRef }) private importFileInput: ElementRef;
  app: AppService;
  translation: TranslateService;

  constructor(
    private storage: StorageService,
    private message: NzMessageService,
    private modalService: NzModalService,
    translation: TranslateService,
    app: AppService
  ) {
    this.app = app;
    this.translation = translation;
  }

  ngOnInit() {
    if (this.app.isWebExtension) {
      browser.tabs.getCurrent().then((tab) => {
        this.isPopup = tab === undefined ? true : false;
        // Fix popup height issue on chrome
        // @see https://github.com/AXeL-dev/firestore-manager/issues/15
        if (this.isPopup) {
          document.documentElement.style.height = 'auto';
        }
      });
    }
    this.storage.get('databases').then((databases: Database[]) => {
      if (databases) {
        this.databases = databases;
      }
    });
    this.addButtonTranslation = this.translation.get('Add');
    this.saveButtonTranslation = this.translation.get('Save');
    this.explorerUrl = this.app.isWebExtension ? browser.runtime.getURL('index.html') : './';
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
          this.message.create('error', this.translation.get('PleaseEnterValidConfiguration'));
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
      browser.tabs.create({url: this.getDatabaseUrl(index)});
      event.preventDefault();
      window.close();
    }
  }

  getDatabaseUrl(index: number) {
    return `${this.explorerUrl}?index=${index}`;
  }

  onSetAuthenticationAction(database, index) {
    if (database.authentication && database.authentication.enabled) {
      this.authentication.type = database.authentication.type;
      this.authentication.data = database.authentication.data;
    } else {
      this.authentication.type = AuthenticationType.None;
      this.authentication.data = AuthenticationData;
    }
    this.selectedDatabaseIndex = index;
    this.isAuthenticationPasswordVisible = false;
    this.isAuthenticationModalVisible = true;
  }

  onAuthenticationModalSave() {
    let auth: Authentication = this.databases[this.selectedDatabaseIndex].authentication || {};
    switch(this.authentication.type) {
      case AuthenticationType.Anonymous:
      case AuthenticationType.EmailAndPassword:
      case AuthenticationType.Token:
        auth.enabled = true;
        auth.type = this.authentication.type;
        auth.data = this.authentication.data;
        break;
      default:
        auth.enabled = false;
    }
    this.databases[this.selectedDatabaseIndex].authentication = auth;
    this.saveDatabases();
    this.isAuthenticationModalVisible = false;
  }

  onAuthenticationModalCancel() {
    this.isAuthenticationModalVisible = false;
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
      nzContent: this.translation.get('ConfirmDelete', database.config.projectId),
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
    if (this.app.isWebExtension && this.isPopup) {
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
          this.message.create('success', this.translation.get('DatabasesSuccessfullyImported'));
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

  switchLanguage(lang: string) {
    this.storage.save('lang', lang).then(() => {
      window.location.reload();
    });
  }

}

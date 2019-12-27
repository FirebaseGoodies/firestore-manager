import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

/** config angular i18n **/
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
registerLocaleData(en);

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OptionsComponent } from './components/options/options.component';
import { ManagerComponent } from './components/manager/manager.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { Guard } from './services/guard.service';
import { StorageService } from './services/storage.service';
import { NgZorroAntdModule, NZ_I18N, en_US } from 'ng-zorro-antd';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule, FirebaseOptionsToken } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FirestoreService } from './services/firestore.service';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { CacheDiffComponent } from './components/partials/cache-diff/cache-diff.component';
import { NotificationService } from './services/notification.service';
import { CanDeactivateGuard } from './services/can-deactivate-guard.service';
import { AppService } from './services/app.service';
import { TranslateService } from './services/translate.service';
import { TranslateDirective } from './directives/translate.directive';
import { TranslatePipe } from './pipes/translate.pipe';
import { AngularFireAuthModule } from '@angular/fire/auth';

@NgModule({
  declarations: [
    AppComponent,
    OptionsComponent,
    ManagerComponent,
    ExplorerComponent,
    CacheDiffComponent,
    TranslateDirective,
    TranslatePipe
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgZorroAntdModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AngularFireModule,
    AngularFirestoreModule,
    AngularFireAuthModule,
    NgJsonEditorModule
  ],
  providers: [
    Guard,
    CanDeactivateGuard,
    FirestoreService,
    NotificationService,
    TranslateService,
    StorageService,
    AppService,
    // Load translations (for web app only)
    { provide: APP_INITIALIZER, useFactory: TranslateService.init, deps: [TranslateService], multi: true },
    // Set database config (for AngularFireModule)
    { provide: FirebaseOptionsToken, useFactory: FirestoreService.getDatabaseConfig },
    // Config ng-zorro-antd i18n (language && date)
    { provide: NZ_I18N, useValue: en_US }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

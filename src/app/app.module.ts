import { BrowserModule } from '@angular/platform-browser';
import { NgModule, APP_INITIALIZER } from '@angular/core';

/** config angular i18n **/
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import fr from '@angular/common/locales/fr';
registerLocaleData(en);
registerLocaleData(fr);

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OptionsComponent } from './components/options/options.component';
import { ManagerComponent } from './components/manager/manager.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { NgZorroAntdModule, NZ_I18N, en_US, fr_FR } from 'ng-zorro-antd';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule, FIREBASE_OPTIONS } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FirestoreService } from './services/firestore.service';
import { NgJsonEditorModule } from 'ang-jsoneditor';
import { CacheDiffComponent } from './components/partials/cache-diff/cache-diff.component';
import { TranslateService } from './services/translate.service';
import { TranslateDirective } from './directives/translate.directive';
import { TranslatePipe } from './pipes/translate.pipe';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { NgxDiff2htmlModule } from 'ngx-diff2html';
import { ClickOutsideDirective } from './directives/click-outside.directive';
import { SafePipe } from './pipes/safe.pipe';
import { DateTimePipe } from './pipes/datetime.pipe';
import { LogoComponent } from './components/partials/logo/logo.component';
import { BackgroundComponent } from './components/background/background.component';
import { AutoBackupComponent } from './components/auto-backup/auto-backup.component';

function getNZLang(translateService: TranslateService) {
  const lang = translateService.getLanguage();
  // console.log(lang);
  const nzLang = {
    fr: fr_FR,
    en: en_US
  };
  return nzLang[lang];
}

@NgModule({
  declarations: [
    AppComponent,
    OptionsComponent,
    ManagerComponent,
    ExplorerComponent,
    CacheDiffComponent,
    TranslateDirective,
    TranslatePipe,
    ClickOutsideDirective,
    SafePipe,
    DateTimePipe,
    LogoComponent,
    BackgroundComponent,
    AutoBackupComponent
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
    NgJsonEditorModule,
    NgxDiff2htmlModule
  ],
  providers: [
    // Load translations (for web app only)
    { provide: APP_INITIALIZER, useFactory: TranslateService.init, deps: [TranslateService], multi: true },
    // Set database config (for AngularFireModule)
    { provide: FIREBASE_OPTIONS, useFactory: FirestoreService.getDatabaseConfig },
    // Config ng-zorro-antd i18n (language & date)
    { provide: NZ_I18N, useFactory: getNZLang, deps: [TranslateService] }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

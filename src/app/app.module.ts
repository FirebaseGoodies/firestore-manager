import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

/** config angular i18n **/
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
registerLocaleData(en);

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OptionsComponent } from './components/options/options.component';
import { BackgroundComponent } from './components/background/background.component';
import { ManagerComponent } from './components/manager/manager.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { Guard } from './services/guard.service';
import { StorageService } from './services/storage.service';
import { NgZorroAntdModule, NZ_I18N, en_US } from 'ng-zorro-antd';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AngularFireModule, FirebaseOptionsToken } from '@angular/fire';
import { AngularFirestoreModule } from '@angular/fire/firestore';

export function initializeApp() {
  const config = StorageService.getTmp('firebase_config');
  //console.log(config);
  return config;
}

@NgModule({
  declarations: [
    AppComponent,
    OptionsComponent,
    BackgroundComponent,
    ManagerComponent,
    ExplorerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgZorroAntdModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AngularFireModule,
    AngularFirestoreModule
  ],
  providers: [
    Guard,
    StorageService,
    /** config ng-zorro-antd i18n (language && date) **/
    { provide: NZ_I18N, useValue: en_US },
    { provide: FirebaseOptionsToken, useFactory: initializeApp }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

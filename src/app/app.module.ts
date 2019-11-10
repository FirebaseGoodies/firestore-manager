import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { OptionsComponent } from './components/options/options.component';
import { BackgroundComponent } from './components/background/background.component';
import { ManagerComponent } from './components/manager/manager.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { Guard } from './services/guard.service';

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
    AppRoutingModule
  ],
  providers: [
    Guard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OptionsComponent } from './components/options/options.component';
import { ManagerComponent } from './components/manager/manager.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { RouteDispatcherGuard } from './guards/route-dispatcher.guard';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { BackgroundComponent } from './components/background/background.component';
import { AutoBackupComponent } from './components/auto-backup/auto-backup.component';
import { DatabaseIndexGuard } from './guards/database-index.guard';


const routes: Routes = [
  {
    path: 'manager',
    component: ManagerComponent
  },
  {
    path: 'explorer',
    component: ExplorerComponent,
    canActivate: [DatabaseIndexGuard],
    canDeactivate: [PendingChangesGuard]
  },
  {
    path: 'options',
    component: OptionsComponent
  },
  {
    path: 'background',
    component: BackgroundComponent
  },
  {
    path: 'autoBackup',
    component: AutoBackupComponent,
    canActivate: [DatabaseIndexGuard]
  },
  {
    path: '**',
    canActivate: [RouteDispatcherGuard], // mostly needed on webextension (not useful on web app)
    component: ManagerComponent,
    // redirectTo: 'manager', // doesn't trigger canActivate guard
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

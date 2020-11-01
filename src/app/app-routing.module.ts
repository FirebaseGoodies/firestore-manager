import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OptionsComponent } from './components/options/options.component';
import { ManagerComponent } from './components/manager/manager.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { RouteDispatchGuard } from './guards/route-dispatch.guard';
import { PendingChangesGuard } from './guards/pending-changes.guard';
import { BackgroundComponent } from './components/background/background.component';
import { BackupComponent } from './components/backup/backup.component';
import { DatabaseCheckGuard } from './guards/database-check.guard';


const routes: Routes = [
  {
    path: 'manager',
    component: ManagerComponent
  },
  {
    path: 'explorer',
    component: ExplorerComponent,
    canActivate: [DatabaseCheckGuard],
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
    path: 'backup',
    component: BackupComponent,
    canActivate: [DatabaseCheckGuard]
  },
  {
    path: '**',
    canActivate: [RouteDispatchGuard], // mostly needed on webextension (not useful on web app)
    component: ManagerComponent,
    // redirectTo: 'manager', // doesn't trigger canActivate guard
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

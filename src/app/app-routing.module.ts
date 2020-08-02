import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OptionsComponent } from './components/options/options.component';
import { ManagerComponent } from './components/manager/manager.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { ExplorerGuard } from './services/explorer-guard.service';
import { CanDeactivateGuard } from './services/can-deactivate-guard.service';


const routes: Routes = [
  {
    path: 'manager',
    component: ManagerComponent
  },
  {
    path: 'options',
    component: OptionsComponent
  },
  {
    path: '**',
    component: ExplorerComponent,
    canActivate: [ExplorerGuard],
    canDeactivate: [CanDeactivateGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

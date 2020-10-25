import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OptionsComponent } from './components/options/options.component';
import { ManagerComponent } from './components/manager/manager.component';
import { ExplorerComponent } from './components/explorer/explorer.component';
import { ExplorerGuard } from './guards/explorer.guard';
import { CanDeactivateGuard } from './guards/can-deactivate.guard';
import { BackgroundComponent } from './components/background/background.component';


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
    path: 'background',
    component: BackgroundComponent
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

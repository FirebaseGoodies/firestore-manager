import { Injectable } from '@angular/core';
import { ExplorerGuard } from './explorer.guard';

@Injectable({
  providedIn: 'root'
})
export class AutoBackupGuard extends ExplorerGuard {

  protected pageName: string = 'autoBackup';

}

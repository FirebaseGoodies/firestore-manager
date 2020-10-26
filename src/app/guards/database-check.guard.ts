import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { Database } from '../models/database.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseCheckGuard implements CanActivate {

  constructor(private router: Router, private storage: StorageService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const index = route.queryParams['dbindex'] || null;

      // console.log(index);
      let databaseFound: boolean = false;
      this.storage.get('databases').then((databases: Database[]) => {
        if (index && databases?.[index]) {
          // console.log(databases[index]);
          const database: Database = {
            index: index,
            config: databases[index].config,
            collections: databases[index].collections,
            authentication: databases[index].authentication || null
          };
          StorageService.setTmp('database', database);
          databaseFound = true;
        }
      }).catch((error) => {
        console.error(error.message);
      }).finally(() => {
        if (databaseFound) {
          resolve(true);
        } else {
          this.router.navigate(['/manager']);
          resolve(false);
        }
      });

    });
  }

}

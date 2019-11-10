import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable()
export class Guard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean>|boolean {

    const page = route.queryParams['page'];
    const pass = false;
    console.log(page);
    
    if (!page || page === 'popup') {
      if (pass) {
        return true;
      }
      this.router.navigate(['/manager']);
      return false;
    }

    this.router.navigate(['/' + page]);
    return false;
  }

}

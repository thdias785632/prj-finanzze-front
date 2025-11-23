import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DashboardGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const user = localStorage.getItem('@Finnanze:User');
    if (!user) {
      this.router.navigate(['']);
      return false;
    }
    return true;
  }
}

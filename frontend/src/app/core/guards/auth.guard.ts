// ============================================
// Authentication Guard (DISABLED FOR DEVELOPMENT)
// Location: frontend/src/app/core/guards/auth.guard.ts
// ============================================

import { Injectable } from '@angular/core';
import { 
  Router, 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // ============================================
    // TEMPORARY: ALWAYS ALLOW ACCESS (NO AUTH CHECK)
    // ============================================
    console.log('⚠️ AuthGuard is DISABLED - Allowing access without authentication');
    return true;
    
    /* ============================================
       ORIGINAL CODE - COMMENTED OUT FOR DEVELOPMENT
       Uncomment this when you want to enable authentication
       ============================================
    
    const isAuthenticated = this.authService.isAuthenticated;
    
    if (isAuthenticated) {
      // Check if token is expired
      if (this.authService.isTokenExpired()) {
        console.log('Token expired, logging out');
        this.authService.logout();
        return this.router.createUrlTree(['/login'], {
          queryParams: { returnUrl: state.url }
        });
      }

      // Check role-based access (if route data specifies required role)
      const requiredRole = route.data['role'];
      if (requiredRole) {
        const userRole = this.authService.getUserRole();
        if (userRole !== requiredRole) {
          console.log('Insufficient permissions');
          return this.router.createUrlTree(['/unauthorized']);
        }
      }

      return true;
    }

    // Not authenticated - redirect to login
    console.log('Not authenticated, redirecting to login');
    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    
    ============================================ */
  }
}
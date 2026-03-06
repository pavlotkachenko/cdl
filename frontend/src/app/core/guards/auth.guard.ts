// ============================================
// AUTH GUARD - Route Protection
// Location: frontend/src/app/core/guards/auth.guard.ts
// ============================================

import { Injectable, inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SubscriptionService } from '../../services/subscription.service';
import { AuthService } from '../services/auth.service';

// ============================================
// Functional Guard (Angular 16+)
// ============================================
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isAuthenticated()) {
    // Check role-based access if required
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = authService.getUserRole();
      if (!requiredRoles.includes(userRole)) {
        console.warn('❌ Access denied: User role', userRole, 'not in', requiredRoles);
        router.navigate(['/unauthorized']);
        return false;
      }
    }

    return true;
  }

  // Not authenticated, redirect to login with return URL
  console.log('❌ Not authenticated, redirecting to login');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

// ============================================
// Class-based Guard (Alternative)
// Use this if functional guard doesn't work
// ============================================
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
    
    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      // Check role-based access if required
      const requiredRoles = route.data['roles'] as string[];
      if (requiredRoles && requiredRoles.length > 0) {
        const userRole = this.authService.getUserRole();
        if (!requiredRoles.includes(userRole)) {
          console.warn('❌ Access denied: User role', userRole, 'not in', requiredRoles);
          return this.router.createUrlTree(['/unauthorized']);
        }
      }

      return true;
    }

    // Not authenticated, redirect to login with return URL
    console.log('❌ Not authenticated, redirecting to login');
    return this.router.createUrlTree(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
  }
}

// ============================================
// Role Guard - Check specific roles
// ============================================
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    const userRole = authService.getUserRole();
    if (allowedRoles.includes(userRole)) {
      return true;
    }

    console.warn('❌ Access denied: User role', userRole, 'not in', allowedRoles);
    router.navigate(['/unauthorized']);
    return false;
  };
};

// ============================================
// Admin Guard - Only admins can access
// ============================================
export const adminGuard: CanActivateFn = roleGuard(['admin']);

// ============================================
// Driver Guard - Only drivers can access
// ============================================
export const driverGuard: CanActivateFn = roleGuard(['driver']);

// ============================================
// Attorney Guard - Attorneys and paralegals can access
// ============================================
export const attorneyGuard: CanActivateFn = roleGuard(['attorney', 'paralegal']);

// ============================================
// Operator Guard - Only operators can access
// ============================================
export const operatorGuard: CanActivateFn = roleGuard(['operator']);

// ============================================
// Carrier Guard - Only carriers can access
// ============================================
export const carrierGuard: CanActivateFn = roleGuard(['carrier']);

// ============================================
// Subscription Guard — requires active subscription
// Redirects to /attorney/subscription on 404; fails open on other errors.
// ============================================
export const subscriptionGuard: CanActivateFn = () => {
  const subscriptionService = inject(SubscriptionService);
  const router = inject(Router);

  return subscriptionService.getCurrentSubscription().pipe(
    map(() => true as const),
    catchError((err) => {
      if (err?.status === 404) {
        router.navigate(['/attorney/subscription']);
        return of(false as const);
      }
      return of(true as const); // fail open on server errors
    }),
  );
};

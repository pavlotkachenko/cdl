// ============================================
// Authentication Guard
// ============================================
// Prevents unauthorized access to protected routes
// Location: frontend/src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';

/**
 * AUTH GUARD
 * Checks if user is logged in before allowing access to a route
 * 
 * Usage in routes:
 * { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true; // User is logged in, allow access
      } else {
        // User is not logged in, redirect to login page
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url } // Remember where they wanted to go
        });
        return false;
      }
    })
  );
};

// ============================================
// Role Guard Factory
// ============================================
// Location: frontend/src/app/core/guards/role.guard.ts

/**
 * ROLE GUARD
 * Checks if user has required role
 * 
 * Usage in routes:
 * { 
 *   path: 'admin', 
 *   component: AdminComponent, 
 *   canActivate: [authGuard, roleGuard(['admin'])] 
 * }
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          // Not logged in
          router.navigate(['/login']);
          return false;
        }

        if (allowedRoles.includes(user.role)) {
          return true; // User has correct role
        } else {
          // User doesn't have permission
          console.warn(`Access denied. Required role: ${allowedRoles.join(' or ')}`);
          router.navigate(['/unauthorized']); // Or redirect to their dashboard
          return false;
        }
      })
    );
  };
}

// ============================================
// Guest Guard
// ============================================
// Location: frontend/src/app/core/guards/guest.guard.ts

/**
 * GUEST GUARD
 * Redirects logged-in users away from login/register pages
 * 
 * Usage:
 * { path: 'login', component: LoginComponent, canActivate: [guestGuard] }
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return true; // Not logged in, can access login page
      } else {
        // Already logged in, redirect to dashboard
        const user = authService.getCurrentUser();
        
        switch (user?.role) {
          case 'admin':
            router.navigate(['/admin']);
            break;
          case 'operator':
            router.navigate(['/operator']);
            break;
          case 'attorney':
            router.navigate(['/attorney']);
            break;
          default:
            router.navigate(['/driver']);
        }
        
        return false;
      }
    })
  );
};

// ============================================
// HOW TO USE THESE GUARDS
// ============================================

/*
In your app-routing.module.ts:

import { authGuard, roleGuard, guestGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Public routes (anyone can access)
  { path: '', component: HomeComponent },
  
  // Guest only routes (redirect if logged in)
  { 
    path: 'login', 
    component: LoginComponent, 
    canActivate: [guestGuard] 
  },
  { 
    path: 'register', 
    component: RegisterComponent, 
    canActivate: [guestGuard] 
  },
  
  // Protected routes (must be logged in)
  {
    path: 'driver',
    component: DriverDashboardComponent,
    canActivate: [authGuard, roleGuard(['driver'])]
  },
  {
    path: 'operator',
    component: OperatorDashboardComponent,
    canActivate: [authGuard, roleGuard(['operator', 'admin'])]
  },
  {
    path: 'attorney',
    component: AttorneyDashboardComponent,
    canActivate: [authGuard, roleGuard(['attorney', 'admin'])]
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [authGuard, roleGuard(['admin'])]
  },
  
  // Catch all
  { path: '**', redirectTo: '' }
];
*/

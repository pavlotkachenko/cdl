// ============================================
// App Routes (COMPLETE - with Admin routes)
// Location: frontend/src/app/app.routes.ts
// ============================================

import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';

export const routes: Routes = [
  // Landing page (public - no auth required)
  {
    path: '',
    loadChildren: () => import('./features/landing/landing.module').then(m => m.LandingModule)
  },

  // Auth routes (no guard)
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },

  // Driver routes (AuthGuard disabled for development)
  {
    path: 'driver',
    loadChildren: () => import('./features/driver/driver.module').then(m => m.DriverModule)
    // canActivate: [AuthGuard]  // ← Commented out for development
  },

  // Admin routes (AuthGuard disabled for development)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
    // canActivate: [AuthGuard]  // ← Commented out for development
  },

  // Attorney routes (AuthGuard disabled for development)
  {
    path: 'attorney',
    loadChildren: () => import('./features/attorney/attorney.module').then(m => m.AttorneyModule)
    // canActivate: [AuthGuard]  // ← Commented out for development
  },

  // Catch-all redirect
  {
    path: '**',
    redirectTo: '/login'
  }
];
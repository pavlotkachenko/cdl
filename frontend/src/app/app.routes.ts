// ============================================
// App Routes (COMPLETE - with Admin routes)
// Location: frontend/src/app/app.routes.ts
// ============================================

import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { RoleSelectComponent } from './features/auth/role-select/role-select.component';
import { authGuard } from './core/guards/auth.guard';

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
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },

  // Sign-up entry points
  {
    path: 'signup',
    component: RoleSelectComponent
  },
  {
    path: 'signup/driver',
    component: RegisterComponent,
    data: { role: 'driver' }
  },
  {
    path: 'signup/carrier',
    loadComponent: () => import('./features/carrier/signup/carrier-signup-wizard.component')
      .then(m => m.CarrierSignupWizardComponent)
  },

  // Driver routes
  {
    path: 'driver',
    canActivate: [authGuard],
    loadChildren: () => import('./features/driver/driver.module').then(m => m.DriverModule)
  },

  // Admin routes
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
  },

  // Attorney routes
  {
    path: 'attorney',
    canActivate: [authGuard],
    loadChildren: () => import('./features/attorney/attorney.module').then(m => m.AttorneyModule)
  },

  // Carrier routes
  {
    path: 'carrier',
    canActivate: [authGuard],
    loadChildren: () => import('./features/carrier/carrier.module').then(m => m.CarrierModule)
  },

  // Paralegal routes
  {
    path: 'paralegal',
    canActivate: [authGuard],
    loadChildren: () => import('./features/paralegal/paralegal.module').then(m => m.ParalegalModule)
  },

  // Catch-all redirect
  {
    path: '**',
    redirectTo: '/login'
  }
];
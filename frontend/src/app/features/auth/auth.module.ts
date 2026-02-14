// ============================================
// Auth Module - FIXED (imports standalone components)
// Location: frontend/src/app/features/auth/auth.module.ts
// ============================================

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

// Import standalone components (don't declare them!)
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

// Define routes
const routes: Routes = [
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
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    // Import standalone components here
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent
  ]
})
export class AuthModule { }

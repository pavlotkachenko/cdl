import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HelpComponent } from './features/driver/help/help.component';
import { ContactComponent } from './features/driver/contact/contact.component';
import { PrivacyComponent } from './features/legal/privacy/privacy.component';
import { TermsComponent } from './features/legal/terms/terms.component';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';

// ← EXPORT the routes constant
export const routes: Routes = [
  // Public routes
  {
    path: '',
    loadComponent: () => import('./landing-page/landing-page.component').then(m => m.LandingPageComponent)
  },
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
    path: 'signup/carrier',
    loadComponent: () => import('./auth/carrier-signup/carrier-signup.component').then(m => m.CarrierSignupComponent)
  },
  {
    path: 'signup/driver',
    component: RegisterComponent
  },

  // Protected routes
  {
    path: 'driver',
    loadChildren: () => import('./features/driver/driver.module').then(m => m.DriverModule),
    //canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule)
  },
  {
    path: 'attorney',
    loadChildren: () => import('./features/attorney/attorney.module').then(m => m.AttorneyModule)
  },
  {
    path: 'operator',
    loadChildren: () => import('./features/operator/operator.module').then(m => m.OperatorModule)
  },
  {
    path: 'driver/help',
    component: HelpComponent
  },
  {
    path: 'driver/contact',
    component: ContactComponent
  },
  
  // Legal Pages
  {
    path: 'privacy',
    component: PrivacyComponent
  },
  {
    path: 'terms',
    component: TermsComponent
  },
  
  // Placeholder routes (optional)
  {
    path: 'cookies',
    redirectTo: 'privacy', pathMatch: 'full'
  },
  {
    path: 'accessibility',
    redirectTo: 'driver/help', pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

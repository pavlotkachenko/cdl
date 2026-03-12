import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CarrierDashboardComponent } from './dashboard/carrier-dashboard.component';
import { CarrierDriversComponent } from './drivers/carrier-drivers.component';
import { CarrierCasesComponent } from './cases/carrier-cases.component';
import { CarrierProfileComponent } from './profile/carrier-profile.component';
import { LayoutComponent } from '../../core/layout/layout.component';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: CarrierDashboardComponent
      },
      {
        path: 'drivers',
        component: CarrierDriversComponent
      },
      {
        path: 'cases',
        component: CarrierCasesComponent
      },
      {
        path: 'profile',
        component: CarrierProfileComponent
      },
      {
        path: 'analytics',
        loadComponent: () => import('./analytics/carrier-analytics.component').then(m => m.CarrierAnalyticsComponent)
      },
      {
        path: 'bulk-import',
        loadComponent: () => import('./bulk-import/bulk-import.component').then(m => m.BulkImportComponent)
      },
      {
        path: 'compliance-report',
        loadComponent: () => import('./compliance-report/compliance-report.component').then(m => m.ComplianceReportComponent)
      },
      {
        path: 'webhooks',
        loadComponent: () => import('./webhooks/webhook-management.component').then(m => m.WebhookManagementComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./payments/carrier-payments.component').then(m => m.CarrierPaymentsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notifications/carrier-notifications.component').then(m => m.CarrierNotificationsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/carrier-settings.component').then(m => m.CarrierSettingsComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./documents/carrier-documents.component').then(m => m.CarrierDocumentsComponent)
      },
      {
        path: 'subscription',
        loadComponent: () => import('../attorney/subscription-management/subscription-management.component').then(m => m.SubscriptionManagementComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CarrierRoutingModule { }

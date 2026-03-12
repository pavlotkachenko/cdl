import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
        loadComponent: () => import('./attorney-dashboard/attorney-dashboard.component').then(m => m.AttorneyDashboardComponent)
      },
      {
        path: 'cases',
        loadComponent: () => import('./attorney-cases/attorney-cases.component').then(m => m.AttorneyCasesComponent)
      },
      {
        path: 'cases/:caseId',
        loadComponent: () => import('./attorney-case-detail/attorney-case-detail.component').then(m => m.AttorneyCaseDetailComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./attorney-clients/attorney-clients.component').then(m => m.AttorneyClientsComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./attorney-calendar/attorney-calendar.component').then(m => m.AttorneyCalendarComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./attorney-notifications/attorney-notifications.component').then(m => m.AttorneyNotificationsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./attorney-reports/attorney-reports.component').then(m => m.AttorneyReportsComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./attorney-documents/attorney-documents.component').then(m => m.AttorneyDocumentsComponent)
      },
      {
        path: 'subscription',
        loadComponent: () => import('./subscription-management/subscription-management.component').then(m => m.SubscriptionManagementComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttorneyRoutingModule { }

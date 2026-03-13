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
        loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'cases',
        loadComponent: () => import('./case-management/case-management.component').then(m => m.CaseManagementComponent)
      },
      {
        path: 'cases/:id',
        loadComponent: () => import('./case-management/case-management.component').then(m => m.CaseManagementComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('./staff-management/staff-management.component').then(m => m.StaffManagementComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./client-management/client-management.component').then(m => m.ClientManagementComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'revenue',
        loadComponent: () => import('./revenue-dashboard/revenue-dashboard.component').then(m => m.RevenueDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notifications/admin-notifications.component').then(m => m.AdminNotificationsComponent)
      },
      {
        path: 'documents',
        loadComponent: () => import('./documents/admin-documents.component').then(m => m.AdminDocumentsComponent)
      },
      {
        path: 'assignment-requests',
        loadComponent: () => import('./assignment-requests/admin-assignment-requests.component').then(m => m.AdminAssignmentRequestsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/admin-settings.component').then(m => m.AdminSettingsComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
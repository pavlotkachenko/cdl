import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from '../../core/layout/layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { CaseManagementComponent } from './case-management/case-management.component';

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
        component: AdminDashboardComponent
      },
      {
        path: 'cases',
        component: CaseManagementComponent
      },
      {
        path: 'cases/:id',
        loadComponent: () => import('../admin/case-management/case-management.component').then(m => m.CaseManagementComponent)
      },
      {
        path: 'staff',
        loadComponent: () => import('../admin/staff-management/staff-management.component').then(m => m.StaffManagementComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('../admin/client-management/client-management.component').then(m => m.ClientManagementComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('../admin/reports/reports.component').then(m => m.ReportsComponent)
        
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
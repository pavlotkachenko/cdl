import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from '../../core/layout/layout.component';
import { AttorneyDashboardComponent } from './attorney-dashboard/attorney-dashboard.component';

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
        component: AttorneyDashboardComponent
      },
      {
        path: 'subscription',
        loadComponent: () => import('./subscription-management/subscription-management.component').then(m => m.SubscriptionManagementComponent)
      },
      {
        path: 'cases/:caseId',
        loadComponent: () => import('./attorney-case-detail/attorney-case-detail.component').then(m => m.AttorneyCaseDetailComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttorneyRoutingModule { }

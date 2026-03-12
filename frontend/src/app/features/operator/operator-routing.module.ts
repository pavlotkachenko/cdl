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
        loadComponent: () => import('./operator-dashboard/operator-dashboard.component').then(m => m.OperatorDashboardComponent)
      },
      {
        path: 'cases',
        loadComponent: () => import('./operator-dashboard/operator-dashboard.component').then(m => m.OperatorDashboardComponent)
      },
      {
        path: 'queue',
        loadComponent: () => import('./operator-dashboard/operator-dashboard.component').then(m => m.OperatorDashboardComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./operator-notifications/operator-notifications.component').then(m => m.OperatorNotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./operator-profile/operator-profile.component').then(m => m.OperatorProfileComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OperatorRoutingModule {}

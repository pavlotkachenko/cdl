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
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CarrierRoutingModule { }

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParalegalDashboardComponent } from './dashboard/paralegal-dashboard.component';
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
        component: ParalegalDashboardComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ParalegalRoutingModule { }

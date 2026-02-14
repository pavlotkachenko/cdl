import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TicketsComponent } from './tickets.component';

const routes: Routes = [
  {
    path: '',
    component: TicketsComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    TicketsComponent,  // Import the standalone component
    RouterModule.forChild(routes),
   
  ]
})
export class TicketsModule { }

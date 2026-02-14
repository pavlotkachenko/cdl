import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SubmitTicketComponent } from './submit-ticket.component';

const routes: Routes = [
  {
    path: '',
    component: SubmitTicketComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    SubmitTicketComponent,  // Import the standalone component
    RouterModule.forChild(routes),
    
  ]
})
export class SubmitTicketModule { }

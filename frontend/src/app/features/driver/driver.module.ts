import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Shared Module
import { SharedModule } from '../../shared/shared.module';

// Routing
import { DriverRoutingModule } from './driver-routing.module';

// Services
import { DriverService } from './services/driver.service';
import { TicketService } from './services/ticket.service';

@NgModule({
  declarations: [
    // Empty - all components are standalone
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule,
    DriverRoutingModule,  // ← Import the routing module
    
    // Material Modules
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  providers: [
    DriverService,
    TicketService
  ]
})
export class DriverModule { }
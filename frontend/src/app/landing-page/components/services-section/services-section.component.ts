import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-services-section',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule, MatCardModule, MatIconModule],
  templateUrl: './services-section.component.html',
  styleUrls: ['./services-section.component.scss']
})
export class ServicesSectionComponent {
  currentView: 'drivers' | 'carriers' = 'drivers';

  driversServices = [
    { icon: 'person', title: 'Personal Safety Expert', content: 'Have questions or concerns in regards to your driving privileges...' },
    { icon: 'ticket', title: 'Submit your ticket', content: 'We help you to fight tickets in all states...' },
    { icon: 'car-crash', title: 'Accident, claims', content: 'Have an accident or struggling with a claim...' },
    { icon: 'screen-search', title: 'MVR', content: 'Monitor your motor vehicle record...' }
  ];

  carriersServices = [
    { icon: 'driver-ticket', title: "Driver's Tickets", content: 'Maintain your CSA scores...' },
    { icon: 'DOT', title: 'DOT, MC Setup', content: 'We help you establish a new company...' },
    { icon: 'DQF', title: 'DQF, MVR', content: 'Create Driver Qualification File...' },
    { icon: 'inspections', title: 'Inspections', content: 'Expert opinion about driver inspections...' },
    { icon: 'safety-training', title: 'Safety Training', content: 'Improve your Safety team skills...' },
    { icon: 'weekly-safety', title: 'Weekly Safety', content: 'Arrange weekly meetings...' },
    { icon: 'mock-audit', title: 'Mock Audit', content: 'Perform a mock audit...' },
    { icon: 'CSA', title: 'CSA Review', content: 'Check your CSA scores...' },
    { icon: 'accidents-claims', title: 'Accidents', content: 'Let our experts help...' },
    { icon: 'insurance', title: 'Insurance', content: 'Manage and control cost...' },
    { icon: 'hos', title: 'HOS', content: 'Monitor compliance...' },
    { icon: 'crash-lines', title: 'Crash lines', content: 'Report accidents 24/7...' },
    { icon: 'maintenance', title: 'Maintenance', content: 'Develop maintenance schedule...' }
  ];

  get services() {
    return this.currentView === 'drivers' ? this.driversServices : this.carriersServices;
  }
}

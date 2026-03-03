import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../../services/dashboard.service';

interface Ticket {
  id: string;
  violation_type: string;
  status: string;
  statusColor: 'green' | 'amber' | 'red';
  statusText: string;
  court_date?: string;
  Attorney?: { 
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
  };
}

interface DashboardData {
  summary: { 
    active: number; 
    resolved: number; 
    upcomingCourts: number;
  };
  activeTickets: Ticket[];
  resolvedTickets: Ticket[];
  upcomingCourts: Ticket[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  dashboardData: DashboardData | null = null;
  loading = true;
  error = false;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = false;
    this.dashboardService.getDriverDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Dashboard load failed:', err);
        this.loading = false;
        this.error = true;
      }
    });
  }

  getColorClass(color: string): string {
    return `status-${color}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getAttorneyName(attorney: Ticket['Attorney']): string {
    if (!attorney) return '';
    return `${attorney.first_name} ${attorney.last_name}`;
  }
}

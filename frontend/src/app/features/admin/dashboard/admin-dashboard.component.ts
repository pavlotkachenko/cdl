// ============================================
// Admin Dashboard Component (FIXED)
// Location: frontend/src/app/features/admin/dashboard/admin-dashboard.component.ts
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';

// Services
import { AdminService, DashboardStats, Case, WorkloadDistribution } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressBarModule,
    MatMenuModule
  ]
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  recentCases: Case[] = [];
  workload: WorkloadDistribution[] = [];
  loading = true;

  // Make Math available in template
  Math = Math;

  // Table columns
  displayedColumns = ['caseNumber', 'client', 'type', 'status', 'assigned', 'priority', 'actions'];

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load stats
    this.adminService.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => console.error('Error loading stats:', err)
    });

    // Load recent cases
    this.adminService.getAllCases({ limit: 10, sort: 'createdAt', order: 'desc' }).subscribe({
      next: (cases) => {
        this.recentCases = cases.slice(0, 10);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading cases:', err);
        this.loading = false;
      }
    });

    // Load workload
    this.adminService.getWorkloadDistribution().subscribe({
      next: (workload) => {
        this.workload = workload;
      },
      error: (err) => console.error('Error loading workload:', err)
    });
  }

  // ============================================
  // Quick Actions
  // ============================================

  viewCase(caseItem: Case): void {
    this.router.navigate(['/admin/cases', caseItem.id]);
  }

  assignCase(caseItem: Case): void {
    this.router.navigate(['/admin/cases', caseItem.id, 'assign']);
  }

  viewAllCases(): void {
    this.router.navigate(['/admin/cases']);
  }

  viewStaff(): void {
    this.router.navigate(['/admin/staff']);
  }

  viewClients(): void {
    this.router.navigate(['/admin/clients']);
  }

  viewReports(): void {
    this.router.navigate(['/admin/reports']);
  }

  // ============================================
  // Status Helpers
  // ============================================

  getStatusColor(status: Case['status']): string {
    const colors: Record<Case['status'], string> = {
      new: 'accent',
      assigned: 'primary',
      in_progress: 'primary',
      pending_court: 'warn',
      resolved: 'accent',
      closed: ''
    };
    return colors[status] || '';
  }

  getStatusLabel(status: Case['status']): string {
    const labels: Record<Case['status'], string> = {
      new: 'New',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      pending_court: 'Pending Court',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return labels[status] || status;
  }

  getPriorityColor(priority: Case['priority']): string {
    const colors: Record<Case['priority'], string> = {
      low: 'primary',
      medium: 'accent',
      high: 'warn',
      urgent: 'warn'
    };
    return colors[priority] || '';
  }

  getPriorityLabel(priority: Case['priority']): string {
    const labels: Record<Case['priority'], string> = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      urgent: 'Urgent'
    };
    return labels[priority] || priority;
  }

  // ============================================
  // Metrics Calculations
  // ============================================

  getRevenueChange(): number {
    if (!this.stats) return 0;
    if (this.stats.revenueLastMonth === 0) return 100;
    return ((this.stats.revenueThisMonth - this.stats.revenueLastMonth) / this.stats.revenueLastMonth) * 100;
  }

  getCaseChange(): number {
    if (!this.stats) return 0;
    if (this.stats.casesLastWeek === 0) return 100;
    return ((this.stats.casesThisWeek - this.stats.casesLastWeek) / this.stats.casesLastWeek) * 100;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
}

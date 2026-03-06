import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DecimalPipe } from '@angular/common';

import { AdminService, PerformanceMetrics, StaffMember } from '../../../core/services/admin.service';

type ReportType = 'overview' | 'staff' | 'cases' | 'financial';

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatFormFieldModule,
    MatProgressBarModule, MatProgressSpinnerModule, MatChipsModule,
    DecimalPipe,
  ],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <h1>Reports</h1>
        <div class="header-actions">
          <mat-form-field appearance="outline">
            <mat-label>Report Type</mat-label>
            <mat-select [value]="reportType()" (selectionChange)="reportType.set($event.value)">
              <mat-option value="overview">Overview</mat-option>
              <mat-option value="staff">Staff Performance</mat-option>
              <mat-option value="cases">Cases</mat-option>
              <mat-option value="financial">Financial</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Staff Member</mat-label>
            <mat-select [value]="selectedStaff()" (selectionChange)="onStaffChange($event.value)">
              <mat-option value="all">All Staff</mat-option>
              @for (member of staffMembers(); track member.id) {
                <mat-option [value]="member.id">{{ member.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <button mat-stroked-button (click)="printReport()">
            <mat-icon>print</mat-icon> Print
          </button>
          <button mat-stroked-button (click)="exportReport()">
            <mat-icon>download</mat-icon> Export
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
      }

      @if (!loading()) {
        @if (filteredMetrics().length === 0) {
          <mat-card>
            <mat-card-content class="empty-state">
              <mat-icon>bar_chart</mat-icon>
              <p>No performance data available</p>
            </mat-card-content>
          </mat-card>
        }

        @for (metric of filteredMetrics(); track metric.staffId) {
          <mat-card class="metric-card">
            <mat-card-header>
              <mat-card-title>{{ metric.staffName }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="metrics-row">
                <div class="metric-item">
                  <span class="metric-label">Total Cases</span>
                  <span class="metric-value">{{ metric.totalCases }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Resolved</span>
                  <span class="metric-value">{{ metric.resolvedCases }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Avg Resolution</span>
                  <span class="metric-value">{{ metric.avgResolutionTime | number:'1.1-1' }} days</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">Satisfaction</span>
                  <span class="metric-value">{{ metric.clientSatisfaction | number:'1.1-1' }}/5</span>
                </div>
              </div>
              <div class="success-rate-row">
                <span class="rate-label">Success Rate</span>
                <mat-progress-bar
                  [value]="metric.successRate"
                  [color]="getSuccessRateColor(metric.successRate)">
                </mat-progress-bar>
                <mat-chip [color]="getSuccessRateColor(metric.successRate)" highlighted>
                  {{ metric.successRate | number:'1.0-0' }}%
                </mat-chip>
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);

  performanceMetrics = signal<PerformanceMetrics[]>([]);
  staffMembers = signal<StaffMember[]>([]);
  loading = signal(false);
  selectedStaff = signal('all');
  reportType = signal<ReportType>('overview');

  filteredMetrics = computed(() => {
    const id = this.selectedStaff();
    if (id === 'all') return this.performanceMetrics();
    return this.performanceMetrics().filter(m => m.staffId === id);
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['staffId']) this.selectedStaff.set(params['staffId']);
    });
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    const staffId = this.selectedStaff() === 'all' ? undefined : this.selectedStaff();

    this.adminService.getStaffPerformance(staffId).subscribe({
      next: (metrics) => {
        this.performanceMetrics.set(metrics);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.adminService.getAllStaff().subscribe({
      next: (staff) => this.staffMembers.set(staff),
    });
  }

  onStaffChange(id: string): void {
    this.selectedStaff.set(id);
    this.loadData();
  }

  exportReport(): void {
    window.print();
  }

  printReport(): void {
    window.print();
  }

  getSuccessRateColor(rate: number): string {
    if (rate >= 90) return 'accent';
    if (rate >= 80) return 'primary';
    return 'warn';
  }
}

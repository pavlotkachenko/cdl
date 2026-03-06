import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';

import {
  AdminService, DashboardStats, Case, WorkloadDistribution,
} from '../../../core/services/admin.service';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

const STATUS_LABELS: Record<Case['status'], string> = {
  new: 'New', assigned: 'Assigned', in_progress: 'In Progress',
  pending_court: 'Pending Court', resolved: 'Resolved', closed: 'Closed',
};

const PRIORITY_LABELS: Record<Case['priority'], string> = {
  low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
};

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule, MatChipsModule,
    ErrorStateComponent, SkeletonLoaderComponent,
  ],
  template: `
    <div class="admin-dash">
      <div class="page-header">
        <h1>Admin Dashboard</h1>
        <div class="quick-actions">
          <button mat-stroked-button (click)="viewAllCases()">All Cases</button>
          <button mat-stroked-button (click)="viewStaff()">Staff</button>
          <button mat-stroked-button (click)="viewReports()">Reports</button>
        </div>
      </div>

      @if (loading()) {
        <app-skeleton-loader [rows]="6" [height]="68"></app-skeleton-loader>
        <div style="height:16px"></div>
        <app-skeleton-loader [rows]="3" [height]="56"></app-skeleton-loader>
      } @else if (error()) {
        <app-error-state [message]="error()" retryLabel="Retry" (retry)="loadDashboardData()"></app-error-state>
      } @else {
        <div class="stat-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-lbl">Total Cases</p>
              <p class="stat-val">{{ stats()?.totalCases ?? 0 }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-lbl">Active</p>
              <p class="stat-val active">{{ stats()?.activeCases ?? 0 }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-lbl">Pending</p>
              <p class="stat-val pending">{{ stats()?.pendingCases ?? 0 }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-lbl">Resolved</p>
              <p class="stat-val resolved">{{ stats()?.resolvedCases ?? 0 }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-lbl">Success Rate</p>
              <p class="stat-val">{{ stats()?.successRate?.toFixed(1) ?? 0 }}%</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-lbl">Revenue (Month)</p>
              <p class="stat-val">{{ formatCurrency(stats()?.revenueThisMonth ?? 0) }}</p>
              @if (revenueChange() !== 0) {
                <p [class]="'stat-delta ' + (revenueChange() > 0 ? 'up' : 'down')">
                  {{ revenueChange() > 0 ? '+' : '' }}{{ revenueChange().toFixed(1) }}%
                </p>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>Recent Cases</mat-card-title>
            <div class="card-action">
              <button mat-button (click)="viewAllCases()">View All</button>
            </div>
          </mat-card-header>
          <mat-card-content>
            @if (recentCases().length === 0) {
              <div class="empty-state" role="status">
                <mat-icon aria-hidden="true">folder_open</mat-icon>
                <p class="empty-title">No cases yet</p>
                <p class="empty-hint">Cases submitted by drivers will appear here.</p>
                <button mat-stroked-button color="primary" (click)="viewAllCases()">View All Cases</button>
              </div>
            } @else {
              @for (c of recentCases(); track c.id) {
                <div class="case-row"
                     role="button"
                     tabindex="0"
                     (click)="viewCase(c)"
                     (keydown.enter)="viewCase(c)"
                     [attr.aria-label]="'View case ' + c.caseNumber">
                  <div class="case-info">
                    <span class="case-num">{{ c.caseNumber }}</span>
                    <span class="case-client">{{ c.clientName }}</span>
                    <span class="case-type">{{ c.violationType }}</span>
                  </div>
                  <div class="case-badges">
                    <span [class]="'badge status-' + c.status">{{ getStatusLabel(c.status) }}</span>
                    <span [class]="'badge priority-' + c.priority">{{ getPriorityLabel(c.priority) }}</span>
                  </div>
                </div>
                <mat-divider></mat-divider>
              }
            }
          </mat-card-content>
        </mat-card>

        @if (workload().length > 0) {
          <mat-card class="section-card">
            <mat-card-header><mat-card-title>Staff Workload</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (w of workload(); track w.staffId) {
                <div class="workload-row">
                  <span class="staff-name">{{ w.staffName }}</span>
                  <span class="workload-num">{{ w.activeCases }}/{{ w.capacity }}</span>
                  <span [class]="'util-badge ' + (w.utilization >= 90 ? 'over' : w.utilization >= 70 ? 'high' : 'ok')">
                    {{ w.utilization.toFixed(0) }}%
                  </span>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .admin-dash { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }
    .quick-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-card mat-card-content { padding: 12px 16px; }
    .stat-lbl { margin: 0; font-size: 0.72rem; color: #888; text-transform: uppercase; }
    .stat-val { margin: 4px 0 0; font-size: 1.5rem; font-weight: 700; }
    .stat-val.active { color: #1976d2; }
    .stat-val.pending { color: #f57c00; }
    .stat-val.resolved { color: #388e3c; }
    .stat-delta { margin: 2px 0 0; font-size: 0.72rem; font-weight: 600; }
    .stat-delta.up { color: #388e3c; }
    .stat-delta.down { color: #d32f2f; }
    .section-card { margin-bottom: 16px; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-action { margin-left: auto; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: #999; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ccc; }
    .empty-title { margin: 4px 0 0; font-size: 1rem; font-weight: 500; color: #666; }
    .empty-hint { margin: 0; font-size: 0.82rem; color: #999; }
    .case-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; cursor: pointer; }
    .case-row:hover { background: #f5f5f5; border-radius: 4px; }
    .case-row:focus-visible { outline: 2px solid #1976d2; border-radius: 4px; }
    .case-info { display: flex; flex-direction: column; gap: 2px; }
    .case-num { font-weight: 600; font-size: 0.9rem; }
    .case-client { font-size: 0.82rem; color: #444; }
    .case-type { font-size: 0.78rem; color: #888; }
    .case-badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    .badge { font-size: 0.7rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
    .status-new { background: #e3f2fd; color: #1565c0; }
    .status-assigned { background: #e8f5e9; color: #2e7d32; }
    .status-in_progress { background: #fff3e0; color: #e65100; }
    .status-pending_court { background: #fff8e1; color: #f57f17; }
    .status-resolved { background: #e8f5e9; color: #1b5e20; }
    .status-closed { background: #f5f5f5; color: #616161; }
    .priority-low { background: #f5f5f5; color: #616161; }
    .priority-medium { background: #fff3e0; color: #e65100; }
    .priority-high { background: #fce4ec; color: #880e4f; }
    .priority-urgent { background: #ffebee; color: #b71c1c; }
    .workload-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .staff-name { flex: 1; font-size: 0.9rem; }
    .workload-num { font-size: 0.82rem; color: #666; }
    .util-badge { font-size: 0.72rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
    .util-badge.ok { background: #e8f5e9; color: #2e7d32; }
    .util-badge.high { background: #fff3e0; color: #e65100; }
    .util-badge.over { background: #ffebee; color: #c62828; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  stats = signal<DashboardStats | null>(null);
  recentCases = signal<Case[]>([]);
  workload = signal<WorkloadDistribution[]>([]);
  loading = signal(true);
  error = signal('');

  revenueChange = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    if (s.revenueLastMonth === 0) return 100;
    return ((s.revenueThisMonth - s.revenueLastMonth) / s.revenueLastMonth) * 100;
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');
    this.adminService.getDashboardStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {},
    });
    this.adminService.getAllCases({ limit: 10, sort: 'createdAt', order: 'desc' }).subscribe({
      next: (cases) => { this.recentCases.set(cases.slice(0, 10)); this.loading.set(false); },
      error: () => { this.error.set('Failed to load dashboard data.'); this.loading.set(false); },
    });
    this.adminService.getWorkloadDistribution().subscribe({
      next: (w) => this.workload.set(w),
      error: () => {},
    });
  }

  viewCase(c: Case): void { this.router.navigate(['/admin/cases', c.id]); }
  viewAllCases(): void { this.router.navigate(['/admin/cases']); }
  viewStaff(): void { this.router.navigate(['/admin/staff']); }
  viewReports(): void { this.router.navigate(['/admin/reports']); }

  getStatusLabel(status: Case['status']): string {
    return STATUS_LABELS[status] ?? status;
  }

  getPriorityLabel(priority: Case['priority']): string {
    return PRIORITY_LABELS[priority] ?? priority;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  }
}

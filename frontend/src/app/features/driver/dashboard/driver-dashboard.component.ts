import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/services/auth.service';
import { CaseService, Case } from '../../../core/services/case.service';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

const ACTIVE_STATUSES = new Set([
  'new', 'reviewed', 'assigned_to_attorney', 'send_info_to_attorney', 'in_progress', 'under_review',
]);
const PENDING_STATUSES = new Set(['waiting_for_driver', 'submitted']);
const RESOLVED_STATUSES = new Set(['resolved', 'closed']);
const REJECTED_STATUSES = new Set(['rejected', 'denied']);

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  submitted: 'Submitted',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  reviewed: 'Reviewed',
  assigned_to_attorney: 'With Attorney',
  send_info_to_attorney: 'Pending Attorney Info',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
  denied: 'Denied',
  waiting_for_driver: 'Waiting for Info',
};

const STATUS_CLASSES: Record<string, string> = {
  new: 'status-new',
  submitted: 'status-submitted',
  under_review: 'status-progress',
  in_progress: 'status-progress',
  reviewed: 'status-progress',
  assigned_to_attorney: 'status-progress',
  send_info_to_attorney: 'status-progress',
  resolved: 'status-success',
  closed: 'status-success',
  rejected: 'status-error',
  denied: 'status-error',
  waiting_for_driver: 'status-warning',
};

@Component({
  selector: 'app-driver-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule, ErrorStateComponent, SkeletonLoaderComponent],
  template: `
    <div class="dash-page">
      <div class="dash-header">
        <div>
          <h1>My Dashboard</h1>
          @if (currentUser()) {
            <p class="welcome">Welcome back, {{ currentUser()!.name }}</p>
          }
        </div>
        <button mat-raised-button color="primary" (click)="submitNewCase()">
          <mat-icon>add</mat-icon> Submit Ticket
        </button>
      </div>

      @if (loading()) {
        <app-skeleton-loader [rows]="4" [height]="72"></app-skeleton-loader>
        <div class="skeleton-spacer"></div>
        <app-skeleton-loader [rows]="3" [height]="56"></app-skeleton-loader>
      } @else if (error()) {
        <app-error-state [message]="error()" retryLabel="Retry" (retry)="loadDashboardData()"></app-error-state>
      } @else {
        <div class="stat-grid">
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-label">Total</p>
              <p class="stat-value">{{ stats().total }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-label">Active</p>
              <p class="stat-value active">{{ stats().active }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-label">Pending</p>
              <p class="stat-value pending">{{ stats().pending }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card">
            <mat-card-content>
              <p class="stat-label">Resolved</p>
              <p class="stat-value resolved">{{ stats().resolved }}</p>
            </mat-card-content>
          </mat-card>
        </div>

        <mat-card class="cases-card">
          <mat-card-header>
            <mat-card-title>Recent Cases</mat-card-title>
            <div class="header-actions">
              <button mat-button (click)="viewAllCases()">View All</button>
            </div>
          </mat-card-header>
          <mat-card-content>
            @if (recentCases().length === 0) {
              <p class="empty-state">No cases yet. Submit your first ticket above.</p>
            } @else {
              @for (c of recentCases(); track c.id) {
                <div class="case-row"
                     role="button"
                     tabindex="0"
                     (click)="viewCase(c)"
                     (keydown.enter)="viewCase(c)"
                     [attr.aria-label]="'View case ' + (c.case_number || c.id)">
                  <div class="case-info">
                    <span class="case-num">{{ c.case_number || c.ticketNumber || c.id }}</span>
                    <span class="case-type">{{ c.violation_type || c.type || 'CDL Ticket' }}</span>
                  </div>
                  <span [class]="'status-badge ' + getStatusClass(c.status)">
                    {{ getStatusLabel(c.status) }}
                  </span>
                </div>
                <mat-divider></mat-divider>
              }
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,

  styles: [`
    .dash-page { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
    .dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .dash-header h1 { margin: 0; font-size: 1.4rem; }
    .welcome { margin: 4px 0 0; font-size: 0.9rem; color: #666; }
    .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat-card mat-card-content { padding: 12px 16px; }
    .stat-label { margin: 0; font-size: 0.75rem; color: #888; text-transform: uppercase; }
    .stat-value { margin: 4px 0 0; font-size: 1.6rem; font-weight: 700; }
    .stat-value.active { color: #1976d2; }
    .stat-value.pending { color: #f57c00; }
    .stat-value.resolved { color: #388e3c; }
    .skeleton-spacer { height: 20px; }
    .cases-card mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .header-actions { margin-left: auto; }
    .empty-state { color: #999; text-align: center; padding: 24px 0; margin: 0; }
    .case-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; cursor: pointer; }
    .case-row:hover { background: #f5f5f5; border-radius: 4px; }
    .case-row:focus-visible { outline: 2px solid #1976d2; border-radius: 4px; }
    .case-info { display: flex; flex-direction: column; gap: 2px; }
    .case-num { font-weight: 600; font-size: 0.9rem; }
    .case-type { font-size: 0.8rem; color: #666; }
    .status-badge { font-size: 0.72rem; padding: 3px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap; }
    .status-new { background: #e3f2fd; color: #1565c0; }
    .status-submitted { background: #f3e5f5; color: #6a1b9a; }
    .status-progress { background: #fff3e0; color: #e65100; }
    .status-success { background: #e8f5e9; color: #2e7d32; }
    .status-error { background: #ffebee; color: #c62828; }
    .status-warning { background: #fff8e1; color: #f57f17; }
    .status-default { background: #f5f5f5; color: #424242; }
  `],
})
export class DriverDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private caseService = inject(CaseService);
  private router = inject(Router);

  cases = signal<Case[]>([]);
  loading = signal(true);
  error = signal('');
  currentUser = signal<any>(null);

  recentCases = computed(() => this.cases().slice(0, 5));

  stats = computed(() => {
    const list = this.cases();
    return {
      total: list.length,
      active: list.filter(c => ACTIVE_STATUSES.has(c.status)).length,
      pending: list.filter(c => PENDING_STATUSES.has(c.status)).length,
      resolved: list.filter(c => RESOLVED_STATUSES.has(c.status)).length,
      rejected: list.filter(c => REJECTED_STATUSES.has(c.status)).length,
    };
  });

  ngOnInit(): void {
    this.currentUser.set(this.authService.getCurrentUser());
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');
    this.caseService.getMyCases().subscribe({
      next: (response) => {
        this.cases.set(response.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard data');
        this.loading.set(false);
      },
    });
  }

  submitNewCase(): void {
    this.router.navigate(['/driver/submit-ticket']);
  }

  viewCase(caseItem: Case): void {
    this.router.navigate(['/driver/cases', caseItem.id]);
  }

  viewAllCases(): void {
    this.router.navigate(['/driver/tickets']);
  }

  getStatusLabel(status: string): string {
    return STATUS_LABELS[status]
      ?? status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getStatusClass(status: string): string {
    return STATUS_CLASSES[status] ?? 'status-default';
  }
}

import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

import { AdminService, Case, StaffMember } from '../../../core/services/admin.service';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

type StatusFilter = Case['status'] | 'all';
type PriorityFilter = Case['priority'] | 'all';

const STATUS_KEYS: Record<Case['status'], string> = {
  new: 'ADMIN.STATUS_NEW', assigned: 'ADMIN.STATUS_ASSIGNED', in_progress: 'ADMIN.STATUS_IN_PROGRESS',
  pending_court: 'ADMIN.STATUS_PENDING_COURT', resolved: 'ADMIN.STATUS_RESOLVED', closed: 'ADMIN.STATUS_CLOSED',
};

const PRIORITY_KEYS: Record<Case['priority'], string> = {
  low: 'ADMIN.PRIORITY_LOW', medium: 'ADMIN.PRIORITY_MEDIUM', high: 'ADMIN.PRIORITY_HIGH', urgent: 'ADMIN.PRIORITY_URGENT',
};

@Component({
  selector: 'app-case-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule,
    ErrorStateComponent, SkeletonLoaderComponent, TranslateModule,
  ],
  template: `
    <div class="case-mgmt">
      <div class="page-header">
        <h1>{{ 'ADMIN.CASE_MANAGEMENT' | translate }}</h1>
        <button mat-raised-button color="primary" (click)="openNewCase()">
          <mat-icon>add</mat-icon> {{ 'ADMIN.NEW_CASE' | translate }}
        </button>
      </div>

      <div class="filter-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>{{ 'ADMIN.SEARCH_CASES' | translate }}</mat-label>
          <input matInput
                 [value]="searchTerm()"
                 (input)="searchTerm.set($any($event.target).value)"
                 [attr.aria-label]="'ADMIN.SEARCH_CASES' | translate" />
          <mat-icon matSuffix aria-hidden="true">search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'ADMIN.STATUS' | translate }}</mat-label>
          <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value)">
            @for (s of statuses; track s.value) {
              <mat-option [value]="s.value">{{ s.key | translate }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>{{ 'ADMIN.PRIORITY' | translate }}</mat-label>
          <mat-select [value]="priorityFilter()" (selectionChange)="priorityFilter.set($event.value)">
            @for (p of priorities; track p.value) {
              <mat-option [value]="p.value">{{ p.key | translate }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (searchTerm() || statusFilter() !== 'all' || priorityFilter() !== 'all') {
          <button mat-button (click)="clearFilters()">{{ 'ADMIN.CLEAR' | translate }}</button>
        }
      </div>

      @if (loading()) {
        <app-skeleton-loader [rows]="5" [height]="90"></app-skeleton-loader>
      } @else if (error()) {
        <app-error-state [message]="error() | translate" [retryLabel]="'ADMIN.RETRY' | translate" (retry)="loadData()"></app-error-state>
      } @else if (filteredCases().length === 0) {
        <p class="empty" role="status">{{ 'ADMIN.NO_CASES_MATCH' | translate }}</p>
      } @else {
        <p class="result-count" role="status">{{ filteredCases().length }} {{ 'ADMIN.CASES_COUNT' | translate }}</p>
        @for (c of filteredCases(); track c.id) {
          <mat-card class="case-card">
            <mat-card-content>
              <div class="case-header">
                <div class="case-meta">
                  <span class="case-num">{{ c.caseNumber }}</span>
                  <span class="case-client">{{ c.clientName }}</span>
                  <span class="case-type">{{ c.violationType }}</span>
                </div>
                <div class="case-badges">
                  <span [class]="'badge status-' + c.status">{{ getStatusKey(c.status) | translate }}</span>
                  <span [class]="'badge priority-' + c.priority">{{ getPriorityKey(c.priority) | translate }}</span>
                </div>
              </div>
              <div class="case-staff-row">
                @if (c.assignedToName) {
                  <span class="staff-tag"><mat-icon class="staff-icon">gavel</mat-icon> {{ c.assignedToName }}</span>
                }
                @if (c.operatorName) {
                  <span class="staff-tag"><mat-icon class="staff-icon">support_agent</mat-icon> {{ c.operatorName }}</span>
                }
              </div>
              <div class="case-actions">
                <button mat-button (click)="toggleDetail(c.id)">
                  <mat-icon>{{ expandedCaseId() === c.id ? 'expand_less' : 'visibility' }}</mat-icon>
                  {{ (expandedCaseId() === c.id ? 'ADMIN.HIDE_DETAILS' : 'ADMIN.VIEW') | translate }}
                </button>
                @for (s of quickStatuses; track s.value) {
                  @if (c.status !== s.value) {
                    <button mat-button (click)="updateStatus(c, s.value)">
                      {{ s.key | translate }}
                    </button>
                  }
                }
              </div>
              @if (expandedCaseId() === c.id) {
                <div class="case-detail-panel">
                  <mat-divider></mat-divider>
                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="detail-label">{{ 'ADMIN.CASE_NUMBER' | translate }}</span>
                      <span class="detail-value">{{ c.caseNumber }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">{{ 'ADMIN.CLIENT_NAME' | translate }}</span>
                      <span class="detail-value">{{ c.clientName }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">{{ 'ADMIN.CLIENT_EMAIL' | translate }}</span>
                      <span class="detail-value">{{ c.clientEmail }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">{{ 'ADMIN.VIOLATION_TYPE' | translate }}</span>
                      <span class="detail-value">{{ c.violationType }}</span>
                    </div>
                    @if (c.location) {
                      <div class="detail-item">
                        <span class="detail-label">{{ 'ADMIN.LOCATION' | translate }}</span>
                        <span class="detail-value">{{ c.location }}</span>
                      </div>
                    }
                    @if (c.fineAmount) {
                      <div class="detail-item">
                        <span class="detail-label">{{ 'ADMIN.FINE_AMOUNT' | translate }}</span>
                        <span class="detail-value">{{ formatCurrency(c.fineAmount) }}</span>
                      </div>
                    }
                    @if (c.courtDate) {
                      <div class="detail-item">
                        <span class="detail-label">{{ 'ADMIN.COURT_DATE' | translate }}</span>
                        <span class="detail-value">{{ formatDate(c.courtDate) }}</span>
                      </div>
                    }
                    @if (c.description) {
                      <div class="detail-item full-width">
                        <span class="detail-label">{{ 'ADMIN.DESCRIPTION' | translate }}</span>
                        <span class="detail-value">{{ c.description }}</span>
                      </div>
                    }
                    @if (c.tags && c.tags.length > 0) {
                      <div class="detail-item full-width">
                        <span class="detail-label">{{ 'ADMIN.TAGS' | translate }}</span>
                        <div class="tag-list">
                          @for (tag of c.tags; track tag) {
                            <span class="tag-chip">{{ tag }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .case-mgmt { max-width: 900px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }
    .filter-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .search-field { flex: 1; min-width: 200px; }
    .empty, .result-count { color: #999; font-size: 0.85rem; margin: 8px 0; }
    .result-count { color: #555; }
    .case-card { margin-bottom: 10px; }
    .case-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .case-meta { display: flex; flex-direction: column; gap: 2px; }
    .case-num { font-weight: 700; font-size: 0.95rem; }
    .case-client { font-size: 0.85rem; color: #444; }
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
    .case-staff-row { display: flex; gap: 12px; margin: 6px 0 0; flex-wrap: wrap; }
    .staff-tag { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #555; }
    .staff-icon { font-size: 14px; width: 14px; height: 14px; color: #888; }
    .case-actions { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; }
    .case-detail-panel { padding: 12px 0 4px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-item.full-width { grid-column: 1 / -1; }
    .detail-label { font-size: 0.72rem; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
    .detail-value { font-size: 0.88rem; color: #333; }
    .tag-list { display: flex; gap: 6px; flex-wrap: wrap; }
    .tag-chip { font-size: 0.72rem; padding: 2px 8px; border-radius: 10px; background: #e3f2fd; color: #1565c0; font-weight: 500; }
  `],
})
export class CaseManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  cases = signal<Case[]>([]);
  staff = signal<StaffMember[]>([]);
  loading = signal(false);
  error = signal('');
  searchTerm = signal('');
  statusFilter = signal<StatusFilter>('all');
  priorityFilter = signal<PriorityFilter>('all');
  expandedCaseId = signal<string | null>(null);

  filteredCases = computed(() => {
    let list = this.cases();
    const term = this.searchTerm().toLowerCase();
    if (term) {
      list = list.filter(c =>
        c.caseNumber.toLowerCase().includes(term) ||
        c.clientName.toLowerCase().includes(term) ||
        c.clientEmail.toLowerCase().includes(term) ||
        c.violationType.toLowerCase().includes(term),
      );
    }
    const status = this.statusFilter();
    if (status !== 'all') list = list.filter(c => c.status === status);
    const priority = this.priorityFilter();
    if (priority !== 'all') list = list.filter(c => c.priority === priority);
    return list;
  });

  readonly statuses: { value: StatusFilter; key: string }[] = [
    { value: 'all', key: 'ADMIN.ALL_STATUSES' },
    { value: 'new', key: 'ADMIN.STATUS_NEW' },
    { value: 'assigned', key: 'ADMIN.STATUS_ASSIGNED' },
    { value: 'in_progress', key: 'ADMIN.STATUS_IN_PROGRESS' },
    { value: 'pending_court', key: 'ADMIN.STATUS_PENDING_COURT' },
    { value: 'resolved', key: 'ADMIN.STATUS_RESOLVED' },
    { value: 'closed', key: 'ADMIN.STATUS_CLOSED' },
  ];

  readonly priorities: { value: PriorityFilter; key: string }[] = [
    { value: 'all', key: 'ADMIN.ALL_PRIORITIES' },
    { value: 'low', key: 'ADMIN.PRIORITY_LOW' },
    { value: 'medium', key: 'ADMIN.PRIORITY_MEDIUM' },
    { value: 'high', key: 'ADMIN.PRIORITY_HIGH' },
    { value: 'urgent', key: 'ADMIN.PRIORITY_URGENT' },
  ];

  readonly quickStatuses: { value: Case['status']; key: string }[] = [
    { value: 'assigned', key: 'ADMIN.MARK_ASSIGNED' },
    { value: 'in_progress', key: 'ADMIN.MARK_IN_PROGRESS' },
    { value: 'resolved', key: 'ADMIN.RESOLVE' },
    { value: 'closed', key: 'ADMIN.CLOSE_CASE' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.adminService.getAllCases().subscribe({
      next: (cases) => { this.cases.set(cases); this.loading.set(false); },
      error: () => { this.error.set('ADMIN.FAILED_LOAD'); this.loading.set(false); },
    });
    this.adminService.getAllStaff().subscribe({
      next: (staff) => this.staff.set(staff.filter(s => s.role === 'attorney')),
      error: () => {},
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('all');
    this.priorityFilter.set('all');
  }

  toggleDetail(caseId: string): void {
    this.expandedCaseId.set(this.expandedCaseId() === caseId ? null : caseId);
  }

  viewCase(c: Case): void {
    this.router.navigate(['/admin/cases', c.id]);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  openNewCase(): void {
    this.snackBar.open('Case creation coming soon.', 'Close', { duration: 3000 });
  }

  updateStatus(c: Case, status: Case['status']): void {
    this.adminService.updateCaseStatus(c.id, status).subscribe({
      next: () => {
        this.snackBar.open('Status updated.', 'Close', { duration: 3000 });
        this.loadData();
      },
      error: () => this.snackBar.open('Failed to update status.', 'Close', { duration: 3000 }),
    });
  }

  getStatusKey(status: Case['status']): string {
    return STATUS_KEYS[status] ?? status;
  }

  getPriorityKey(priority: Case['priority']): string {
    return PRIORITY_KEYS[priority] ?? priority;
  }
}

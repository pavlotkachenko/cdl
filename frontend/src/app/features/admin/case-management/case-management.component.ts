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
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { AdminService, Case, StaffMember } from '../../../core/services/admin.service';
import { StatusWorkflowService } from '../../../core/services/status-workflow.service';
import { StatusNoteDialogComponent } from '../../operator/status-pipeline/status-note-dialog.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

type StatusFilter = string;
type PriorityFilter = string;

const STATUS_KEYS: Record<string, string> = {
  new: 'ADMIN.STATUS_NEW', reviewed: 'ADMIN.STATUS_REVIEWED',
  assigned: 'ADMIN.STATUS_ASSIGNED', assigned_to_attorney: 'ADMIN.STATUS_ASSIGNED',
  in_progress: 'ADMIN.STATUS_IN_PROGRESS',
  send_info_to_attorney: 'ADMIN.STATUS_INFO_SENT', waiting_for_driver: 'ADMIN.STATUS_WAITING',
  call_court: 'ADMIN.STATUS_CALL_COURT', check_with_manager: 'ADMIN.STATUS_CHECK_MGR',
  pay_attorney: 'ADMIN.STATUS_PAY_ATTY', attorney_paid: 'ADMIN.STATUS_ATTY_PAID',
  pending_court: 'ADMIN.STATUS_PENDING_COURT',
  resolved: 'ADMIN.STATUS_RESOLVED', closed: 'ADMIN.STATUS_CLOSED',
};

const STATUS_ICONS: Record<string, string> = {
  new: 'fiber_new', reviewed: 'rate_review',
  assigned_to_attorney: 'person_add', send_info_to_attorney: 'send',
  waiting_for_driver: 'hourglass_top', call_court: 'phone',
  check_with_manager: 'supervisor_account', pay_attorney: 'payment',
  attorney_paid: 'paid', resolved: 'check_circle', closed: 'lock',
};

const ALL_STATUSES = [
  'new', 'reviewed', 'assigned_to_attorney', 'send_info_to_attorney',
  'waiting_for_driver', 'call_court', 'check_with_manager',
  'pay_attorney', 'attorney_paid', 'resolved', 'closed',
];

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
                  <span class="case-num">{{ c.caseNumber || c.case_number }}</span>
                  <span class="case-client">{{ c.clientName || c.customer_name }}</span>
                  <span class="case-type">{{ c.violationType || c.violation_type }}</span>
                </div>
                <div class="case-badges">
                  <span [class]="'badge status-' + c.status">{{ getStatusKey(c.status) | translate }}</span>
                  @if (c.priority) {
                    <span [class]="'badge priority-' + c.priority">{{ getPriorityKey(c.priority) | translate }}</span>
                  }
                </div>
              </div>
              <div class="case-staff-row">
                @if (c.assignedToName || c.attorney_name) {
                  <span class="staff-tag"><mat-icon class="staff-icon">gavel</mat-icon> {{ c.assignedToName || c.attorney_name }}</span>
                }
                @if (c.operatorName || c.operator_name) {
                  <span class="staff-tag"><mat-icon class="staff-icon">support_agent</mat-icon> {{ c.operatorName || c.operator_name }}</span>
                }
              </div>
              <div class="case-actions">
                <button mat-button (click)="toggleDetail(c.id)">
                  <mat-icon>{{ expandedCaseId() === c.id ? 'expand_less' : 'visibility' }}</mat-icon>
                  {{ (expandedCaseId() === c.id ? 'ADMIN.HIDE_DETAILS' : 'ADMIN.VIEW') | translate }}
                </button>
              </div>

              <!-- Expanded detail with workflow status actions -->
              @if (expandedCaseId() === c.id) {
                <div class="case-detail-panel">
                  <mat-divider></mat-divider>

                  <!-- Status Workflow Actions -->
                  <div class="status-actions" aria-label="Status actions">
                    @if (loadingStatuses()[c.id]) {
                      <mat-spinner diameter="20" role="status" aria-busy="true"></mat-spinner>
                    } @else {
                      @for (ns of nextStatuses()[c.id] || []; track ns) {
                        <button mat-stroked-button
                                class="status-action"
                                (click)="onStatusAction(c, ns)"
                                [attr.aria-label]="'Change status to ' + ns + ' for case ' + c.case_number">
                          <mat-icon>{{ getStatusIcon(ns) }}</mat-icon>
                          {{ getStatusKey(ns) | translate }}
                        </button>
                      }

                      @if ((nextStatuses()[c.id] || []).length === 0 && !loadingStatuses()[c.id]) {
                        <span class="terminal-status">{{ 'ADMIN.CASE.TERMINAL_STATUS' | translate }}</span>
                      }

                      <button mat-stroked-button class="override-btn" (click)="onOverride(c)">
                        <mat-icon>admin_panel_settings</mat-icon>
                        {{ 'ADMIN.CASE.OVERRIDE_STATUS' | translate }}
                      </button>
                    }
                  </div>

                  <div class="detail-grid">
                    <div class="detail-item">
                      <span class="detail-label">{{ 'ADMIN.CASE_NUMBER' | translate }}</span>
                      <span class="detail-value">{{ c.caseNumber || c.case_number }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">{{ 'ADMIN.CLIENT_NAME' | translate }}</span>
                      <span class="detail-value">{{ c.clientName || c.customer_name }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">{{ 'ADMIN.CLIENT_EMAIL' | translate }}</span>
                      <span class="detail-value">{{ c.clientEmail || c.customer_email }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">{{ 'ADMIN.VIOLATION_TYPE' | translate }}</span>
                      <span class="detail-value">{{ c.violationType || c.violation_type }}</span>
                    </div>
                    @if (c.location || c.state) {
                      <div class="detail-item">
                        <span class="detail-label">{{ 'ADMIN.LOCATION' | translate }}</span>
                        <span class="detail-value">{{ c.location || c.state }}</span>
                      </div>
                    }
                    @if (c.fineAmount || c.attorney_price) {
                      <div class="detail-item">
                        <span class="detail-label">{{ 'ADMIN.FINE_AMOUNT' | translate }}</span>
                        <span class="detail-value">{{ formatCurrency(c.fineAmount || c.attorney_price) }}</span>
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

    <!-- Override Dialog -->
    @if (overrideDialog()) {
      <div class="dialog-backdrop" (click)="cancelOverride()"></div>
      <div class="override-dialog" role="alertdialog" aria-modal="true"
           aria-label="Override status" (keydown.escape)="cancelOverride()">
        <h3 class="override-title">
          <mat-icon>admin_panel_settings</mat-icon>
          Override Status
        </h3>
        <p class="override-warn">
          This is a non-standard transition. A note is required for audit purposes.
        </p>
        <p class="override-current">
          Current: <strong>{{ getStatusKey(overrideDialog()!.currentStatus) | translate }}</strong>
        </p>
        <mat-form-field appearance="outline" class="override-field">
          <mat-label>Target Status</mat-label>
          <mat-select [value]="overrideTargetStatus()"
                      (selectionChange)="overrideTargetStatus.set($event.value)">
            @for (s of overrideStatuses(); track s) {
              <mat-option [value]="s">{{ getStatusKey(s) | translate }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="override-field">
          <mat-label>Note (required, min 10 chars)</mat-label>
          <textarea matInput
                    rows="3"
                    [value]="overrideNote()"
                    (input)="overrideNote.set($any($event.target).value)"
                    aria-label="Override note"></textarea>
        </mat-form-field>
        <div class="override-actions">
          <button mat-stroked-button (click)="cancelOverride()">Cancel</button>
          <button mat-flat-button color="warn"
                  (click)="confirmOverride()"
                  [disabled]="!overrideTargetStatus() || overrideNote().length < 10">
            Override
          </button>
        </div>
      </div>
    }
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
    .status-reviewed { background: #fff3e0; color: #e65100; }
    .status-assigned, .status-assigned_to_attorney { background: #e8f5e9; color: #2e7d32; }
    .status-in_progress { background: #fff3e0; color: #e65100; }
    .status-send_info_to_attorney { background: #e8eaf6; color: #283593; }
    .status-waiting_for_driver { background: #fce4ec; color: #880e4f; }
    .status-call_court { background: #fff8e1; color: #f57f17; }
    .status-check_with_manager { background: #f3e5f5; color: #6a1b9a; }
    .status-pay_attorney { background: #e0f2f1; color: #00695c; }
    .status-attorney_paid { background: #e8f5e9; color: #2e7d32; }
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

    /* Status workflow actions */
    .status-actions {
      display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
      margin: 12px 0; padding: 12px;
      background: #f8f9fa; border-radius: 8px; border: 1px solid #e0e0e0;
    }
    .status-action {
      font-size: 0.82rem;
      border-color: #388e3c !important;
      color: #388e3c !important;
    }
    .status-action mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    .terminal-status {
      font-size: 0.82rem; color: #757575; font-style: italic;
    }
    .override-btn {
      font-size: 0.82rem;
      color: #757575 !important;
      border-color: #bdbdbd !important;
      margin-left: auto;
    }
    .override-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-item.full-width { grid-column: 1 / -1; }
    .detail-label { font-size: 0.72rem; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
    .detail-value { font-size: 0.88rem; color: #333; }

    /* Override dialog */
    .dialog-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200;
    }
    .override-dialog {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: #fff; border-radius: 12px; padding: 24px;
      max-width: 420px; width: 90vw; z-index: 201;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .override-title {
      display: flex; align-items: center; gap: 8px;
      margin: 0 0 8px; font-size: 1.1rem;
    }
    .override-title mat-icon { color: #f57c00; }
    .override-warn { font-size: 0.85rem; color: #d32f2f; margin: 0 0 8px; }
    .override-current { font-size: 0.85rem; color: #555; margin: 0 0 16px; }
    .override-field { width: 100%; }
    .override-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }
  `],
})
export class CaseManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private workflowService = inject(StatusWorkflowService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  cases = signal<any[]>([]);
  staff = signal<StaffMember[]>([]);
  loading = signal(false);
  error = signal('');
  searchTerm = signal('');
  statusFilter = signal<StatusFilter>('all');
  priorityFilter = signal<PriorityFilter>('all');
  expandedCaseId = signal<string | null>(null);

  // Dynamic workflow state per expanded case
  nextStatuses = signal<Record<string, string[]>>({});
  requiresNote = signal<Record<string, Record<string, boolean>>>({});
  loadingStatuses = signal<Record<string, boolean>>({});

  // Override dialog state
  overrideDialog = signal<{ caseId: string; currentStatus: string } | null>(null);
  overrideTargetStatus = signal('');
  overrideNote = signal('');

  filteredCases = computed(() => {
    let list = this.cases();
    const term = this.searchTerm().toLowerCase();
    if (term) {
      list = list.filter((c: any) =>
        (c.caseNumber || c.case_number || '').toLowerCase().includes(term) ||
        (c.clientName || c.customer_name || '').toLowerCase().includes(term) ||
        (c.clientEmail || c.customer_email || '').toLowerCase().includes(term) ||
        (c.violationType || c.violation_type || '').toLowerCase().includes(term),
      );
    }
    const status = this.statusFilter();
    if (status !== 'all') list = list.filter((c: any) => c.status === status);
    const priority = this.priorityFilter();
    if (priority !== 'all') list = list.filter((c: any) => c.priority === priority);
    return list;
  });

  overrideStatuses = computed(() => {
    const dialog = this.overrideDialog();
    if (!dialog) return [];
    return ALL_STATUSES.filter(s => s !== dialog.currentStatus);
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

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.adminService.getAllCases().subscribe({
      next: (resp) => { this.cases.set(resp.cases || []); this.loading.set(false); },
      error: () => { this.error.set('ADMIN.FAILED_LOAD'); this.loading.set(false); },
    });
    this.adminService.getAllStaff().subscribe({
      next: (staff) => this.staff.set(staff.filter(s => s.role === 'attorney')),
      error: () => {},
    });
  }

  toggleDetail(caseId: string): void {
    if (this.expandedCaseId() === caseId) {
      this.expandedCaseId.set(null);
    } else {
      this.expandedCaseId.set(caseId);
      this.loadNextStatuses(caseId);
    }
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set('all');
    this.priorityFilter.set('all');
  }

  viewCase(c: any): void {
    this.router.navigate(['/admin/cases', c.id]);
  }

  // ── Workflow status actions ──

  private loadNextStatuses(caseId: string): void {
    this.loadingStatuses.update(m => ({ ...m, [caseId]: true }));
    this.workflowService.getNextStatuses(caseId).subscribe({
      next: (resp) => {
        this.nextStatuses.update(m => ({ ...m, [caseId]: resp.nextStatuses || [] }));
        this.requiresNote.update(m => ({ ...m, [caseId]: resp.requiresNote || {} }));
        this.loadingStatuses.update(m => ({ ...m, [caseId]: false }));
      },
      error: () => {
        this.nextStatuses.update(m => ({ ...m, [caseId]: [] }));
        this.loadingStatuses.update(m => ({ ...m, [caseId]: false }));
      },
    });
  }

  async onStatusAction(c: any, targetStatus: string): Promise<void> {
    const caseId = c.id;
    const noteRequired = this.requiresNote()[caseId]?.[targetStatus];

    if (noteRequired) {
      const dialogRef = this.dialog.open(StatusNoteDialogComponent, {
        width: '400px',
        data: { targetStatus },
      });
      const note = await firstValueFrom(dialogRef.afterClosed());
      if (!note) return; // cancelled
      this.executeStatusChange(caseId, targetStatus, note);
    } else {
      this.executeStatusChange(caseId, targetStatus);
    }
  }

  // ── Override flow ──

  onOverride(c: any): void {
    this.overrideDialog.set({ caseId: c.id, currentStatus: c.status });
    this.overrideTargetStatus.set('');
    this.overrideNote.set('');
  }

  cancelOverride(): void {
    this.overrideDialog.set(null);
  }

  confirmOverride(): void {
    const dialog = this.overrideDialog();
    if (!dialog) return;
    const target = this.overrideTargetStatus();
    const note = this.overrideNote();
    if (!target || note.length < 10) return;

    this.overrideDialog.set(null);
    this.adminService.updateCaseStatus(dialog.caseId, target, note, true).subscribe({
      next: () => {
        this.snackBar.open('Status overridden successfully.', 'Close', { duration: 3000 });
        this.loadData();
      },
      error: () => this.snackBar.open('Failed to override status.', 'Close', { duration: 3000 }),
    });
  }

  // ── Helpers ──

  getStatusKey(status: string): string {
    return STATUS_KEYS[status] ?? status;
  }

  getPriorityKey(priority: string): string {
    return PRIORITY_KEYS[priority as Case['priority']] ?? priority;
  }

  getStatusIcon(status: string): string {
    return STATUS_ICONS[status] ?? 'swap_horiz';
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

  private executeStatusChange(caseId: string, status: string, comment?: string): void {
    this.adminService.updateCaseStatus(caseId, status, comment).subscribe({
      next: () => {
        this.snackBar.open('Status updated.', 'Close', { duration: 3000 });
        this.loadData();
      },
      error: () => this.snackBar.open('Failed to update status.', 'Close', { duration: 3000 }),
    });
  }
}

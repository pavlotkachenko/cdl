import {
  Component, OnInit, signal, computed, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of, finalize } from 'rxjs';

import { CaseService } from '../../../core/services/case.service';
import { AttorneyAssignmentComponent, AttorneyAssignmentDialogResult } from '../attorney-assignment/attorney-assignment.component';

const STATUS_LABELS: Record<string, string> = {
  new: 'OPR.STATUS_NEW',
  submitted: 'OPR.STATUS_NEW',
  reviewed: 'OPR.STATUS_IN_PROGRESS',
  assigned_to_attorney: 'OPR.STATUS_ASSIGNED',
  send_info_to_attorney: 'OPR.STATUS_IN_PROGRESS',
  waiting_for_driver: 'OPR.STATUS_IN_PROGRESS',
  call_court: 'OPR.STATUS_PENDING_COURT',
  check_with_manager: 'OPR.STATUS_CHECK_MANAGER',
  pay_attorney: 'OPR.STATUS_PAY_ATTORNEY',
  attorney_paid: 'OPR.STATUS_ATTORNEY_PAID',
  closed: 'OPR.STATUS_CLOSED',
  in_progress: 'OPR.STATUS_IN_PROGRESS',
};

const VALID_STATUSES = [
  'new', 'reviewed', 'assigned_to_attorney', 'waiting_for_driver',
  'send_info_to_attorney', 'attorney_paid', 'call_court',
  'check_with_manager', 'pay_attorney', 'closed',
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#E53935',
  high: '#FB8C00',
  medium: '#FDD835',
  low: '#43A047',
};

@Component({
  selector: 'app-operator-case-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, CurrencyPipe, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatTooltipModule, MatChipsModule,
    TranslateModule,
  ],
  template: `
    <!-- Loading -->
    @if (loading()) {
      <div class="loading-container" role="status">
        <mat-spinner diameter="48"></mat-spinner>
        <p>{{ 'OPR.DETAIL.LOADING' | translate }}</p>
      </div>
    }

    <!-- Error -->
    @if (error()) {
      <div class="error-container" role="alert">
        <mat-icon>error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-flat-button (click)="loadCase()">{{ 'OPR.DETAIL.RETRY' | translate }}</button>
      </div>
    }

    <!-- Case Detail -->
    @if (!loading() && !error() && caseData()) {
      <!-- Header bar -->
      <div class="detail-header">
        <button mat-icon-button (click)="goBack()" [attr.aria-label]="'OPR.DETAIL.BACK' | translate" class="back-btn">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div class="header-info">
          <h1 class="case-number">{{ caseData()!.case_number }}</h1>
          <mat-chip-set aria-label="Case status">
            <mat-chip [class]="'status-chip status-' + caseData()!.status" highlighted>
              {{ getStatusKey(caseData()!.status) | translate }}
            </mat-chip>
          </mat-chip-set>
          <span class="age-badge" [matTooltip]="'OPR.DETAIL.CASE_AGE' | translate">
            <mat-icon class="age-icon">schedule</mat-icon>
            {{ formatAge(caseData()!.ageHours) }}
          </span>
          <span class="priority-indicator" [style.background]="getPriorityColor(caseData()!.priority)"
                [matTooltip]="getPriorityLabel(caseData()!.priority)">
            {{ caseData()!.priority }}
          </span>
        </div>
      </div>

      <div class="detail-grid">
        <!-- Left column: Ticket + Court Dates -->
        <div class="detail-column">
          <!-- Ticket info -->
          <mat-card appearance="outlined" class="detail-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>description</mat-icon>
              <mat-card-title>{{ 'OPR.DETAIL.TICKET_INFO' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <dl class="info-list">
                <div class="info-row">
                  <dt>{{ 'OPR.DETAIL.VIOLATION_TYPE' | translate }}</dt>
                  <dd>{{ caseData()!.violation_type }}</dd>
                </div>
                @if (caseData()!.violation_date) {
                  <div class="info-row">
                    <dt>{{ 'OPR.DETAIL.VIOLATION_DATE' | translate }}</dt>
                    <dd>{{ caseData()!.violation_date | date:'mediumDate' }}</dd>
                  </div>
                }
                <div class="info-row">
                  <dt>{{ 'OPR.DETAIL.STATE' | translate }}</dt>
                  <dd>{{ caseData()!.state }}@if (caseData()!.county) {, {{ caseData()!.county }}}</dd>
                </div>
                <div class="info-row">
                  <dt>{{ 'OPR.DETAIL.FINE_AMOUNT' | translate }}</dt>
                  <dd>
                    @if (caseData()!.fine_amount != null) {
                      {{ caseData()!.fine_amount | currency:'USD':'symbol':'1.0-0' }}
                    } @else {
                      <span class="cell-dash">&mdash;</span>
                    }
                  </dd>
                </div>
              </dl>
            </mat-card-content>
          </mat-card>

          <!-- Court dates -->
          <mat-card appearance="outlined" class="detail-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>event</mat-icon>
              <mat-card-title>{{ 'OPR.DETAIL.COURT_DATES' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (caseData()!.court_dates && caseData()!.court_dates.length > 0) {
                <div class="court-timeline">
                  @for (cd of caseData()!.court_dates; track cd.id) {
                    <div class="court-entry" [class.court-past]="isPastDate(cd.date)">
                      <div class="court-dot"></div>
                      <div class="court-info">
                        <span class="court-date-text">{{ cd.date | date:'mediumDate' }}</span>
                        @if (cd.court_name) {
                          <span class="court-name">{{ cd.court_name }}</span>
                        }
                        @if (cd.location) {
                          <span class="court-location">{{ cd.location }}</span>
                        }
                        <mat-chip class="court-status-chip" [class]="'court-' + cd.status">
                          {{ cd.status }}
                        </mat-chip>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="empty-text">{{ 'OPR.DETAIL.NO_COURT_DATES' | translate }}</p>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Right column: Driver + Attorney + Status -->
        <div class="detail-column">
          <!-- Driver info -->
          <mat-card appearance="outlined" class="detail-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>person</mat-icon>
              <mat-card-title>{{ 'OPR.DETAIL.DRIVER_INFO' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (caseData()!.driver) {
                <dl class="info-list">
                  <div class="info-row">
                    <dt>{{ 'OPR.DETAIL.NAME' | translate }}</dt>
                    <dd>{{ caseData()!.driver.full_name }}</dd>
                  </div>
                  @if (caseData()!.driver.phone) {
                    <div class="info-row">
                      <dt>{{ 'OPR.DETAIL.PHONE' | translate }}</dt>
                      <dd><a [href]="'tel:' + caseData()!.driver.phone" class="contact-link">{{ caseData()!.driver.phone }}</a></dd>
                    </div>
                  }
                  @if (caseData()!.driver.email) {
                    <div class="info-row">
                      <dt>{{ 'OPR.DETAIL.EMAIL' | translate }}</dt>
                      <dd><a [href]="'mailto:' + caseData()!.driver.email" class="contact-link">{{ caseData()!.driver.email }}</a></dd>
                    </div>
                  }
                  @if (caseData()!.driver.cdl_number) {
                    <div class="info-row">
                      <dt>{{ 'OPR.DETAIL.CDL_NUMBER' | translate }}</dt>
                      <dd>{{ caseData()!.driver.cdl_number }}</dd>
                    </div>
                  }
                </dl>
                <button mat-stroked-button color="primary" (click)="messageDriver()" class="message-btn">
                  <mat-icon>chat</mat-icon>
                  {{ 'OPR.DETAIL.MESSAGE_DRIVER' | translate }}
                </button>
              } @else {
                <p class="empty-text">{{ 'OPR.DETAIL.NO_DRIVER' | translate }}</p>
              }
            </mat-card-content>
          </mat-card>

          <!-- Attorney section -->
          <mat-card appearance="outlined" class="detail-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>gavel</mat-icon>
              <mat-card-title>{{ 'OPR.DETAIL.ATTORNEY' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (caseData()!.attorney) {
                <dl class="info-list">
                  <div class="info-row">
                    <dt>{{ 'OPR.DETAIL.NAME' | translate }}</dt>
                    <dd>{{ caseData()!.attorney.full_name }}</dd>
                  </div>
                  @if (caseData()!.attorney.email) {
                    <div class="info-row">
                      <dt>{{ 'OPR.DETAIL.EMAIL' | translate }}</dt>
                      <dd><a [href]="'mailto:' + caseData()!.attorney.email" class="contact-link">{{ caseData()!.attorney.email }}</a></dd>
                    </div>
                  }
                  @if (caseData()!.attorney.specializations?.length) {
                    <div class="info-row">
                      <dt>{{ 'OPR.DETAIL.SPECIALIZATIONS' | translate }}</dt>
                      <dd>{{ caseData()!.attorney.specializations.join(', ') }}</dd>
                    </div>
                  }
                </dl>
              } @else {
                <div class="no-attorney">
                  <p class="empty-text">{{ 'OPR.DETAIL.NO_ATTORNEY' | translate }}</p>
                  <button mat-flat-button color="primary" (click)="assignAttorney()" class="assign-btn" data-cy="assign-attorney-btn">
                    <mat-icon>person_add</mat-icon>
                    {{ 'OPR.DETAIL.ASSIGN_ATTORNEY' | translate }}
                  </button>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- Status management -->
          <mat-card appearance="outlined" class="detail-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>edit_note</mat-icon>
              <mat-card-title>{{ 'OPR.DETAIL.UPDATE_STATUS' | translate }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="status-form">
                <mat-form-field appearance="outline" class="status-select">
                  <mat-label>{{ 'OPR.DETAIL.NEW_STATUS' | translate }}</mat-label>
                  <mat-select [(value)]="selectedStatus">
                    @for (s of validStatuses; track s) {
                      <mat-option [value]="s">{{ getStatusKey(s) | translate }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="note-field">
                  <mat-label>{{ 'OPR.DETAIL.NOTE' | translate }}</mat-label>
                  <textarea matInput [(ngModel)]="statusNote" rows="2"></textarea>
                </mat-form-field>
                <button mat-flat-button color="primary"
                        [disabled]="statusUpdating() || !selectedStatus"
                        (click)="updateStatus()" class="update-btn">
                  @if (statusUpdating()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    {{ 'OPR.DETAIL.UPDATE' | translate }}
                  }
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Activity log -->
      <mat-card appearance="outlined" class="detail-card activity-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>history</mat-icon>
          <mat-card-title>{{ 'OPR.DETAIL.ACTIVITY_LOG' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (activity().length > 0) {
            <div class="activity-list" role="log">
              @for (entry of activity(); track entry.id) {
                <div class="activity-entry">
                  <div class="activity-dot"></div>
                  <div class="activity-content">
                    <span class="activity-action">{{ formatAction(entry) }}</span>
                    <span class="activity-time">{{ entry.created_at | date:'medium' }}</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="empty-text">{{ 'OPR.DETAIL.NO_ACTIVITY' | translate }}</p>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    :host { display: block; padding: 16px; max-width: 1200px; margin: 0 auto; }

    .loading-container, .error-container {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 64px 16px; gap: 16px; text-align: center;
    }
    .error-container mat-icon { font-size: 48px; width: 48px; height: 48px; color: #E53935; }

    .detail-header {
      display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;
    }
    .back-btn { flex-shrink: 0; }
    .header-info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .case-number { font-size: 1.5rem; font-weight: 600; margin: 0; }
    .age-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 0.85rem; color: #666; background: #f5f5f5; border-radius: 12px; padding: 2px 10px;
    }
    .age-icon { font-size: 16px; width: 16px; height: 16px; }
    .priority-indicator {
      display: inline-block; padding: 2px 10px; border-radius: 12px;
      font-size: 0.75rem; font-weight: 600; color: #fff; text-transform: uppercase;
    }

    .status-chip { font-size: 0.8rem; }
    .status-new, .status-submitted { --mdc-chip-elevated-container-color: #E3F2FD; }
    .status-reviewed, .status-send_info_to_attorney, .status-waiting_for_driver, .status-in_progress {
      --mdc-chip-elevated-container-color: #FFF3E0;
    }
    .status-assigned_to_attorney { --mdc-chip-elevated-container-color: #E8F5E9; }
    .status-call_court { --mdc-chip-elevated-container-color: #F3E5F5; }
    .status-check_with_manager { --mdc-chip-elevated-container-color: #FCE4EC; }
    .status-pay_attorney, .status-attorney_paid { --mdc-chip-elevated-container-color: #E0F7FA; }
    .status-closed { --mdc-chip-elevated-container-color: #ECEFF1; }

    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;
    }
    .detail-column { display: flex; flex-direction: column; gap: 16px; }

    .detail-card { margin-bottom: 0; }
    .detail-card mat-card-header { margin-bottom: 8px; }

    .info-list { margin: 0; padding: 0; }
    .info-row { display: flex; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
    .info-row:last-child { border-bottom: none; }
    .info-row dt { font-weight: 500; color: #666; min-width: 120px; flex-shrink: 0; }
    .info-row dd { margin: 0; color: #222; }

    .contact-link { color: #1976D2; text-decoration: none; }
    .contact-link:hover { text-decoration: underline; }

    .cell-dash { color: #999; }
    .empty-text { color: #999; font-style: italic; margin: 8px 0; }

    /* Court timeline */
    .court-timeline { position: relative; padding-left: 20px; }
    .court-timeline::before {
      content: ''; position: absolute; left: 6px; top: 8px; bottom: 8px;
      width: 2px; background: #e0e0e0;
    }
    .court-entry { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; position: relative; }
    .court-dot {
      width: 12px; height: 12px; border-radius: 50%; background: #1976D2;
      position: absolute; left: -20px; top: 4px; z-index: 1;
    }
    .court-past .court-dot { background: #bdbdbd; }
    .court-info { display: flex; flex-direction: column; gap: 2px; }
    .court-date-text { font-weight: 500; }
    .court-name { font-size: 0.9rem; color: #444; }
    .court-location { font-size: 0.85rem; color: #888; }
    .court-status-chip { font-size: 0.7rem; transform: scale(0.85); transform-origin: left; }
    .court-scheduled { --mdc-chip-elevated-container-color: #E8F5E9; }
    .court-rescheduled { --mdc-chip-elevated-container-color: #FFF3E0; }
    .court-cancelled { --mdc-chip-elevated-container-color: #FFEBEE; }
    .court-completed { --mdc-chip-elevated-container-color: #ECEFF1; }

    /* No attorney */
    .no-attorney { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
    .assign-btn { min-height: 44px; }
    .message-btn { min-height: 44px; margin-top: 12px; }

    /* Status form */
    .status-form { display: flex; flex-direction: column; gap: 8px; }
    .status-select, .note-field { width: 100%; }
    .update-btn { min-height: 44px; align-self: flex-start; }

    /* Activity log */
    .activity-card { margin-bottom: 0; }
    .activity-list {
      max-height: 400px; overflow-y: auto; position: relative; padding-left: 20px;
    }
    .activity-list::before {
      content: ''; position: absolute; left: 6px; top: 8px; bottom: 8px;
      width: 2px; background: #e0e0e0;
    }
    .activity-entry { display: flex; align-items: flex-start; gap: 12px; padding: 8px 0; position: relative; }
    .activity-dot {
      width: 10px; height: 10px; border-radius: 50%; background: #90CAF9;
      position: absolute; left: -19px; top: 6px; z-index: 1;
    }
    .activity-content { display: flex; flex-direction: column; gap: 2px; }
    .activity-action { font-size: 0.9rem; }
    .activity-time { font-size: 0.8rem; color: #999; }

    /* Mobile layout */
    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .case-number { font-size: 1.25rem; }
      .info-row { flex-direction: column; gap: 2px; }
      .info-row dt { min-width: unset; }
    }
  `],
})
export class OperatorCaseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  caseData = signal<any>(null);
  activity = signal<any[]>([]);
  loading = signal(true);
  error = signal('');
  statusUpdating = signal(false);

  selectedStatus = '';
  statusNote = '';

  validStatuses = VALID_STATUSES;

  ngOnInit(): void {
    this.loadCase();
  }

  loadCase(): void {
    const caseId = this.route.snapshot.paramMap.get('id');
    if (!caseId) {
      this.error.set('No case ID provided');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.caseService.getOperatorCaseDetail(caseId).pipe(
      catchError(err => {
        this.error.set(err?.error?.error?.message || 'Failed to load case');
        return of(null);
      }),
    ).subscribe(result => {
      if (result) {
        this.caseData.set(result.case);
        this.activity.set(result.activity || []);
      }
      this.loading.set(false);
    });
  }

  goBack(): void {
    this.router.navigate(['/operator/dashboard']);
  }

  messageDriver(): void {
    const cd = this.caseData();
    if (!cd) return;
    this.router.navigate(['/operator/cases', cd.id, 'messages']);
  }

  assignAttorney(): void {
    const cd = this.caseData();
    if (!cd) return;
    const ref = this.dialog.open(AttorneyAssignmentComponent, {
      data: { caseId: cd.id, caseNumber: cd.case_number },
      width: '700px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((result: AttorneyAssignmentDialogResult | undefined) => {
      if (result?.assigned) this.loadCase();
    });
  }

  updateStatus(): void {
    if (!this.selectedStatus || this.statusUpdating()) return;

    const caseId = this.caseData()?.id;
    if (!caseId) return;

    this.statusUpdating.set(true);

    this.caseService.updateOperatorCaseStatus(caseId, this.selectedStatus, this.statusNote || undefined).pipe(
      finalize(() => this.statusUpdating.set(false)),
      catchError(err => {
        this.snackBar.open(
          err?.error?.error?.message || 'Failed to update status',
          'OK',
          { duration: 4000, panelClass: 'snack-error' },
        );
        return of(null);
      }),
    ).subscribe(result => {
      if (result) {
        this.snackBar.open('Status updated successfully', 'OK', { duration: 3000 });
        this.selectedStatus = '';
        this.statusNote = '';
        this.loadCase();
      }
    });
  }

  getStatusKey(status: string): string {
    return STATUS_LABELS[status] || status;
  }

  formatAge(hours: number): string {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remaining = hours % 24;
    return `${days}d ${remaining}h`;
  }

  getPriorityColor(priority: string): string {
    return PRIORITY_COLORS[priority] || '#999';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      critical: 'Critical priority',
      high: 'High priority',
      medium: 'Medium priority',
      low: 'Low priority',
    };
    return labels[priority] || priority;
  }

  isPastDate(dateStr: string): boolean {
    return new Date(dateStr).getTime() < Date.now();
  }

  formatAction(entry: any): string {
    if (entry.action === 'status_change' && entry.details) {
      return `Status changed: ${entry.details.from} → ${entry.details.to}${entry.details.note ? ' — ' + entry.details.note : ''}`;
    }
    return entry.action;
  }
}

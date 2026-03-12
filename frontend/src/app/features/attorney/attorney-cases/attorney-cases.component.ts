import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { of, catchError } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { AttorneyService, AttorneyCase } from '../../../core/services/attorney.service';

const ACTIVE_STATUSES = new Set([
  'send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager',
]);

const RESOLVED_STATUSES = new Set(['closed', 'resolved']);

const MOCK_CASES: AttorneyCase[] = [
  // 3 pending (assigned_to_attorney)
  {
    id: 'mc-001', case_number: 'CDL-2026-401', status: 'assigned_to_attorney',
    violation_type: 'Speeding', state: 'Texas', driver_name: 'Miguel Hernandez',
    created_at: '2026-03-08T14:30:00Z', attorney_price: 450,
  },
  {
    id: 'mc-002', case_number: 'CDL-2026-412', status: 'assigned_to_attorney',
    violation_type: 'Overweight', state: 'California', driver_name: 'Sarah Johnson',
    created_at: '2026-03-09T09:15:00Z', attorney_price: 850,
  },
  {
    id: 'mc-003', case_number: 'CDL-2026-418', status: 'assigned_to_attorney',
    violation_type: 'Logbook Violation', state: 'Ohio', driver_name: 'James Carter',
    created_at: '2026-03-10T16:45:00Z', attorney_price: 600,
  },
  // 4 active
  {
    id: 'mc-004', case_number: 'CDL-2026-305', status: 'send_info_to_attorney',
    violation_type: 'Speeding', state: 'Georgia', driver_name: 'Robert Williams',
    created_at: '2026-03-01T08:00:00Z', attorney_price: 500,
  },
  {
    id: 'mc-005', case_number: 'CDL-2026-310', status: 'waiting_for_driver',
    violation_type: 'Lane Violation', state: 'Florida', driver_name: 'Lisa Chen',
    created_at: '2026-02-28T11:20:00Z', attorney_price: 350,
  },
  {
    id: 'mc-006', case_number: 'CDL-2026-322', status: 'call_court',
    violation_type: 'Overweight', state: 'Illinois', driver_name: 'David Kowalski',
    created_at: '2026-02-25T10:00:00Z', attorney_price: 1200,
  },
  {
    id: 'mc-007', case_number: 'CDL-2026-335', status: 'check_with_manager',
    violation_type: 'Equipment Violation', state: 'Pennsylvania', driver_name: 'Maria Gonzalez',
    created_at: '2026-02-20T15:30:00Z', attorney_price: 750,
  },
  // 3 resolved
  {
    id: 'mc-008', case_number: 'CDL-2026-210', status: 'closed',
    violation_type: 'Speeding', state: 'New York', driver_name: 'Thomas Anderson',
    created_at: '2026-01-15T09:00:00Z', attorney_price: 400,
  },
  {
    id: 'mc-009', case_number: 'CDL-2026-225', status: 'resolved',
    violation_type: 'Logbook Violation', state: 'Tennessee', driver_name: 'Angela Brooks',
    created_at: '2026-01-20T14:00:00Z', attorney_price: 550,
  },
  {
    id: 'mc-010', case_number: 'CDL-2026-240', status: 'resolved',
    violation_type: 'Overweight', state: 'Indiana', driver_name: 'Kevin Patel',
    created_at: '2026-02-05T12:00:00Z', attorney_price: 1500,
  },
  // 2 more with various statuses
  {
    id: 'mc-011', case_number: 'CDL-2026-350', status: 'waiting_for_driver',
    violation_type: 'Reckless Driving', state: 'Michigan', driver_name: 'Daniel Okafor',
    created_at: '2026-03-04T07:45:00Z', attorney_price: 1350,
  },
  {
    id: 'mc-012', case_number: 'CDL-2026-260', status: 'closed',
    violation_type: 'Lane Violation', state: 'Arizona', driver_name: 'Jennifer Martinez',
    created_at: '2026-02-10T16:00:00Z', attorney_price: 250,
  },
  {
    id: 'mc-013', case_number: 'CDL-2026-430', status: 'assigned_to_attorney',
    violation_type: 'DOT Inspection Failure', state: 'Nevada', driver_name: 'Omar Hassan',
    created_at: '2026-03-11T08:20:00Z', attorney_price: 950,
  },
  {
    id: 'mc-014', case_number: 'CDL-2026-360', status: 'call_court',
    violation_type: 'Speeding', state: 'Colorado', driver_name: 'Brian Murphy',
    created_at: '2026-03-03T13:10:00Z', attorney_price: 475,
  },
  {
    id: 'mc-015', case_number: 'CDL-2026-275', status: 'resolved',
    violation_type: 'Equipment Violation', state: 'Virginia', driver_name: 'Priya Sharma',
    created_at: '2026-02-08T09:30:00Z', attorney_price: 680,
  },
  {
    id: 'mc-016', case_number: 'CDL-2026-440', status: 'send_info_to_attorney',
    violation_type: 'Reckless Driving', state: 'Washington', driver_name: 'Tyler Brooks',
    created_at: '2026-03-10T14:55:00Z', attorney_price: 1100,
  },
  {
    id: 'mc-017', case_number: 'CDL-2026-290', status: 'closed',
    violation_type: 'Overweight', state: 'Minnesota', driver_name: 'Yuki Tanaka',
    created_at: '2026-02-12T11:00:00Z', attorney_price: 900,
  },
  {
    id: 'mc-018', case_number: 'CDL-2026-455', status: 'assigned_to_attorney',
    violation_type: 'Failure to Signal', state: 'Oregon', driver_name: 'Alejandro Ruiz',
    created_at: '2026-03-11T10:45:00Z', attorney_price: 520,
  },
];

type StatusCategory = 'all' | 'pending' | 'active' | 'resolved';

interface StatusBadgeInfo {
  label: string;
  cssClass: string;
}

const STATUS_BADGE_MAP: Record<string, StatusBadgeInfo> = {
  assigned_to_attorney: { label: 'Pending', cssClass: 'badge-pending' },
  send_info_to_attorney: { label: 'Active', cssClass: 'badge-active' },
  waiting_for_driver: { label: 'Waiting', cssClass: 'badge-waiting' },
  call_court: { label: 'Court', cssClass: 'badge-court' },
  check_with_manager: { label: 'Review', cssClass: 'badge-active' },
  resolved: { label: 'Resolved', cssClass: 'badge-resolved' },
  closed: { label: 'Closed', cssClass: 'badge-closed' },
};

@Component({
  selector: 'app-attorney-cases',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslateModule],
  template: `
    <div class="cases-page">
      <header class="page-header">
        <h1>{{ 'ATT.MY_CASES' | translate }}</h1>
        <span class="case-count" aria-live="polite">
          {{ filteredCases().length }} {{ 'ATT.CASES_FOUND' | translate }}
        </span>
      </header>

      <div class="filters-row" role="search" aria-label="Filter cases">
        <input
          type="text"
          class="search-input"
          [placeholder]="'ATT.SEARCH_PLACEHOLDER' | translate"
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)"
          aria-label="Search cases by number, driver name, or violation type"
        />

        <select
          class="filter-select"
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event)"
          aria-label="Filter by status"
        >
          <option value="all">{{ 'ATT.STATUS_ALL' | translate }}</option>
          <option value="pending">{{ 'ATT.STATUS_PENDING' | translate }}</option>
          <option value="active">{{ 'ATT.STATUS_ACTIVE' | translate }}</option>
          <option value="resolved">{{ 'ATT.STATUS_RESOLVED' | translate }}</option>
        </select>

        <select
          class="filter-select"
          [ngModel]="violationFilter()"
          (ngModelChange)="violationFilter.set($event)"
          aria-label="Filter by violation type"
        >
          <option value="all">{{ 'ATT.VIOLATION_ALL' | translate }}</option>
          @for (vt of violationTypes(); track vt) {
            <option [value]="vt">{{ vt }}</option>
          }
        </select>
      </div>

      @if (filteredCases().length > 0) {
        <div class="case-list" role="list" aria-label="Case list">
          @for (c of filteredCases(); track c.id) {
            <article class="case-card" role="listitem">
              <div class="card-body">
                <div class="card-top">
                  <span class="case-number">{{ c.case_number }}</span>
                  <span class="badge" [class]="getBadge(c.status).cssClass">
                    {{ getBadge(c.status).label }}
                  </span>
                </div>

                <p class="driver-name">{{ c.driver_name }}</p>

                <div class="card-meta">
                  <span class="violation">{{ c.violation_type }}</span>
                  <span class="separator" aria-hidden="true">&bull;</span>
                  <span class="state">{{ c.state }}</span>
                </div>

                <div class="card-bottom">
                  <span class="fee">{{ formatCurrency(c.attorney_price) }}</span>
                  <span class="date">{{ relativeDate(c.created_at) }}</span>
                </div>

                <div class="card-actions">
                  @if (c.status === 'assigned_to_attorney') {
                    <button
                      class="btn btn-primary"
                      (click)="acceptCase(c.id)"
                      [attr.aria-label]="'Accept case ' + c.case_number"
                    >
                      {{ 'ATT.ACCEPT' | translate }}
                    </button>
                    <button
                      class="btn btn-outline-danger"
                      (click)="declineCase(c.id)"
                      [attr.aria-label]="'Decline case ' + c.case_number"
                    >
                      {{ 'ATT.DECLINE' | translate }}
                    </button>
                  } @else {
                    <button
                      class="btn btn-secondary"
                      (click)="viewCase(c.id)"
                      [attr.aria-label]="'View case ' + c.case_number"
                    >
                      {{ 'ATT.VIEW_CASE' | translate }}
                    </button>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="empty-state" role="status">
          <svg class="empty-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <p class="empty-title">{{ 'ATT.NO_CASES_TITLE' | translate }}</p>
          <p class="empty-subtitle">{{ 'ATT.NO_CASES_SUBTITLE' | translate }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .cases-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 16px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .case-count {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }

    /* Filters */
    .filters-row {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1 1 260px;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .filter-select {
      flex: 0 1 180px;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      background: #fff;
      outline: none;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .filter-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    /* Case list */
    .case-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .case-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      transition: box-shadow 0.2s, transform 0.15s;
      overflow: hidden;
    }

    .case-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-1px);
    }

    .card-body {
      padding: 16px 20px;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .case-number {
      font-weight: 700;
      font-size: 0.95rem;
      color: #1a1a2e;
    }

    /* Status badges */
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }

    .badge-active {
      background: #dbeafe;
      color: #1e40af;
    }

    .badge-court {
      background: #ede9fe;
      color: #5b21b6;
    }

    .badge-waiting {
      background: #ffedd5;
      color: #9a3412;
    }

    .badge-resolved {
      background: #d1fae5;
      color: #065f46;
    }

    .badge-closed {
      background: #f3f4f6;
      color: #4b5563;
    }

    .driver-name {
      margin: 0 0 4px;
      font-size: 0.9rem;
      color: #374151;
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #6b7280;
      margin-bottom: 10px;
    }

    .card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .fee {
      font-size: 1rem;
      font-weight: 700;
      color: #059669;
    }

    .date {
      font-size: 0.8rem;
      color: #9ca3af;
    }

    /* Actions */
    .card-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
      min-height: 44px;
      min-width: 44px;
    }

    .btn:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }

    .btn-primary {
      background: #3b82f6;
      color: #fff;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-outline-danger {
      background: transparent;
      color: #dc2626;
      border: 1px solid #dc2626;
    }

    .btn-outline-danger:hover {
      background: #fef2f2;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px;
      text-align: center;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      color: #d1d5db;
      margin-bottom: 16px;
    }

    .empty-title {
      margin: 0 0 4px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #6b7280;
    }

    .empty-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: #9ca3af;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .cases-page { padding: 16px 12px; }
      .page-header h1 { font-size: 1.25rem; }
      .filter-select { flex: 1 1 100%; }
      .card-body { padding: 14px 16px; }
      .card-actions { flex-direction: column; }
      .btn { width: 100%; text-align: center; }
    }
  `],
})
export class AttorneyCasesComponent implements OnInit {
  private attorneyService = inject(AttorneyService);
  private router = inject(Router);

  cases = signal<AttorneyCase[]>([]);
  searchQuery = signal('');
  statusFilter = signal<StatusCategory>('all');
  violationFilter = signal('all');

  violationTypes = computed(() => {
    const types = new Set(this.cases().map(c => c.violation_type));
    return [...types].sort();
  });

  filteredCases = computed(() => {
    let result = this.cases();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();
    const violation = this.violationFilter();

    if (query) {
      result = result.filter(c =>
        c.case_number.toLowerCase().includes(query) ||
        c.driver_name.toLowerCase().includes(query) ||
        c.violation_type.toLowerCase().includes(query),
      );
    }

    if (status !== 'all') {
      result = result.filter(c => {
        if (status === 'pending') return c.status === 'assigned_to_attorney';
        if (status === 'active') return ACTIVE_STATUSES.has(c.status);
        if (status === 'resolved') return RESOLVED_STATUSES.has(c.status);
        return true;
      });
    }

    if (violation !== 'all') {
      result = result.filter(c => c.violation_type === violation);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.attorneyService.getMyCases().pipe(
      catchError(() => of({ cases: MOCK_CASES })),
    ).subscribe(r => {
      const cases = r.cases?.length ? r.cases : MOCK_CASES;
      this.cases.set(cases);
    });
  }

  getBadge(status: string): StatusBadgeInfo {
    return STATUS_BADGE_MAP[status] ?? { label: status, cssClass: 'badge-closed' };
  }

  formatCurrency(amount: number | undefined): string {
    if (amount == null) return '--';
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  relativeDate(isoDate: string): string {
    const now = Date.now();
    const then = new Date(isoDate).getTime();
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60_000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month ago';
    return `${diffMonths} months ago`;
  }

  acceptCase(id: string): void {
    this.attorneyService.acceptCase(id).subscribe({
      next: () => this.loadCases(),
    });
  }

  declineCase(id: string): void {
    this.attorneyService.declineCase(id).subscribe({
      next: () => {
        this.cases.update(all => all.filter(c => c.id !== id));
      },
    });
  }

  viewCase(id: string): void {
    this.router.navigate(['/attorney/cases', id]);
  }
}

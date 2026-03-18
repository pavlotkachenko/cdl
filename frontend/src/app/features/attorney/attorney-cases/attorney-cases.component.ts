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
  loading = signal(false);
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
    this.loading.set(true);
    this.attorneyService.getMyCases().pipe(
      catchError(() => of({ cases: [] as AttorneyCase[] })),
    ).subscribe(r => {
      this.cases.set(r.cases ?? []);
      this.loading.set(false);
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

// ============================================
// Tickets List Component
// Location: frontend/src/app/features/driver/tickets/tickets.component.ts
// ============================================

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, timeout, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

// i18n
import { TranslateModule } from '@ngx-translate/core';

// Services
import { CaseService } from '../../../core/services/case.service';
import { Case } from '../../../core/models';

// Violation Type Registry
import {
  VIOLATION_TYPE_REGISTRY,
  ACTIVE_VIOLATION_TYPES,
} from '../../../core/constants/violation-type-registry';

@Component({
  selector: 'app-tickets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatMenuModule,
    TranslateModule
  ]
})
export class TicketsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private caseService = inject(CaseService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  cases: Case[] = [];
  filteredCases: Case[] = [];
  loading = true;
  error = '';

  // Filters
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  typeFilter = new FormControl('all');
  dateFromControl = new FormControl(null);
  dateToControl = new FormControl(null);
  locationControl = new FormControl('');
  citationControl = new FormControl('');

  // Table columns
  displayedColumns: string[] = ['ticketNumber', 'type', 'status', 'date', 'location', 'actions'];

  statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  typeOptions = [
    { value: 'all', label: 'All Types' },
    ...ACTIVE_VIOLATION_TYPES.map(t => ({ value: t.value, label: `${t.icon} ${t.label}` })),
  ];

  // UI State
  showTemplates = false;
  showHistory = false;
  showAdvancedFilters = false;
  selectedPresetId: string | null = null;

  filterTemplates: any[] = [];
  filterHistory: any[] = [];
  filterPresets: any[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.loadCases();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCases(): void {
    this.loading = true;
    this.error = '';

    this.caseService.getMyCases()
      .pipe(
        timeout(2000),
        catchError(() => of({ data: [] })),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          const data = response.data || response || [];
          this.cases = data.length > 0 ? data : this.getMockCases();
          this.applyFilters();
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cases = this.getMockCases();
          this.applyFilters();
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  private setupFilters(): void {
    // Search filter with debounce
    this.searchControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());

    // Status filter
    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());

    // Type filter
    this.typeFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());

    // Advanced filters
    this.dateFromControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());

    this.dateToControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());

    this.locationControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());

    this.citationControl.valueChanges
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }

  private applyFilters(): void {
    let filtered = [...this.cases];

    // Search filter
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.ticketNumber?.toLowerCase().includes(searchTerm) ||
        c.type?.toLowerCase().includes(searchTerm) ||
        c.location?.toLowerCase().includes(searchTerm) ||
        c.citationNumber?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    const status = this.statusFilter.value;
    if (status && status !== 'all') {
      filtered = filtered.filter(c => c.status === status);
    }

    // Type filter
    const type = this.typeFilter.value;
    if (type && type !== 'all') {
      filtered = filtered.filter(c => c.type === type);
    }

    // Date from filter
    const dateFrom = this.dateFromControl.value;
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      filtered = filtered.filter(c => {
        const d = c.violationDate || c.violation_date || c.createdAt || c.created_at;
        return d ? new Date(d).getTime() >= from : true;
      });
    }

    // Date to filter
    const dateTo = this.dateToControl.value;
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 86400000; // end of day
      filtered = filtered.filter(c => {
        const d = c.violationDate || c.violation_date || c.createdAt || c.created_at;
        return d ? new Date(d).getTime() <= to : true;
      });
    }

    // Location filter
    const loc = this.locationControl.value?.toLowerCase() || '';
    if (loc) {
      filtered = filtered.filter(c => c.location?.toLowerCase().includes(loc));
    }

    // Citation number filter
    const citation = this.citationControl.value?.toLowerCase() || '';
    if (citation) {
      filtered = filtered.filter(c => c.citationNumber?.toLowerCase().includes(citation));
    }

    this.filteredCases = filtered;
    this.currentPage = 1;
  }

  get advancedFiltersCount(): number {
    let count = 0;
    if (this.dateFromControl.value) count++;
    if (this.dateToControl.value) count++;
    if (this.locationControl.value) count++;
    if (this.citationControl.value) count++;
    return count;
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.statusFilter.value !== 'all') count++;
    if (this.typeFilter.value !== 'all') count++;
    if (this.searchControl.value) count++;
    count += this.advancedFiltersCount;
    return count;
  }

  viewCase(caseItem: Case): void {
    this.router.navigate(['/driver/cases', caseItem.id]);
  }

  submitNewTicket(): void {
    this.router.navigate(['/driver/submit-ticket']);
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'new': 'primary',
      'submitted': 'primary',
      'under_review': 'accent',
      'in_progress': 'accent',
      'reviewed': 'accent',
      'assigned_to_attorney': 'accent',
      'resolved': 'success',
      'closed': 'success',
      'rejected': 'warn',
      'denied': 'warn'
    };
    return colors[status] || 'primary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'new': 'New',
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'in_progress': 'In Progress',
      'reviewed': 'Reviewed',
      'assigned_to_attorney': 'With Attorney',
      'resolved': 'Resolved',
      'closed': 'Closed',
      'rejected': 'Rejected',
      'denied': 'Denied',
      'waiting_for_driver': 'Waiting for Info'
    };
    return labels[status] || status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

  formatDateTime(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilter.setValue('all');
    this.typeFilter.setValue('all');
    this.clearAdvancedFilters();
  }

  clearAdvancedFilters(): void {
    this.dateFromControl.setValue(null);
    this.dateToControl.setValue(null);
    this.locationControl.setValue('');
    this.citationControl.setValue('');
  }

  refresh(): void {
    this.loadCases();
  }

  toggleTemplates(): void { this.showTemplates = !this.showTemplates; }
  toggleHistory(): void { this.showHistory = !this.showHistory; }
  toggleAdvancedFilters(): void { this.showAdvancedFilters = !this.showAdvancedFilters; }
  
  // Auto refresh stub
  toggleAutoRefresh(): void {}
  shouldAutoRefresh(): boolean { return false; }

  shareCurrentFilters(): void {}
  exportToCSV(): void {}
  
  applyTemplate(template: any): void {}
  clearHistory(): void { this.filterHistory = []; }
  loadFromHistory(entry: any): void {}
  getFilterSummary(filters: any): string { return ''; }
  
  loadFilterPreset(preset: any): void {}
  deleteFilterPreset(preset: any, event: Event): void { event.stopPropagation(); }
  saveCurrentFiltersAsPreset(): void {}

  // ── Stats ──
  getStatusCount(status: string): number {
    const statusGroups: Record<string, string[]> = {
      'new': ['new', 'submitted'],
      'in_progress': ['in_progress', 'under_review', 'reviewed', 'assigned_to_attorney', 'waiting_for_driver'],
      'resolved': ['resolved'],
      'closed': ['closed'],
    };
    const statuses = statusGroups[status] || [status];
    return this.cases.filter(c => statuses.includes(c.status)).length;
  }

  // ── Pagination ──
  get totalPages(): number {
    return Math.ceil(this.filteredCases.length / this.pageSize) || 1;
  }

  get pagedCases(): Case[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCases.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    return this.filteredCases.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredCases.length);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    const start = Math.max(2, this.currentPage - 1);
    const end = Math.min(total - 1, this.currentPage + 1);
    if (start > 2) pages.push(-1); // ellipsis placeholder
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(-1);
    pages.push(total);
    return pages;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  // ── Labels ──
  getTypeLabel(type: string | undefined): string {
    if (!type) return 'Unknown';
    const config = VIOLATION_TYPE_REGISTRY[type];
    return config ? `${config.icon} ${config.label}` : type.charAt(0).toUpperCase() + type.slice(1);
  }

  getSeverityBadge(c: any): { label: string; cssClass: string } {
    const severity = c.violation_severity
      || VIOLATION_TYPE_REGISTRY[c.type || c.violation_type]?.severity
      || 'standard';
    const map: Record<string, { label: string; cssClass: string }> = {
      critical: { label: 'Critical', cssClass: 'severity-badge severity-critical' },
      serious: { label: 'Serious', cssClass: 'severity-badge severity-serious' },
      standard: { label: 'Standard', cssClass: 'severity-badge severity-standard' },
      minor: { label: 'Minor', cssClass: 'severity-badge severity-minor' },
    };
    return map[severity] || map['standard'];
  }

  formatRelative(date: Date | string | undefined): string {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days < 1) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return `${days} days ago`;
    return '';
  }

  private getMockCases(): Case[] {
    return [
      {
        id: 'mock-001',
        case_number: 'CDL-2024-0847',
        ticketNumber: 'CDL-2024-0847',
        citationNumber: 'CT-SPD-789456',
        customer_name: 'John Doe',
        customer_type: 'subscriber_driver',
        type: 'speeding',
        state: 'CT',
        location: 'I-95 South, Hartford, CT',
        violation_date: '2024-03-01',
        violationDate: '2024-03-01',
        violation_type: 'speeding',
        status: 'new',
        created_at: '2024-03-05T14:30:00Z',
        createdAt: '2024-03-05T14:30:00Z',
        updated_at: '2024-03-05T14:30:00Z',
      },
      {
        id: 'mock-002',
        case_number: 'CDL-2024-0715',
        ticketNumber: 'CDL-2024-0715',
        citationNumber: 'OH-CDL-654321',
        customer_name: 'Jane Smith',
        customer_type: 'one_time_driver',
        type: 'cdl_violation',
        state: 'OH',
        location: 'US-40, Columbus, OH',
        violation_date: '2024-02-18',
        violationDate: '2024-02-18',
        violation_type: 'other',
        status: 'assigned_to_attorney',
        created_at: '2024-02-20T09:15:00Z',
        createdAt: '2024-02-20T09:15:00Z',
        updated_at: '2024-02-20T09:15:00Z',
      },
      {
        id: 'mock-003',
        case_number: 'CDL-2024-0622',
        ticketNumber: 'CDL-2024-0622',
        citationNumber: 'AZ-TRF-112233',
        customer_name: 'Mike Johnson',
        customer_type: 'subscriber_carrier',
        type: 'traffic',
        state: 'AZ',
        location: 'I-10 West, Phoenix, AZ',
        violation_date: '2024-02-08',
        violationDate: '2024-02-08',
        violation_type: 'traffic_signal',
        status: 'reviewed',
        created_at: '2024-02-10T16:45:00Z',
        createdAt: '2024-02-10T16:45:00Z',
        updated_at: '2024-02-10T16:45:00Z',
      },
      {
        id: 'mock-004',
        case_number: 'CDL-2024-0503',
        ticketNumber: 'CDL-2024-0503',
        citationNumber: 'GA-SPD-445566',
        customer_name: 'Sarah Williams',
        customer_type: 'subscriber_driver',
        type: 'speeding',
        state: 'GA',
        location: 'I-75 North, Atlanta, GA',
        violation_date: '2024-01-12',
        violationDate: '2024-01-12',
        violation_type: 'speeding',
        status: 'closed',
        created_at: '2024-01-15T11:00:00Z',
        createdAt: '2024-01-15T11:00:00Z',
        updated_at: '2024-01-15T11:00:00Z',
      },
      {
        id: 'mock-005',
        case_number: 'CDL-2024-0399',
        ticketNumber: 'CDL-2024-0399',
        citationNumber: 'IN-WGT-998877',
        customer_name: 'Carlos Rivera',
        customer_type: 'one_time_carrier',
        type: 'weight_station',
        state: 'IN',
        location: 'US-20, Gary, IN',
        violation_date: '2024-03-07',
        violationDate: '2024-03-07',
        violation_type: 'other',
        status: 'new',
        created_at: '2024-03-08T08:20:00Z',
        createdAt: '2024-03-08T08:20:00Z',
        updated_at: '2024-03-08T08:20:00Z',
      },
      {
        id: 'mock-006',
        case_number: 'CDL-2024-0288',
        ticketNumber: 'CDL-2024-0288',
        citationNumber: 'IL-PRK-776655',
        customer_name: 'Tom Bradley',
        customer_type: 'subscriber_driver',
        type: 'parking',
        state: 'IL',
        location: 'Downtown, Chicago, IL',
        violation_date: '2024-02-27',
        violationDate: '2024-02-27',
        violation_type: 'parking',
        status: 'waiting_for_driver',
        created_at: '2024-02-28T13:30:00Z',
        createdAt: '2024-02-28T13:30:00Z',
        updated_at: '2024-02-28T13:30:00Z',
      },
      {
        id: 'mock-007',
        case_number: 'CDL-2024-0177',
        ticketNumber: 'CDL-2024-0177',
        citationNumber: 'TX-TRF-334455',
        customer_name: 'David Kim',
        customer_type: 'subscriber_driver',
        type: 'traffic',
        state: 'TX',
        location: 'I-35 North, Dallas, TX',
        violation_date: '2024-01-05',
        violationDate: '2024-01-05',
        violation_type: 'traffic_signal',
        status: 'resolved',
        created_at: '2024-01-05T10:00:00Z',
        createdAt: '2024-01-05T10:00:00Z',
        updated_at: '2024-01-20T14:00:00Z',
      },
      {
        id: 'mock-008',
        case_number: 'CDL-2024-0066',
        ticketNumber: 'CDL-2024-0066',
        citationNumber: 'FL-ACC-887766',
        customer_name: 'Emily Davis',
        customer_type: 'one_time_driver',
        type: 'accident',
        state: 'FL',
        location: 'I-4 East, Orlando, FL',
        violation_date: '2023-12-20',
        violationDate: '2023-12-20',
        violation_type: 'other',
        status: 'rejected',
        created_at: '2023-12-20T15:45:00Z',
        createdAt: '2023-12-20T15:45:00Z',
        updated_at: '2024-01-02T09:00:00Z',
      },
      {
        id: 'mock-009',
        case_number: 'CDL-2024-0955',
        ticketNumber: 'CDL-2024-0955',
        citationNumber: 'CA-SPD-221100',
        customer_name: 'Robert Chen',
        customer_type: 'subscriber_driver',
        type: 'speeding',
        state: 'CA',
        location: 'I-5 South, Los Angeles, CA',
        violation_date: '2024-03-10',
        violationDate: '2024-03-10',
        violation_type: 'speeding',
        status: 'in_progress',
        created_at: '2024-03-10T07:30:00Z',
        createdAt: '2024-03-10T07:30:00Z',
        updated_at: '2024-03-10T07:30:00Z',
      },
    ] as Case[];
  }
}

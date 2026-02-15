// ============================================
// Tickets List Component
// Location: frontend/src/app/features/driver/tickets/tickets.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';

// Services
import { CaseService } from '../../../core/services/case.service';
import { Case } from '../../../core/models';

@Component({
  selector: 'app-tickets',
  standalone: true,
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
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatMenuModule
  ]
})
export class TicketsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

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
    { value: 'speeding', label: 'Speeding' },
    { value: 'cdl_violation', label: 'CDL Violation' },
    { value: 'traffic', label: 'Traffic' },
    { value: 'accident', label: 'Accident' },
    { value: 'parking', label: 'Parking' },
    { value: 'weight_station', label: 'Weight Station' },
    { value: 'other', label: 'Other' }
  ];

  // UI State
  showTemplates = false;
  showHistory = false;
  showAdvancedFilters = false;
  selectedPresetId: string | null = null;
  
  filterTemplates: any[] = [];
  filterHistory: any[] = [];
  filterPresets: any[] = [];

  constructor(
    private caseService: CaseService,
    private router: Router
  ) {}

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
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.cases = response.data || response || [];
          this.applyFilters();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load tickets. Please try again.';
          this.loading = false;
          console.error('Error loading tickets:', err);
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

    this.filteredCases = filtered;
  }

  get activeFiltersCount(): number {
    let count = 0;
    if (this.statusFilter.value !== 'all') count++;
    if (this.typeFilter.value !== 'all') count++;
    if (this.searchControl.value) count++;
    if (this.dateFromControl.value) count++;
    if (this.dateToControl.value) count++;
    if (this.locationControl.value) count++;
    if (this.citationControl.value) count++;
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
}

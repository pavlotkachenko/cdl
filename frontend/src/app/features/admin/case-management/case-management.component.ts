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

import { AdminService, Case, StaffMember } from '../../../core/services/admin.service';

type StatusFilter = Case['status'] | 'all';
type PriorityFilter = Case['priority'] | 'all';

const STATUS_LABELS: Record<Case['status'], string> = {
  new: 'New', assigned: 'Assigned', in_progress: 'In Progress',
  pending_court: 'Pending Court', resolved: 'Resolved', closed: 'Closed',
};

const PRIORITY_LABELS: Record<Case['priority'], string> = {
  low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent',
};

@Component({
  selector: 'app-case-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="case-mgmt">
      <div class="page-header">
        <h1>Case Management</h1>
        <button mat-raised-button color="primary" (click)="openNewCase()">
          <mat-icon>add</mat-icon> New Case
        </button>
      </div>

      <div class="filter-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search cases</mat-label>
          <input matInput
                 [value]="searchTerm()"
                 (input)="searchTerm.set($any($event.target).value)"
                 aria-label="Search cases" />
          <mat-icon matSuffix aria-hidden="true">search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value)">
            @for (s of statuses; track s.value) {
              <mat-option [value]="s.value">{{ s.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Priority</mat-label>
          <mat-select [value]="priorityFilter()" (selectionChange)="priorityFilter.set($event.value)">
            @for (p of priorities; track p.value) {
              <mat-option [value]="p.value">{{ p.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (searchTerm() || statusFilter() !== 'all' || priorityFilter() !== 'all') {
          <button mat-button (click)="clearFilters()">Clear</button>
        }
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (filteredCases().length === 0) {
        <p class="empty" role="status">No cases match the current filters.</p>
      } @else {
        <p class="result-count" role="status">{{ filteredCases().length }} case(s)</p>
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
                  <span [class]="'badge status-' + c.status">{{ getStatusLabel(c.status) }}</span>
                  <span [class]="'badge priority-' + c.priority">{{ getPriorityLabel(c.priority) }}</span>
                </div>
              </div>
              @if (c.assignedToName) {
                <p class="assigned">Assigned to: {{ c.assignedToName }}</p>
              }
              <div class="case-actions">
                <button mat-button (click)="viewCase(c)">
                  <mat-icon>visibility</mat-icon> View
                </button>
                @for (s of quickStatuses; track s.value) {
                  @if (c.status !== s.value) {
                    <button mat-button (click)="updateStatus(c, s.value)">
                      {{ s.label }}
                    </button>
                  }
                }
              </div>
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
    .loading { display: flex; justify-content: center; padding: 48px; }
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
    .assigned { font-size: 0.8rem; color: #666; margin: 6px 0 0; }
    .case-actions { display: flex; gap: 4px; margin-top: 8px; flex-wrap: wrap; }
  `],
})
export class CaseManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  cases = signal<Case[]>([]);
  staff = signal<StaffMember[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  statusFilter = signal<StatusFilter>('all');
  priorityFilter = signal<PriorityFilter>('all');

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

  readonly statuses: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending_court', label: 'Pending Court' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  readonly priorities: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  readonly quickStatuses: { value: Case['status']; label: string }[] = [
    { value: 'assigned', label: 'Mark Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolve' },
    { value: 'closed', label: 'Close' },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.adminService.getAllCases().subscribe({
      next: (cases) => { this.cases.set(cases); this.loading.set(false); },
      error: () => this.loading.set(false),
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

  viewCase(c: Case): void {
    this.router.navigate(['/admin/cases', c.id]);
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

  getStatusLabel(status: Case['status']): string {
    return STATUS_LABELS[status] ?? status;
  }

  getPriorityLabel(priority: Case['priority']): string {
    return PRIORITY_LABELS[priority] ?? priority;
  }
}

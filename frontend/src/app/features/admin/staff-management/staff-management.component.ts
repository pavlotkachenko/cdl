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

import { AdminService, StaffMember } from '../../../core/services/admin.service';

type RoleFilter = StaffMember['role'] | 'all';
type StatusFilter = StaffMember['status'] | 'all';

const ROLE_LABELS: Record<StaffMember['role'], string> = {
  admin: 'Admin', attorney: 'Attorney', paralegal: 'Paralegal',
};

const STATUS_LABELS: Record<StaffMember['status'], string> = {
  active: 'Active', inactive: 'Inactive', on_leave: 'On Leave',
};

@Component({
  selector: 'app-staff-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatProgressSpinnerModule, MatDividerModule,
  ],
  template: `
    <div class="staff-mgmt">
      <div class="page-header">
        <h1>Staff Management</h1>
        <button mat-raised-button color="primary" (click)="addNewStaff()">
          <mat-icon>person_add</mat-icon> Add Staff
        </button>
      </div>

      <div class="filter-row">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search staff</mat-label>
          <input matInput
                 [value]="searchTerm()"
                 (input)="searchTerm.set($any($event.target).value)"
                 aria-label="Search staff" />
          <mat-icon matSuffix aria-hidden="true">search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select [value]="roleFilter()" (selectionChange)="roleFilter.set($event.value)">
            @for (r of roles; track r.value) {
              <mat-option [value]="r.value">{{ r.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [value]="statusFilter()" (selectionChange)="statusFilter.set($event.value)">
            @for (s of statuses; track s.value) {
              <mat-option [value]="s.value">{{ s.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (searchTerm() || roleFilter() !== 'all' || statusFilter() !== 'all') {
          <button mat-button (click)="clearFilters()">Clear</button>
        }
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (filteredStaff().length === 0) {
        <p class="empty" role="status">No staff members found.</p>
      } @else {
        <p class="result-count" role="status">{{ filteredStaff().length }} member(s)</p>
        @for (m of filteredStaff(); track m.id) {
          <mat-card class="staff-card">
            <mat-card-content>
              <div class="staff-header">
                <div class="avatar" [attr.aria-label]="m.name">{{ getInitials(m.name) }}</div>
                <div class="staff-info">
                  <p class="staff-name">{{ m.name }}</p>
                  <p class="staff-email">{{ m.email }}</p>
                  <p class="staff-stats">
                    {{ m.activeCases }} active · {{ m.successRate.toFixed(0) }}% success
                  </p>
                </div>
                <div class="staff-badges">
                  <span [class]="'badge role-' + m.role">{{ getRoleLabel(m.role) }}</span>
                  <span [class]="'badge status-' + m.status">{{ getStatusLabel(m.status) }}</span>
                </div>
              </div>
              <mat-divider></mat-divider>
              <div class="staff-actions">
                <button mat-button (click)="viewPerformance(m)">
                  <mat-icon>bar_chart</mat-icon> Performance
                </button>
                @if (m.status !== 'active') {
                  <button mat-button (click)="updateStatus(m, 'active')">Activate</button>
                }
                @if (m.status === 'active') {
                  <button mat-button (click)="updateStatus(m, 'inactive')">Deactivate</button>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .staff-mgmt { max-width: 860px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }
    .filter-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 16px; }
    .search-field { flex: 1; min-width: 200px; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .empty, .result-count { color: #999; font-size: 0.85rem; margin: 8px 0; }
    .result-count { color: #555; }
    .staff-card { margin-bottom: 10px; }
    .staff-header { display: flex; align-items: flex-start; gap: 12px; padding-bottom: 10px; }
    .avatar { width: 44px; height: 44px; border-radius: 50%; background: #1976d2; color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
    .staff-info { flex: 1; }
    .staff-name { margin: 0; font-weight: 700; font-size: 0.95rem; }
    .staff-email { margin: 2px 0 0; font-size: 0.82rem; color: #666; }
    .staff-stats { margin: 4px 0 0; font-size: 0.78rem; color: #888; }
    .staff-badges { display: flex; gap: 6px; flex-direction: column; align-items: flex-end; }
    .badge { font-size: 0.7rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
    .role-admin { background: #fce4ec; color: #880e4f; }
    .role-attorney { background: #e3f2fd; color: #1565c0; }
    .role-paralegal { background: #e8f5e9; color: #2e7d32; }
    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-inactive { background: #f5f5f5; color: #616161; }
    .status-on_leave { background: #fff3e0; color: #e65100; }
    .staff-actions { display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap; }
  `],
})
export class StaffManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  staff = signal<StaffMember[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  roleFilter = signal<RoleFilter>('all');
  statusFilter = signal<StatusFilter>('all');

  filteredStaff = computed(() => {
    let list = this.staff();
    const term = this.searchTerm().toLowerCase();
    if (term) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term),
      );
    }
    const role = this.roleFilter();
    if (role !== 'all') list = list.filter(s => s.role === role);
    const status = this.statusFilter();
    if (status !== 'all') list = list.filter(s => s.status === status);
    return list;
  });

  readonly roles: { value: RoleFilter; label: string }[] = [
    { value: 'all', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'attorney', label: 'Attorney' },
    { value: 'paralegal', label: 'Paralegal' },
  ];

  readonly statuses: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on_leave', label: 'On Leave' },
  ];

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.loading.set(true);
    this.adminService.getAllStaff().subscribe({
      next: (staff) => { this.staff.set(staff); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load staff.', 'Close', { duration: 3000 });
      },
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.roleFilter.set('all');
    this.statusFilter.set('all');
  }

  viewPerformance(m: StaffMember): void {
    this.router.navigate(['/admin/reports'], { queryParams: { staffId: m.id } });
  }

  updateStatus(m: StaffMember, status: StaffMember['status']): void {
    this.adminService.updateStaffMember(m.id, { status }).subscribe({
      next: () => {
        this.snackBar.open('Status updated.', 'Close', { duration: 3000 });
        this.loadStaff();
      },
      error: () => this.snackBar.open('Failed to update status.', 'Close', { duration: 3000 }),
    });
  }

  addNewStaff(): void {
    this.snackBar.open('Add staff feature coming soon.', 'Close', { duration: 3000 });
  }

  getRoleLabel(role: StaffMember['role']): string {
    return ROLE_LABELS[role] ?? role;
  }

  getStatusLabel(status: StaffMember['status']): string {
    return STATUS_LABELS[status] ?? status;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}

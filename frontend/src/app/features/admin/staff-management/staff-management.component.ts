// ============================================
// Staff Management Component
// Location: frontend/src/app/features/admin/staff-management/staff-management.component.ts
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Services
import { AdminService, StaffMember } from '../../../core/services/admin.service';

@Component({
  selector: 'app-staff-management',
  standalone: true,
  templateUrl: './staff-management.component.html',
  styleUrls: ['./staff-management.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressBarModule
  ]
})
export class StaffManagementComponent implements OnInit {
  staff: StaffMember[] = [];
  filteredStaff: StaffMember[] = [];
  loading = false;

  // Filters
  searchTerm = '';
  roleFilter: 'all' | 'admin' | 'attorney' | 'paralegal' = 'all';
  statusFilter: 'all' | 'active' | 'inactive' | 'on_leave' = 'all';

  // Table columns
  displayedColumns = ['avatar', 'name', 'role', 'specialization', 'activeCases', 'performance', 'status', 'actions'];

  constructor(
    private adminService: AdminService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.loading = true;

    this.adminService.getAllStaff().subscribe({
      next: (staff) => {
        this.staff = staff;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading staff:', err);
        this.loading = false;
        this.snackBar.open('Failed to load staff', 'Close', { duration: 5000 });
      }
    });
  }

  // ============================================
  // Filtering
  // ============================================

  applyFilters(): void {
    let filtered = [...this.staff];

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (this.roleFilter !== 'all') {
      filtered = filtered.filter(s => s.role === this.roleFilter);
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === this.statusFilter);
    }

    this.filteredStaff = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.roleFilter = 'all';
    this.statusFilter = 'all';
    this.applyFilters();
  }

  // ============================================
  // Actions
  // ============================================

  viewStaff(member: StaffMember): void {
    this.router.navigate(['/admin/staff', member.id]);
  }

  editStaff(member: StaffMember): void {
    // Open edit dialog
    this.snackBar.open('Edit staff feature coming soon', 'Close', { duration: 3000 });
  }

  viewPerformance(member: StaffMember): void {
    this.router.navigate(['/admin/reports'], { queryParams: { staffId: member.id } });
  }

  updateStatus(member: StaffMember, status: StaffMember['status']): void {
    this.adminService.updateStaffMember(member.id, { status }).subscribe({
      next: () => {
        this.snackBar.open('Status updated', 'Close', { duration: 3000 });
        this.loadStaff();
      },
      error: (err) => {
        console.error('Status update error:', err);
        this.snackBar.open('Failed to update status', 'Close', { duration: 5000 });
      }
    });
  }

  deleteStaff(member: StaffMember): void {
    if (confirm(`Are you sure you want to delete ${member.name}?`)) {
      this.adminService.deleteStaffMember(member.id).subscribe({
        next: () => {
          this.snackBar.open('Staff member deleted', 'Close', { duration: 3000 });
          this.loadStaff();
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.snackBar.open('Failed to delete staff member', 'Close', { duration: 5000 });
        }
      });
    }
  }

  addNewStaff(): void {
    // Open add staff dialog
    this.snackBar.open('Add staff feature coming soon', 'Close', { duration: 3000 });
  }

  // ============================================
  // Helpers
  // ============================================

  getRoleColor(role: StaffMember['role']): string {
    const colors: Record<StaffMember['role'], string> = {
      admin: 'warn',
      attorney: 'primary',
      paralegal: 'accent'
    };
    return colors[role] || '';
  }

  getRoleLabel(role: StaffMember['role']): string {
    const labels: Record<StaffMember['role'], string> = {
      admin: 'Admin',
      attorney: 'Attorney',
      paralegal: 'Paralegal'
    };
    return labels[role] || role;
  }

  getStatusColor(status: StaffMember['status']): string {
    const colors: Record<StaffMember['status'], string> = {
      active: 'accent',
      inactive: '',
      on_leave: 'warn'
    };
    return colors[status] || '';
  }

  getStatusLabel(status: StaffMember['status']): string {
    const labels: Record<StaffMember['status'], string> = {
      active: 'Active',
      inactive: 'Inactive',
      on_leave: 'On Leave'
    };
    return labels[status] || status;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getPerformanceColor(successRate: number): string {
    if (successRate >= 90) return 'accent';
    if (successRate >= 80) return 'primary';
    return 'warn';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

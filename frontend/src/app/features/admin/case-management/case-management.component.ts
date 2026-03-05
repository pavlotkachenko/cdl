// ============================================
// Case Management Component (FIXED - with RouterModule)
// Location: frontend/src/app/features/admin/case-management/case-management.component.ts
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SelectionModel } from '@angular/cdk/collections';

// Services
import { AdminService, Case, StaffMember } from '../../../core/services/admin.service';

@Component({
  selector: 'app-case-management',
  standalone: true,
  templateUrl: './case-management.component.html',
  styleUrls: ['./case-management.component.scss'],
  imports: [
    CommonModule,
    RouterModule,  // ← ADDED RouterModule for [routerLink]
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class CaseManagementComponent implements OnInit {
  cases: Case[] = [];
  filteredCases: Case[] = [];
  staffMembers: StaffMember[] = [];
  loading = false;

  // Selection
  selection = new SelectionModel<Case>(true, []);

  // Filters
  searchTerm = '';
  statusFilter: Case['status'] | 'all' = 'all';
  priorityFilter: Case['priority'] | 'all' = 'all';
  assignedFilter: string | 'all' = 'all';

  // Table columns
  displayedColumns = ['select', 'caseNumber', 'client', 'type', 'status', 'priority', 'assigned', 'courtDate', 'actions'];

  // Status options
  statuses: { value: Case['status'] | 'all'; label: string }[] = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'pending_court', label: 'Pending Court' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' }
  ];

  // Priority options
  priorities: { value: Case['priority'] | 'all'; label: string }[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  constructor(
    private adminService: AdminService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Load cases
    this.adminService.getAllCases().subscribe({
      next: (cases) => {
        this.cases = cases;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading cases:', err);
        this.loading = false;
      }
    });

    // Load staff for assignment
    this.adminService.getAllStaff().subscribe({
      next: (staff) => {
        this.staffMembers = staff.filter(s => s.role === 'attorney');
      },
      error: (err) => console.error('Error loading staff:', err)
    });
  }

  // ============================================
  // Filtering
  // ============================================

  applyFilters(): void {
    let filtered = [...this.cases];

    // Search
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.caseNumber.toLowerCase().includes(term) ||
        c.clientName.toLowerCase().includes(term) ||
        c.clientEmail.toLowerCase().includes(term) ||
        c.violationType.toLowerCase().includes(term)
      );
    }

    // Status
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }

    // Priority
    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(c => c.priority === this.priorityFilter);
    }

    // Assigned
    if (this.assignedFilter !== 'all') {
      if (this.assignedFilter === 'unassigned') {
        filtered = filtered.filter(c => !c.assignedTo);
      } else {
        filtered = filtered.filter(c => c.assignedTo === this.assignedFilter);
      }
    }

    this.filteredCases = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.priorityFilter = 'all';
    this.assignedFilter = 'all';
    this.applyFilters();
  }

  // ============================================
  // Selection
  // ============================================

  isAllSelected(): boolean {
    return this.selection.selected.length === this.filteredCases.length;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.filteredCases.forEach(row => this.selection.select(row));
    }
  }

  // ============================================
  // Bulk Operations
  // ============================================

  bulkAssign(staffId: string): void {
    const caseIds = this.selection.selected.map(c => c.id);
    
    this.adminService.bulkAssignCases(caseIds, staffId).subscribe({
      next: () => {
        this.snackBar.open(`Assigned ${caseIds.length} case(s)`, 'Close', { duration: 3000 });
        this.selection.clear();
        this.loadData();
      },
      error: (err) => {
        console.error('Bulk assign error:', err);
        this.snackBar.open('Failed to assign cases', 'Close', { duration: 5000 });
      }
    });
  }

  bulkUpdateStatus(status: Case['status']): void {
    const caseIds = this.selection.selected.map(c => c.id);
    
    this.adminService.bulkUpdateStatus(caseIds, status).subscribe({
      next: () => {
        this.snackBar.open(`Updated ${caseIds.length} case(s)`, 'Close', { duration: 3000 });
        this.selection.clear();
        this.loadData();
      },
      error: (err) => {
        console.error('Bulk update error:', err);
        this.snackBar.open('Failed to update cases', 'Close', { duration: 5000 });
      }
    });
  }

  bulkUpdatePriority(priority: Case['priority']): void {
    const caseIds = this.selection.selected.map(c => c.id);
    
    this.adminService.bulkUpdatePriority(caseIds, priority).subscribe({
      next: () => {
        this.snackBar.open(`Updated ${caseIds.length} case(s)`, 'Close', { duration: 3000 });
        this.selection.clear();
        this.loadData();
      },
      error: (err) => {
        console.error('Bulk priority update error:', err);
        this.snackBar.open('Failed to update priorities', 'Close', { duration: 5000 });
      }
    });
  }

  exportSelected(format: 'csv' | 'pdf' | 'xlsx'): void {
    const caseIds = this.selection.selected.map(c => c.id);
    
    this.adminService.exportCases(caseIds, format).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cases-export.${format}`;
        link.click();
        
        this.snackBar.open(`Exported ${caseIds.length} case(s)`, 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Export error:', err);
        this.snackBar.open('Failed to export cases', 'Close', { duration: 5000 });
      }
    });
  }

  // ============================================
  // Individual Actions
  // ============================================

  viewCase(caseItem: Case): void {
    this.router.navigate(['/admin/cases', caseItem.id]);
  }

  openNewCase(): void {
    this.snackBar.open('Case creation coming soon', 'Close', { duration: 3000 });
  }

  assignCase(caseItem: Case, staffId: string): void {
    this.adminService.assignCase(caseItem.id, staffId).subscribe({
      next: () => {
        this.snackBar.open('Case assigned successfully', 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        console.error('Assign error:', err);
        this.snackBar.open('Failed to assign case', 'Close', { duration: 5000 });
      }
    });
  }

  updateStatus(caseItem: Case, status: Case['status']): void {
    this.adminService.updateCaseStatus(caseItem.id, status).subscribe({
      next: () => {
        this.snackBar.open('Status updated', 'Close', { duration: 3000 });
        this.loadData();
      },
      error: (err) => {
        console.error('Status update error:', err);
        this.snackBar.open('Failed to update status', 'Close', { duration: 5000 });
      }
    });
  }

  // ============================================
  // Helpers
  // ============================================

  getStatusColor(status: Case['status']): string {
    const colors: Record<Case['status'], string> = {
      new: 'accent',
      assigned: 'primary',
      in_progress: 'primary',
      pending_court: 'warn',
      resolved: 'accent',
      closed: ''
    };
    return colors[status] || '';
  }

  getStatusLabel(status: Case['status']): string {
    const labels: Record<Case['status'], string> = {
      new: 'New',
      assigned: 'Assigned',
      in_progress: 'In Progress',
      pending_court: 'Pending Court',
      resolved: 'Resolved',
      closed: 'Closed'
    };
    return labels[status] || status;
  }

  getPriorityColor(priority: Case['priority']): string {
    const colors: Record<Case['priority'], string> = {
      low: 'primary',
      medium: 'accent',
      high: 'warn',
      urgent: 'warn'
    };
    return colors[priority] || '';
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

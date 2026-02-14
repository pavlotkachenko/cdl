// ============================================
// Reports Component
// Location: frontend/src/app/features/admin/reports/reports.component.ts
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

// Services
import { AdminService, PerformanceMetrics, StaffMember } from '../../../core/services/admin.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatTabsModule,
    MatTableModule,
    MatProgressBarModule,
    MatChipsModule
  ]
})
export class ReportsComponent implements OnInit {
  loading = false;
  
  // Performance metrics
  performanceMetrics: PerformanceMetrics[] = [];
  
  // Staff list for filtering
  staffMembers: StaffMember[] = [];
  
  // Filters
  selectedStaff: string = 'all';
  startDate: Date | null = null;
  endDate: Date | null = null;
  reportType: 'overview' | 'staff' | 'cases' | 'financial' = 'overview';

  // Table columns
  displayedColumns = ['staffName', 'totalCases', 'resolvedCases', 'successRate', 'avgResolutionTime', 'satisfaction'];

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for staffId in query params
    this.route.queryParams.subscribe(params => {
      if (params['staffId']) {
        this.selectedStaff = params['staffId'];
      }
    });

    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Load performance metrics
    const staffId = this.selectedStaff === 'all' ? undefined : this.selectedStaff;
    
    this.adminService.getStaffPerformance(staffId).subscribe({
      next: (metrics) => {
        this.performanceMetrics = metrics;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading performance:', err);
        this.loading = false;
      }
    });

    // Load staff list
    this.adminService.getAllStaff().subscribe({
      next: (staff) => {
        this.staffMembers = staff;
      },
      error: (err) => console.error('Error loading staff:', err)
    });
  }

  // ============================================
  // Filters
  // ============================================

  applyFilters(): void {
    this.loadData();
  }

  exportReport(): void {
    // Export functionality
    console.log('Exporting report...');
  }

  printReport(): void {
    window.print();
  }

  // ============================================
  // Helpers
  // ============================================

  getSuccessRateColor(rate: number): string {
    if (rate >= 90) return 'accent';
    if (rate >= 80) return 'primary';
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

/**
 * Operator Dashboard Component - Workload overview and case management
 * Location: frontend/src/app/features/admin/operator-dashboard/operator-dashboard.component.ts
 */

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration } from 'chart.js/auto';

import { DashboardService, WorkloadStats, CaseQueueItem, SuggestedAttorney } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-operator-dashboard',
  standalone: true,
  templateUrl: './operator-dashboard.component.html',
  styleUrls: ['./operator-dashboard.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ]
})
export class OperatorDashboardComponent implements OnInit, OnDestroy {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Workload stats
  workloadStats: WorkloadStats | null = null;
  
  // Case queue table
  displayedColumns: string[] = [
    'select',
    'caseId',
    'driverName',
    'violationType',
    'violationDate',
    'violationState',
    'priority',
    'status',
    'createdAt',
    'actions'
  ];
  dataSource = new MatTableDataSource<CaseQueueItem>([]);
  selection = new SelectionModel<CaseQueueItem>(true, []);
  
  // Filters
  filterStatus = '';
  filterPriority = '';
  filterState = '';
  searchText = '';
  
  // Charts
  private statusChart: Chart | null = null;
  private violationChart: Chart | null = null;
  private workloadChart: Chart | null = null;
  
  // Loading states
  loading = false;
  bulkAssigning = false;
  
  // Suggested attorneys cache
  suggestedAttorneysCache: Map<string, SuggestedAttorney[]> = new Map();
  
  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.initializeCharts();
    
    // Subscribe to real-time updates
    this.dashboardService.workload$
      .pipe(takeUntil(this.destroy$))
      .subscribe(stats => {
        this.workloadStats = stats;
        this.updateCharts();
      });
    
    this.dashboardService.queue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cases => {
        this.dataSource.data = cases;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Cleanup charts
    if (this.statusChart) this.statusChart.destroy();
    if (this.violationChart) this.violationChart.destroy();
    if (this.workloadChart) this.workloadChart.destroy();
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.loading = true;
    const currentUser = this.authService.currentUserValue;
    
    this.dashboardService.getWorkloadStats(currentUser?.id).subscribe({
      next: (stats) => {
        this.workloadStats = stats;
        this.updateCharts();
      },
      error: (error) => {
        console.error('Error loading workload stats:', error);
      }
    });
    
    this.dashboardService.getCaseQueue({
      status: 'new',
      limit: 100
    }).subscribe({
      next: (response) => {
        this.dataSource.data = response.cases;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading case queue:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Initialize Chart.js charts
   */
  initializeCharts(): void {
    // Status Distribution Chart
    const statusCtx = document.getElementById('statusChart') as HTMLCanvasElement;
    if (statusCtx) {
      this.statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['New', 'Assigned', 'In Progress', 'Resolved'],
          datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: [
              '#4CAF50',
              '#2196F3',
              '#FF9800',
              '#9C27B0'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            title: {
              display: true,
              text: 'Case Status Distribution'
            }
          }
        }
      });
    }

    // Violation Type Chart
    const violationCtx = document.getElementById('violationChart') as HTMLCanvasElement;
    if (violationCtx) {
      this.violationChart = new Chart(violationCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Violations by Type',
            data: [],
            backgroundColor: '#3f51b5'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Violation Type Distribution'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    }

    // Attorney Workload Chart
    const workloadCtx = document.getElementById('workloadChart') as HTMLCanvasElement;
    if (workloadCtx) {
      this.workloadChart = new Chart(workloadCtx, {
        type: 'bar',
        data: {
          labels: [],
          datasets: [{
            label: 'Active Cases',
            data: [],
            backgroundColor: '#009688'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Attorney Workload'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    }
  }

  /**
   * Update charts with fresh data
   */
  updateCharts(): void {
    if (!this.workloadStats) return;

    // Update status chart
    if (this.statusChart) {
      this.statusChart.data.datasets[0].data = [
        this.workloadStats.newCases,
        this.workloadStats.assignedCases,
        this.workloadStats.inProgressCases,
        this.workloadStats.resolvedCases
      ];
      this.statusChart.update();
    }

    // Fetch and update violation distribution
    this.dashboardService.getViolationTypeDistribution(30).subscribe({
      next: (data) => {
        if (this.violationChart && data) {
          this.violationChart.data.labels = data.labels;
          this.violationChart.data.datasets[0].data = data.values;
          this.violationChart.update();
        }
      }
    });

    // Fetch and update attorney workload
    this.dashboardService.getAttorneyWorkloadDistribution().subscribe({
      next: (data) => {
        if (this.workloadChart && data) {
          this.workloadChart.data.labels = data.map((a: any) => a.name);
          this.workloadChart.data.datasets[0].data = data.map((a: any) => a.caseCount);
          this.workloadChart.update();
        }
      }
    });
  }

  /**
   * Apply filters to case queue
   */
  applyFilters(): void {
    this.loading = true;
    this.dashboardService.getCaseQueue({
      status: this.filterStatus || undefined,
      priority: this.filterPriority || undefined,
      state: this.filterState || undefined,
      search: this.searchText || undefined,
      limit: 100
    }).subscribe({
      next: (response) => {
        this.dataSource.data = response.cases;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error applying filters:', error);
        this.loading = false;
      }
    });
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterStatus = '';
    this.filterPriority = '';
    this.filterState = '';
    this.searchText = '';
    this.applyFilters();
  }

  /**
   * Get suggested attorneys for a case
   */
  async getSuggestedAttorneys(caseId: string): Promise<SuggestedAttorney[]> {
    // Check cache first
    if (this.suggestedAttorneysCache.has(caseId)) {
      return this.suggestedAttorneysCache.get(caseId)!;
    }

    return new Promise((resolve, reject) => {
      this.dashboardService.getSuggestedAttorneys(caseId).subscribe({
        next: (attorneys) => {
          this.suggestedAttorneysCache.set(caseId, attorneys);
          resolve(attorneys);
        },
        error: (error) => {
          console.error('Error getting suggested attorneys:', error);
          reject(error);
        }
      });
    });
  }

  /**
   * Assign case to specific attorney
   */
  assignCase(caseItem: CaseQueueItem, attorneyId: string): void {
    this.dashboardService.assignCase(caseItem.caseId, attorneyId).subscribe({
      next: () => {
        // Remove from queue
        this.dataSource.data = this.dataSource.data.filter(c => c.caseId !== caseItem.caseId);
        this.loadDashboardData(); // Refresh stats
      },
      error: (error) => {
        console.error('Error assigning case:', error);
        alert('Failed to assign case. Please try again.');
      }
    });
  }

  /**
   * Auto-assign case to best attorney
   */
  autoAssignCase(caseItem: CaseQueueItem): void {
    this.dashboardService.autoAssignCase(caseItem.caseId).subscribe({
      next: (result) => {
        // Remove from queue
        this.dataSource.data = this.dataSource.data.filter(c => c.caseId !== caseItem.caseId);
        this.loadDashboardData(); // Refresh stats
        alert(`Case assigned to ${result.assignedAttorney.name} (Score: ${result.assignedAttorney.score})`);
      },
      error: (error) => {
        console.error('Error auto-assigning case:', error);
        alert('Failed to auto-assign case. Please try again.');
      }
    });
  }

  /**
   * Bulk assign selected cases
   */
  bulkAssignCases(attorneyId?: string): void {
    const selectedCases = this.selection.selected;
    
    if (selectedCases.length === 0) {
      alert('Please select cases to assign.');
      return;
    }

    const caseIds = selectedCases.map(c => c.caseId);
    this.bulkAssigning = true;

    this.dashboardService.bulkAssignCases(caseIds, attorneyId, !attorneyId).subscribe({
      next: (result) => {
        this.bulkAssigning = false;
        this.selection.clear();
        
        // Remove successfully assigned cases from queue
        const assignedIds = result.results
          .filter(r => r.success)
          .map(r => r.caseId);
        
        this.dataSource.data = this.dataSource.data.filter(
          c => !assignedIds.includes(c.caseId)
        );
        
        this.loadDashboardData(); // Refresh stats
        alert(`Assigned ${result.assigned} cases successfully. ${result.failed} failed.`);
      },
      error: (error) => {
        console.error('Error bulk assigning cases:', error);
        this.bulkAssigning = false;
        alert('Failed to bulk assign cases. Please try again.');
      }
    });
  }

  /**
   * Check if all rows are selected
   */
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /**
   * Toggle all rows selection
   */
  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach(row => this.selection.select(row));
  }

  /**
   * Get priority badge color
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      case 'low': return 'primary';
      default: return '';
    }
  }

  /**
   * Refresh dashboard
   */
  refresh(): void {
    this.loadDashboardData();
  }
}

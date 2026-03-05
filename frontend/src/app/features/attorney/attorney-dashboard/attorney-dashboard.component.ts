/**
 * Attorney Dashboard Component - Kanban board and performance metrics
 * Location: frontend/src/app/features/attorney/attorney-dashboard/attorney-dashboard.component.ts
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart } from 'chart.js/auto';
import { Router } from '@angular/router';

import { CaseService } from '../../../core/services/case.service';
import { AuthService } from '../../../core/services/auth.service';

export interface KanbanColumn {
  id: string;
  title: string;
  cases: KanbanCase[];
  color: string;
}

export interface KanbanCase {
  caseId: string;
  driverName: string;
  violationType: string;
  violationDate: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  status: string;
}

export interface PerformanceMetrics {
  totalCases: number;
  activeCases: number;
  completedThisMonth: number;
  successRate: number;
  averageResolutionDays: number;
  upcomingDeadlines: number;
}

export interface CaseTemplate {
  id: string;
  name: string;
  description: string;
  violationType: string;
  defaultActions: string[];
}

@Component({
  selector: 'app-attorney-dashboard',
  standalone: true,
  templateUrl: './attorney-dashboard.component.html',
  styleUrls: ['./attorney-dashboard.component.scss'],
  imports: [
    CommonModule,
    DecimalPipe,
    DatePipe,
    DragDropModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ]
})
export class AttorneyDashboardComponent implements OnInit, OnDestroy {
  // Kanban Board
  kanbanColumns: KanbanColumn[] = [
    {
      id: 'new',
      title: 'New',
      cases: [],
      color: '#4CAF50'
    },
    {
      id: 'reviewing',
      title: 'Reviewing',
      cases: [],
      color: '#2196F3'
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      cases: [],
      color: '#FF9800'
    },
    {
      id: 'pending_response',
      title: 'Pending Response',
      cases: [],
      color: '#9C27B0'
    },
    {
      id: 'completed',
      title: 'Completed',
      cases: [],
      color: '#4CAF50'
    }
  ];

  // Performance Metrics
  metrics: PerformanceMetrics = {
    totalCases: 0,
    activeCases: 0,
    completedThisMonth: 0,
    successRate: 0,
    averageResolutionDays: 0,
    upcomingDeadlines: 0
  };

  // Case Templates
  templates: CaseTemplate[] = [
    {
      id: '1',
      name: 'Speeding Violation',
      description: 'Standard speeding ticket defense',
      violationType: 'Speeding',
      defaultActions: ['Request traffic school', 'Negotiate fine reduction', 'Court appearance']
    },
    {
      id: '2',
      name: 'Equipment Violation',
      description: 'Vehicle equipment compliance issues',
      violationType: 'Equipment',
      defaultActions: ['Proof of correction', 'Submit documentation', 'Schedule inspection']
    },
    {
      id: '3',
      name: 'Hours of Service',
      description: 'HOS violation defense strategy',
      violationType: 'HOS',
      defaultActions: ['Review logbook', 'Gather evidence', 'Prepare defense']
    }
  ];

  // Charts
  private performanceChart: Chart | null = null;
  private caseTypeChart: Chart | null = null;

  // State
  loading = false;
  selectedTemplate: CaseTemplate | null = null;
  showTemplatesSidebar = true;
  pendingCases: any[] = [];
  pendingLoading = false;
  processingCaseId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private caseService: CaseService,
    private authService: AuthService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadPendingCases();
    this.initializeCharts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.performanceChart) this.performanceChart.destroy();
    if (this.caseTypeChart) this.caseTypeChart.destroy();
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.loading = true;
    const currentUser = this.authService.currentUserValue;

    // Load cases for kanban board
    this.caseService.getMyCases().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const cases = response?.data || response || [];
        this.populateKanbanBoard(cases);
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading cases:', error);
        this.loading = false;
      }
    });

    // Load performance metrics
    this.loadPerformanceMetrics();
  }

  /**
   * Populate kanban board with cases
   */
  populateKanbanBoard(cases: any[]): void {
    // Reset columns
    this.kanbanColumns.forEach(col => col.cases = []);

    // Distribute cases to columns
    cases.forEach(caseItem => {
      const kanbanCase: KanbanCase = {
        caseId: caseItem.caseId,
        driverName: caseItem.driverName || 'Unknown Driver',
        violationType: caseItem.violationType,
        violationDate: caseItem.violationDate,
        priority: caseItem.priority || 'medium',
        dueDate: caseItem.dueDate,
        status: caseItem.status
      };

      // Map status to column
      let columnId = 'new';
      if (caseItem.status === 'assigned') {
        columnId = 'new';
      } else if (caseItem.status === 'reviewing') {
        columnId = 'reviewing';
      } else if (caseItem.status === 'in_progress') {
        columnId = 'in_progress';
      } else if (caseItem.status === 'pending_response') {
        columnId = 'pending_response';
      } else if (caseItem.status === 'completed' || caseItem.status === 'resolved') {
        columnId = 'completed';
      }

      const column = this.kanbanColumns.find(col => col.id === columnId);
      if (column) {
        column.cases.push(kanbanCase);
      }
    });
  }

  /**
   * Load performance metrics
   */
  loadPerformanceMetrics(): void {
    const currentUser = this.authService.currentUserValue;
    
    // Mock data - replace with actual API call
    this.metrics = {
      totalCases: 45,
      activeCases: 23,
      completedThisMonth: 12,
      successRate: 89.5,
      averageResolutionDays: 14.3,
      upcomingDeadlines: 5
    };

    this.updateCharts();
  }

  /**
   * Initialize Chart.js charts
   */
  initializeCharts(): void {
    // Performance Trend Chart
    const performanceCtx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (performanceCtx) {
      this.performanceChart = new Chart(performanceCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'Cases Completed',
            data: [8, 12, 10, 15, 14, 12],
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            tension: 0.4,
            fill: true
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
              text: 'Monthly Performance'
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

    // Case Type Distribution Chart
    const caseTypeCtx = document.getElementById('caseTypeChart') as HTMLCanvasElement;
    if (caseTypeCtx) {
      this.caseTypeChart = new Chart(caseTypeCtx, {
        type: 'doughnut',
        data: {
          labels: ['Speeding', 'Equipment', 'HOS', 'Logbook', 'Other'],
          datasets: [{
            data: [15, 8, 12, 5, 5],
            backgroundColor: [
              '#3f51b5',
              '#009688',
              '#ff9800',
              '#e91e63',
              '#9c27b0'
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
              text: 'Case Types'
            }
          }
        }
      });
    }
  }

  /**
   * Update charts with new data
   */
  updateCharts(): void {
    // Update with real data as needed
  }

  /**
   * Handle drag and drop events
   */
  onDrop(event: CdkDragDrop<KanbanCase[]>): void {
    if (event.previousContainer === event.container) {
      // Reorder within same column
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Move between columns
      const movedCase = event.previousContainer.data[event.previousIndex];
      const targetColumn = this.kanbanColumns.find(
        col => col.cases === event.container.data
      );

      if (targetColumn) {
        // Update case status
        this.updateCaseStatus(movedCase.caseId, targetColumn.id);

        // Transfer item
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      }
    }
  }

  /**
   * Update case status when moved to different column
   */
  updateCaseStatus(caseId: string, newStatus: string): void {
    this.caseService.updateCase(caseId, { status: newStatus }).subscribe({
      next: () => {
        console.log(`Case ${caseId} status updated to ${newStatus}`);
      },
      error: (error) => {
        console.error('Error updating case status:', error);
      }
    });
  }

  /**
   * Get priority color
   */
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#9e9e9e';
    }
  }

  /**
   * Apply template to new case
   */
  applyTemplate(template: CaseTemplate): void {
    this.selectedTemplate = template;
    console.log('Template selected:', template);
    // Open dialog or navigate to create case with template
  }

  /**
   * Quick action: Create new case
   */
  createNewCase(): void {
    console.log('Create new case');
    // Navigate to case creation
  }

  /**
   * Quick action: View upcoming deadlines
   */
  viewDeadlines(): void {
    console.log('View deadlines');
    // Open deadlines dialog
  }

  /**
   * Quick action: Generate report
   */
  generateReport(): void {
    console.log('Generate report');
    // Open report generation dialog
  }

  /**
   * Load cases awaiting attorney acceptance
   */
  loadPendingCases(): void {
    this.pendingLoading = true;
    this.caseService.getMyCases().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        const cases = response?.data || [];
        this.pendingCases = cases.filter((c: any) => c.status === 'assigned_to_attorney');
        this.pendingLoading = false;
      },
      error: () => { this.pendingLoading = false; }
    });
  }

  /**
   * Accept an assigned case
   */
  acceptCase(caseId: string): void {
    this.processingCaseId = caseId;
    this.caseService.acceptCase(caseId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.pendingCases = this.pendingCases.filter(c => c.id !== caseId);
        this.processingCaseId = null;
        this.loadDashboardData();
      },
      error: () => { this.processingCaseId = null; }
    });
  }

  /**
   * Decline an assigned case
   */
  declineCase(caseId: string): void {
    this.processingCaseId = caseId;
    this.caseService.declineCase(caseId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.pendingCases = this.pendingCases.filter(c => c.id !== caseId);
        this.processingCaseId = null;
      },
      error: () => { this.processingCaseId = null; }
    });
  }

  /**
   * Toggle templates sidebar
   */
  toggleTemplatesSidebar(): void {
    this.showTemplatesSidebar = !this.showTemplatesSidebar;
  }

  /**
   * Open case details
   */
  openCaseDetails(caseItem: KanbanCase): void {
    this.router.navigate(['/attorney/cases', caseItem.caseId]);
  }

  /**
   * Refresh dashboard
   */
  refresh(): void {
    this.loadDashboardData();
  }
}

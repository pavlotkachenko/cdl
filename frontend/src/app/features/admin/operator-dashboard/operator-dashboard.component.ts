import {
  Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef,
  ChangeDetectionStrategy, inject, signal, computed,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js/auto';

import {
  DashboardService, WorkloadStats, CaseQueueItem, SuggestedAttorney,
} from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';

type Priority = 'high' | 'medium' | 'low' | '';

@Component({
  selector: 'app-operator-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatProgressSpinnerModule, TranslateModule,
  ],
  template: `
    <div class="operator-dashboard">
      <div class="page-header">
        <h1>{{ 'ADMIN.OPS_DASHBOARD' | translate }}</h1>
        <button mat-raised-button color="primary" (click)="refresh()">
          <mat-icon>refresh</mat-icon> {{ 'ADMIN.REFRESH' | translate }}
        </button>
      </div>

      @if (workloadStats()) {
        <div class="stats-grid">
          <mat-card><mat-card-content>
            <p class="stat-label">{{ 'ADMIN.STATUS_NEW' | translate }}</p>
            <p class="stat-value">{{ workloadStats()!.newCases }}</p>
          </mat-card-content></mat-card>
          <mat-card><mat-card-content>
            <p class="stat-label">{{ 'ADMIN.STATUS_ASSIGNED' | translate }}</p>
            <p class="stat-value">{{ workloadStats()!.assignedCases }}</p>
          </mat-card-content></mat-card>
          <mat-card><mat-card-content>
            <p class="stat-label">{{ 'ADMIN.STATUS_IN_PROGRESS' | translate }}</p>
            <p class="stat-value">{{ workloadStats()!.inProgressCases }}</p>
          </mat-card-content></mat-card>
          <mat-card><mat-card-content>
            <p class="stat-label">{{ 'ADMIN.RESOLVED' | translate }}</p>
            <p class="stat-value">{{ workloadStats()!.resolvedCases }}</p>
          </mat-card-content></mat-card>
        </div>
      }

      <div class="charts-row">
        <mat-card>
          <mat-card-header><mat-card-title>{{ 'ADMIN.CASE_STATUS' | translate }}</mat-card-title></mat-card-header>
          <mat-card-content><canvas #statusChart></canvas></mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>{{ 'ADMIN.VIOLATION_TYPES' | translate }}</mat-card-title></mat-card-header>
          <mat-card-content><canvas #violationChart></canvas></mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>{{ 'ADMIN.ATTORNEY_WORKLOAD' | translate }}</mat-card-title></mat-card-header>
          <mat-card-content><canvas #workloadChart></canvas></mat-card-content>
        </mat-card>
      </div>

      <mat-card class="queue-card">
        <mat-card-header>
          <mat-card-title>{{ 'ADMIN.CASE_QUEUE' | translate }}</mat-card-title>
          <div class="queue-filters">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'ADMIN.SEARCH_CASES' | translate }}</mat-label>
              <input matInput [value]="searchText()"
                (input)="searchText.set($any($event.target).value)"
                [placeholder]="'ADMIN.SEARCH_PLACEHOLDER' | translate">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ 'ADMIN.STATUS' | translate }}</mat-label>
              <mat-select [value]="filterStatus()" (selectionChange)="filterStatus.set($event.value)">
                <mat-option value="">{{ 'ADMIN.ALL_STATUSES' | translate }}</mat-option>
                <mat-option value="new">{{ 'ADMIN.STATUS_NEW' | translate }}</mat-option>
                <mat-option value="assigned">{{ 'ADMIN.STATUS_ASSIGNED' | translate }}</mat-option>
                <mat-option value="in_progress">{{ 'ADMIN.STATUS_IN_PROGRESS' | translate }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ 'ADMIN.PRIORITY' | translate }}</mat-label>
              <mat-select [value]="filterPriority()" (selectionChange)="filterPriority.set($event.value)">
                <mat-option value="">{{ 'ADMIN.ALL_PRIORITIES' | translate }}</mat-option>
                <mat-option value="high">{{ 'ADMIN.PRIORITY_HIGH' | translate }}</mat-option>
                <mat-option value="medium">{{ 'ADMIN.PRIORITY_MEDIUM' | translate }}</mat-option>
                <mat-option value="low">{{ 'ADMIN.PRIORITY_LOW' | translate }}</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-stroked-button (click)="clearFilters()">{{ 'ADMIN.CLEAR' | translate }}</button>
          </div>
        </mat-card-header>
        <mat-card-content>
          @if (loading()) {
            <div class="loading-center"><mat-spinner diameter="40"></mat-spinner></div>
          }
          @if (!loading()) {
            @if (filteredQueue().length === 0) {
              <div class="empty-state">
                <mat-icon>inbox</mat-icon>
                <p>{{ 'ADMIN.NO_CASES_QUEUE' | translate }}</p>
              </div>
            }
            @for (item of filteredQueue(); track item.caseId) {
              <div class="queue-row">
                <div class="case-info">
                  <span class="case-id">{{ item.caseId }}</span>
                  <span class="driver-name">{{ item.driverName }}</span>
                  <span class="violation">{{ item.violationType }}</span>
                  <span class="state">{{ item.violationState }}</span>
                </div>
                <div class="case-meta">
                  <mat-chip [color]="getPriorityColor(item.priority)" highlighted>
                    {{ item.priority }}
                  </mat-chip>
                  <mat-chip>{{ item.status }}</mat-chip>
                </div>
                <div class="case-actions">
                  <button mat-stroked-button (click)="autoAssignCase(item)">
                    <mat-icon>auto_fix_high</mat-icon> {{ 'ADMIN.AUTO_ASSIGN' | translate }}
                  </button>
                </div>
              </div>
            }
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
})
export class OperatorDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('violationChart') violationChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workloadChart') workloadChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  workloadStats = signal<WorkloadStats | null>(null);
  caseQueue = signal<CaseQueueItem[]>([]);
  loading = signal(false);

  searchText = signal('');
  filterStatus = signal('');
  filterPriority = signal<Priority>('');

  filteredQueue = computed(() => {
    let list = this.caseQueue();
    const text = this.searchText().toLowerCase();
    const status = this.filterStatus();
    const priority = this.filterPriority();
    if (text) {
      list = list.filter(c =>
        c.driverName?.toLowerCase().includes(text) ||
        c.caseId?.toLowerCase().includes(text) ||
        c.violationState?.toLowerCase().includes(text)
      );
    }
    if (status) list = list.filter(c => c.status === status);
    if (priority) list = list.filter(c => c.priority === priority);
    return list;
  });

  private statusChart: Chart | null = null;
  private violationChart: Chart | null = null;
  private workloadChart: Chart | null = null;
  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.loadDashboardData();

    this.subs.push(
      this.dashboardService.workload$.subscribe(stats => {
        this.workloadStats.set(stats);
        this.updateCharts();
      }),
      this.dashboardService.queue$.subscribe(cases => {
        this.caseQueue.set(cases);
      }),
    );
  }

  ngAfterViewInit(): void {
    this.initCharts();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.statusChart?.destroy();
    this.violationChart?.destroy();
    this.workloadChart?.destroy();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    const userId = this.authService.currentUserValue?.id;

    this.dashboardService.getWorkloadStats(userId).subscribe({
      next: (stats) => {
        this.workloadStats.set(stats);
        this.updateCharts();
      },
    });

    this.dashboardService.getCaseQueue({ status: 'new', limit: 100 }).subscribe({
      next: (response) => {
        this.caseQueue.set(response.cases);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private initCharts(): void {
    const statusCtx = this.statusChartRef?.nativeElement;
    if (statusCtx) {
      this.statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
          labels: ['New', 'Assigned', 'In Progress', 'Resolved'],
          datasets: [{ data: [0, 0, 0, 0], backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'] }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Case Status Distribution' } },
        },
      });
    }

    const violationCtx = this.violationChartRef?.nativeElement;
    if (violationCtx) {
      this.violationChart = new Chart(violationCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Violations by Type', data: [], backgroundColor: '#3f51b5' }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, title: { display: true, text: 'Violation Type Distribution' } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }

    const workloadCtx = this.workloadChartRef?.nativeElement;
    if (workloadCtx) {
      this.workloadChart = new Chart(workloadCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Active Cases', data: [], backgroundColor: '#009688' }] },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          plugins: { legend: { display: false }, title: { display: true, text: 'Attorney Workload' } },
          scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }
  }

  private updateCharts(): void {
    const stats = this.workloadStats();
    if (!stats || !this.statusChart) return;

    this.statusChart.data.datasets[0].data = [
      stats.newCases, stats.assignedCases, stats.inProgressCases, stats.resolvedCases,
    ];
    this.statusChart.update();

    this.dashboardService.getViolationTypeDistribution(30).subscribe({
      next: (data) => {
        if (this.violationChart && data) {
          this.violationChart.data.labels = data.labels;
          this.violationChart.data.datasets[0].data = data.values;
          this.violationChart.update();
        }
      },
    });

    this.dashboardService.getAttorneyWorkloadDistribution().subscribe({
      next: (data) => {
        if (this.workloadChart && data) {
          this.workloadChart.data.labels = data.map((a: any) => a.name);
          this.workloadChart.data.datasets[0].data = data.map((a: any) => a.caseCount);
          this.workloadChart.update();
        }
      },
    });
  }

  autoAssignCase(item: CaseQueueItem): void {
    this.dashboardService.autoAssignCase(item.caseId).subscribe({
      next: (result) => {
        this.caseQueue.update(q => q.filter(c => c.caseId !== item.caseId));
        this.loadDashboardData();
        this.snackBar.open(
          `Case assigned to ${result.assignedAttorney.name} (Score: ${result.assignedAttorney.score})`,
          'Close', { duration: 4000 }
        );
      },
      error: () => this.snackBar.open('Failed to auto-assign case', 'Close', { duration: 3000 }),
    });
  }

  clearFilters(): void {
    this.searchText.set('');
    this.filterStatus.set('');
    this.filterPriority.set('');
  }

  refresh(): void {
    this.loadDashboardData();
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return 'warn';
      case 'medium': return 'accent';
      default: return 'primary';
    }
  }
}

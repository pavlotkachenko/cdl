// ============================================
// Analytics Dashboard Component - FIXED
// Location: frontend/src/app/features/driver/analytics/analytics.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';

// Chart.js
import { Chart, registerables } from 'chart.js';

// Services
import { 
  AnalyticsService, 
  AnalyticsSummary,
  CasesByType,
  CasesByStatus,
  TimeSeriesData,
  LocationData,
  TrendData
} from '../../../core/services/analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDividerModule,
    MatTabsModule,
    MatMenuModule
  ]
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ADDED: Expose Math to template
  Math = Math;

  // Data
  summary: AnalyticsSummary | null = null;
  casesByType: CasesByType[] = [];
  casesByStatus: CasesByStatus[] = [];
  timeSeriesData: TimeSeriesData[] = [];
  locationData: LocationData[] = [];
  trends: any = null;

  // Charts
  private typeChart: Chart | null = null;
  private statusChart: Chart | null = null;
  private timelineChart: Chart | null = null;
  private locationChart: Chart | null = null;

  // UI State
  loading = true;
  selectedPeriod: 'week' | 'month' | 'quarter' | 'year' = 'month';
  filterForm!: FormGroup;

  // ADDED: Typed period control
  get periodControl(): FormControl {
    return this.filterForm.get('period') as FormControl;
  }

  constructor(
    private analyticsService: AnalyticsService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      period: ['month']
    });

    this.filterForm.get('period')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(period => {
        this.selectedPeriod = period;
        this.loadTimeSeriesData();
      });
  }

  private loadAllData(): void {
    this.loading = true;

    // Load summary
    this.analyticsService.getSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe(summary => {
        this.summary = summary;
      });

    // Load cases by type
    this.analyticsService.getCasesByType()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.casesByType = data;
        setTimeout(() => this.createTypeChart(), 100);
      });

    // Load cases by status
    this.analyticsService.getCasesByStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.casesByStatus = data;
        setTimeout(() => this.createStatusChart(), 100);
      });

    // Load time series
    this.loadTimeSeriesData();

    // Load location data
    this.analyticsService.getLocationData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.locationData = data;
        setTimeout(() => this.createLocationChart(), 100);
      });

    // Load trends
    this.analyticsService.getTrends()
      .pipe(takeUntil(this.destroy$))
      .subscribe(trends => {
        this.trends = trends;
        this.loading = false;
      });
  }

  private loadTimeSeriesData(): void {
    this.analyticsService.getTimeSeriesData(this.selectedPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.timeSeriesData = data;
        setTimeout(() => this.createTimelineChart(), 100);
      });
  }

  // ============================================
  // Chart Creation
  // ============================================

  private createTypeChart(): void {
    const canvas = document.getElementById('typeChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.typeChart) {
      this.typeChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.typeChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.casesByType.map(item => item.type),
        datasets: [{
          data: this.casesByType.map(item => item.count),
          backgroundColor: [
            '#3b82f6',
            '#8b5cf6',
            '#10b981',
            '#f59e0b',
            '#ef4444'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.parsed;
                const percentage = this.casesByType[context.dataIndex].percentage;
                return `${label}: ${value} (${percentage.toFixed(1)}%)`;
              }
            }
          }
        }
      }
    });
  }

  private createStatusChart(): void {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.statusChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.casesByStatus.map(item => item.status),
        datasets: [{
          label: 'Number of Cases',
          data: this.casesByStatus.map(item => item.count),
          backgroundColor: this.casesByStatus.map(item => item.color),
          borderRadius: 8,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 5
            }
          }
        }
      }
    });
  }

  private createTimelineChart(): void {
    const canvas = document.getElementById('timelineChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.timelineChart) {
      this.timelineChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.timeSeriesData.map(item => item.date),
        datasets: [
          {
            label: 'New Cases',
            data: this.timeSeriesData.map(item => item.cases),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Resolved Cases',
            data: this.timeSeriesData.map(item => item.resolved),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private createLocationChart(): void {
    const canvas = document.getElementById('locationChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.locationChart) {
      this.locationChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.locationChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.locationData.map(item => item.state),
        datasets: [
          {
            label: 'Case Count',
            data: this.locationData.map(item => item.count),
            backgroundColor: '#1dad8c',
            borderRadius: 8,
            yAxisID: 'y'
          },
          {
            label: 'Success Rate (%)',
            data: this.locationData.map(item => item.successRate),
            backgroundColor: '#10b981',
            borderRadius: 8,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Case Count'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Success Rate (%)'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  private destroyCharts(): void {
    if (this.typeChart) this.typeChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
    if (this.timelineChart) this.timelineChart.destroy();
    if (this.locationChart) this.locationChart.destroy();
  }

  // ============================================
  // Actions
  // ============================================

  refreshData(): void {
    this.loadAllData();
  }

  exportChart(chartId: string): void {
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${chartId}-${Date.now()}.png`;
    link.href = url;
    link.click();
  }

  generatePDFReport(): void {
    // Placeholder - would use jsPDF to create comprehensive report
    console.log('Generating PDF report...');
    alert('PDF report generation coming soon!');
  }

  // ============================================
  // Utility Methods
  // ============================================

  getChangeIcon(change: number): string {
    return this.analyticsService.getChangeIcon(change);
  }

  getChangeColor(change: number, inverse: boolean = false): string {
    return this.analyticsService.getChangeColor(change, inverse);
  }

  formatPercentage(value: number): string {
    return this.analyticsService.formatPercentage(value);
  }
}

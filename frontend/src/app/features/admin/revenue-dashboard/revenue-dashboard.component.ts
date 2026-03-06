import {
  Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef,
  ChangeDetectionStrategy, inject, signal,
} from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  RevenueService, RevenueMetrics, RevenueByDate, RevenueByMethod, RevenueByAttorney, DateRange,
} from '../../../services/revenue.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-revenue-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="revenue-dashboard">
      <div class="page-header">
        <h1>Revenue Dashboard</h1>
        <div class="header-actions" [formGroup]="dateRangeForm">
          <mat-form-field appearance="outline">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate">
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="onDateRangeChange()">Apply</button>
          <button mat-stroked-button (click)="exportToCsv()">
            <mat-icon>download</mat-icon> Export CSV
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48"></mat-spinner></div>
      }

      @if (metrics(); as m) {
        <div class="metrics-grid">
          <mat-card><mat-card-content>
            <p class="metric-label">Total Revenue</p>
            <p class="metric-value">{{ formatCurrency(m.total_revenue) }}</p>
          </mat-card-content></mat-card>
          <mat-card><mat-card-content>
            <p class="metric-label">Transactions</p>
            <p class="metric-value">{{ m.total_transactions }}</p>
          </mat-card-content></mat-card>
          <mat-card><mat-card-content>
            <p class="metric-label">Avg Transaction</p>
            <p class="metric-value">{{ formatCurrency(m.average_transaction) }}</p>
          </mat-card-content></mat-card>
          <mat-card><mat-card-content>
            <p class="metric-label">Success Rate</p>
            <p class="metric-value">{{ formatPercentage(m.success_rate) }}</p>
          </mat-card-content></mat-card>
        </div>
      }

      <div class="charts-grid">
        <mat-card>
          <mat-card-header><mat-card-title>Revenue Over Time</mat-card-title></mat-card-header>
          <mat-card-content><canvas #revenueChart></canvas></mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Revenue by Method</mat-card-title></mat-card-header>
          <mat-card-content><canvas #methodChart></canvas></mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-header><mat-card-title>Top Attorneys by Revenue</mat-card-title></mat-card-header>
          <mat-card-content><canvas #attorneyChart></canvas></mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class RevenueDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('methodChart') methodChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('attorneyChart') attorneyChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly revenueService = inject(RevenueService);
  private readonly snackBar = inject(MatSnackBar);

  metrics = signal<RevenueMetrics | null>(null);
  loading = signal(false);

  private revenueChart: Chart | null = null;
  private methodChart: Chart | null = null;
  private attorneyChart: Chart | null = null;
  private viewReady = false;

  dateRangeForm = new FormGroup({
    startDate: new FormControl(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    endDate: new FormControl(new Date()),
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
  }

  loadDashboardData(): void {
    this.loading.set(true);
    const dateRange = this.getDateRange();

    Promise.all([
      this.loadMetrics(dateRange),
      this.loadRevenueOverTime(dateRange),
      this.loadRevenueByMethod(dateRange),
      this.loadRevenueByAttorney(dateRange),
    ]).then(() => {
      this.loading.set(false);
    }).catch(() => {
      this.loading.set(false);
      this.snackBar.open('Error loading dashboard data', 'Close', { duration: 3000 });
    });
  }

  private getDateRange(): DateRange {
    const { startDate, endDate } = this.dateRangeForm.value;
    return {
      start_date: startDate ? startDate.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: endDate ? endDate.toISOString() : new Date().toISOString(),
    };
  }

  private async loadMetrics(dateRange: DateRange): Promise<void> {
    this.metrics.set(await this.revenueService.getRevenueMetrics(dateRange).toPromise() ?? null);
  }

  private async loadRevenueOverTime(dateRange: DateRange): Promise<void> {
    const data = await this.revenueService.getDailyRevenue(dateRange).toPromise();
    this.createRevenueChart(data ?? []);
  }

  private async loadRevenueByMethod(dateRange: DateRange): Promise<void> {
    const data = await this.revenueService.getRevenueByMethod(dateRange).toPromise();
    this.createMethodChart(data ?? []);
  }

  private async loadRevenueByAttorney(dateRange: DateRange): Promise<void> {
    const data = await this.revenueService.getRevenueByAttorney(dateRange).toPromise();
    this.createAttorneyChart(data ?? []);
  }

  private createRevenueChart(data: RevenueByDate[]): void {
    const ctx = this.revenueChartRef?.nativeElement;
    if (!ctx) return;
    this.revenueChart?.destroy();
    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [{
          label: 'Revenue',
          data: data.map(d => d.revenue / 100),
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          fill: true,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          tooltip: { callbacks: { label: (ctx) => `Revenue: $${(ctx.parsed.y ?? 0).toFixed(2)}` } },
        },
        scales: { y: { beginAtZero: true, ticks: { callback: (v) => `$${v}` } } },
      },
    });
  }

  private createMethodChart(data: RevenueByMethod[]): void {
    const ctx = this.methodChartRef?.nativeElement;
    if (!ctx) return;
    this.methodChart?.destroy();
    this.methodChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.map(d => d.method),
        datasets: [{
          data: data.map(d => d.revenue / 100),
          backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4'],
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.label}: $${ctx.parsed.toFixed(2)} (${data[ctx.dataIndex].percentage.toFixed(1)}%)`,
            },
          },
        },
      },
    });
  }

  private createAttorneyChart(data: RevenueByAttorney[]): void {
    const ctx = this.attorneyChartRef?.nativeElement;
    if (!ctx) return;
    const sorted = [...data].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    this.attorneyChart?.destroy();
    this.attorneyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(d => d.attorney_name),
        datasets: [{
          label: 'Revenue',
          data: sorted.map(d => d.revenue / 100),
          backgroundColor: '#4caf50',
          borderColor: '#388e3c',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => [
                `Revenue: $${(ctx.parsed.x ?? 0).toFixed(2)}`,
                `Transactions: ${sorted[ctx.dataIndex].transactions}`,
              ],
            },
          },
        },
        scales: { x: { beginAtZero: true, ticks: { callback: (v) => `$${v}` } } },
      },
    });
  }

  onDateRangeChange(): void {
    this.loadDashboardData();
  }

  exportToCsv(): void {
    this.revenueService.exportToCsv(this.getDateRange()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Report exported successfully', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Error exporting report', 'Close', { duration: 3000 }),
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  ngOnDestroy(): void {
    this.revenueChart?.destroy();
    this.methodChart?.destroy();
    this.attorneyChart?.destroy();
  }
}

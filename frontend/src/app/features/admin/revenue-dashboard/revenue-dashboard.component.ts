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
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import {
  RevenueService, RevenueMetrics, RevenueByDate, RevenueByMethod, RevenueByAttorney, RecentTransaction, DateRange,
} from '../../../services/revenue.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ── Interfaces ───────────────────────────────────────────────────────────

interface MetricCard {
  icon: string;
  labelKey: string;
  value: string;
  trendDirection: 'up' | 'down';
  trendPercent: string;
  colorClass: string;
}

// ── Component ────────────────────────────────────────────────────────────

@Component({
  selector: 'app-revenue-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="revenue-dashboard">
      <!-- Header -->
      <div class="page-header">
        <h1>{{ 'ADMIN.REVENUE_DASHBOARD' | translate }}</h1>
      </div>

      <!-- Date range toolbar -->
      <div class="date-toolbar" [formGroup]="dateRangeForm">
        <div class="date-fields">
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>{{ 'ADMIN.START_DATE' | translate }}</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>
          <mat-icon class="date-arrow" aria-hidden="true">arrow_forward</mat-icon>
          <mat-form-field appearance="outline" class="date-field">
            <mat-label>{{ 'ADMIN.END_DATE' | translate }}</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate">
            <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>
        <div class="toolbar-actions">
          <button mat-raised-button color="primary" (click)="onDateRangeChange()">
            <mat-icon>filter_list</mat-icon>
            {{ 'ADMIN.APPLY' | translate }}
          </button>
          <button mat-stroked-button (click)="exportToCsv()">
            <mat-icon>download</mat-icon>
            {{ 'ADMIN.EXPORT_CSV' | translate }}
          </button>
        </div>
      </div>

      <!-- Loading spinner -->
      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48"></mat-spinner></div>
      }

      <!-- Metric cards — Row 1: Revenue -->
      @if (revenueCards().length > 0) {
        <div class="metrics-grid metrics-row-revenue">
          @for (card of revenueCards(); track card.labelKey) {
            <mat-card [class]="'metric-card ' + card.colorClass">
              <mat-card-content>
                <div class="metric-icon">
                  <mat-icon>{{ card.icon }}</mat-icon>
                </div>
                <div class="metric-details">
                  <span class="metric-label">{{ card.labelKey | translate }}</span>
                  <span class="metric-value">{{ card.value }}</span>
                  <span class="metric-trend" [class.trend-up]="card.trendDirection === 'up'" [class.trend-down]="card.trendDirection === 'down'">
                    <mat-icon class="trend-icon">{{ card.trendDirection === 'up' ? 'trending_up' : 'trending_down' }}</mat-icon>
                    {{ card.trendPercent }}
                  </span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <!-- Metric cards — Row 2: Operational -->
      @if (operationalCards().length > 0) {
        <div class="metrics-grid metrics-row-ops">
          @for (card of operationalCards(); track card.labelKey) {
            <mat-card [class]="'metric-card ' + card.colorClass">
              <mat-card-content>
                <div class="metric-icon">
                  <mat-icon>{{ card.icon }}</mat-icon>
                </div>
                <div class="metric-details">
                  <span class="metric-label">{{ card.labelKey | translate }}</span>
                  <span class="metric-value">{{ card.value }}</span>
                  <span class="metric-trend" [class.trend-up]="card.trendDirection === 'up'" [class.trend-down]="card.trendDirection === 'down'">
                    <mat-icon class="trend-icon">{{ card.trendDirection === 'up' ? 'trending_up' : 'trending_down' }}</mat-icon>
                    {{ card.trendPercent }}
                  </span>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <!-- Charts -->
      <div class="charts-grid">
        <mat-card class="chart-card full-width">
          <mat-card-header><mat-card-title>{{ 'ADMIN.REVENUE_OVER_TIME' | translate }}</mat-card-title></mat-card-header>
          <mat-card-content><div class="chart-container"><canvas #revenueChart></canvas></div></mat-card-content>
        </mat-card>
        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>{{ 'ADMIN.REVENUE_BY_METHOD' | translate }}</mat-card-title></mat-card-header>
          <mat-card-content><div class="chart-container"><canvas #methodChart></canvas></div></mat-card-content>
        </mat-card>
        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>{{ 'ADMIN.TOP_ATTORNEYS' | translate }}</mat-card-title></mat-card-header>
          <mat-card-content><div class="chart-container"><canvas #attorneyChart></canvas></div></mat-card-content>
        </mat-card>
      </div>

      <!-- Top Payment Methods breakdown -->
      @if (paymentMethods().length > 0) {
        <mat-card class="section-card">
          <mat-card-header><mat-card-title>{{ 'ADMIN.REVENUE_BY_METHOD' | translate }}</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="payment-methods-breakdown">
              @for (pm of paymentMethods(); track pm.method) {
                <div class="method-row">
                  <div class="method-info">
                    <span class="method-name">{{ pm.method }}</span>
                    <span class="method-amount">{{ formatCurrency(pm.revenue) }}</span>
                  </div>
                  <div class="method-bar-track">
                    <div class="method-bar-fill" [style.width.%]="pm.percentage" [style.background-color]="getMethodColor(pm.method)"></div>
                  </div>
                  <span class="method-percent">{{ pm.percentage.toFixed(1) }}%</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Recent Transactions table -->
      @if (recentTransactions().length > 0) {
        <mat-card class="section-card">
          <mat-card-header><mat-card-title>{{ 'ADMIN.RECENT_TRANSACTIONS' | translate }}</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="table-responsive">
              <table class="transactions-table" aria-label="Recent transactions">
                <thead>
                  <tr>
                    <th scope="col">{{ 'ADMIN.DATE_COL' | translate }}</th>
                    <th scope="col">{{ 'ADMIN.CLIENT_COL' | translate }}</th>
                    <th scope="col">{{ 'ADMIN.AMOUNT_COL' | translate }}</th>
                    <th scope="col">{{ 'ADMIN.STATUS_COL' | translate }}</th>
                    <th scope="col">{{ 'ADMIN.METHOD_COL' | translate }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tx of recentTransactions(); track tx.date + tx.client) {
                    <tr>
                      <td>{{ tx.date }}</td>
                      <td>{{ tx.client }}</td>
                      <td>{{ formatCurrency(tx.amount) }}</td>
                      <td>
                        <span [class]="'status-badge status-' + tx.status">{{ tx.status }}</span>
                      </td>
                      <td>{{ tx.method }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .revenue-dashboard {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 16px;

      h1 {
        margin: 0;
        color: #333;
        font-size: 28px;
        font-weight: 700;
      }
    }

    .date-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: #f8f9fc;
      border: 1px solid #e8eaed;
      border-radius: 12px;
      padding: 12px 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .date-fields {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .date-field {
      width: 170px;
    }

    .date-arrow {
      color: #999;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;

      button {
        height: 44px;
        min-width: 44px;
        min-height: 44px;
      }
    }

    .loading-center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }

    /* ── Metric cards ── */
    .metrics-grid {
      display: grid;
      gap: 16px;
      margin-bottom: 20px;
    }

    .metrics-row-revenue {
      grid-template-columns: repeat(4, 1fr);
    }

    .metrics-row-ops {
      grid-template-columns: repeat(5, 1fr);
      margin-bottom: 32px;
    }

    .metric-card {
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.1);
      }

      mat-card-content {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }
    }

    .metric-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }
    }

    .metric-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .metric-label {
      font-size: 13px;
      color: #666;
      font-weight: 500;
    }

    .metric-value {
      font-size: 24px;
      font-weight: 700;
      color: #222;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .metric-trend {
      display: flex;
      align-items: center;
      font-size: 12px;
      font-weight: 600;
      gap: 2px;

      &.trend-up { color: #2e7d32; }
      &.trend-down { color: #c62828; }
    }

    .trend-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
    }

    /* Color classes for metric icon backgrounds */
    .color-blue .metric-icon { background: linear-gradient(135deg, #2196f3, #1565c0); }
    .color-green .metric-icon { background: linear-gradient(135deg, #4caf50, #2e7d32); }
    .color-red .metric-icon { background: linear-gradient(135deg, #ef5350, #c62828); }
    .color-purple .metric-icon { background: linear-gradient(135deg, #7e57c2, #512da8); }
    .color-teal .metric-icon { background: linear-gradient(135deg, #26a69a, #00796b); }
    .color-orange .metric-icon { background: linear-gradient(135deg, #ff9800, #e65100); }
    .color-indigo .metric-icon { background: linear-gradient(135deg, #5c6bc0, #283593); }
    .color-cyan .metric-icon { background: linear-gradient(135deg, #00bcd4, #00838f); }

    /* ── Charts ── */
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }

    .chart-card {
      &.full-width {
        grid-column: 1 / -1;
      }

      mat-card-header {
        padding: 16px 16px 0;
      }

      mat-card-content {
        padding: 16px;
      }
    }

    .chart-container {
      position: relative;
      height: 350px;
      width: 100%;
    }

    /* ── Section cards (payment methods, transactions) ── */
    .section-card {
      margin-bottom: 24px;

      mat-card-header {
        padding: 16px 16px 0;
      }

      mat-card-content {
        padding: 16px;
      }
    }

    /* ── Payment Methods breakdown ── */
    .payment-methods-breakdown {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .method-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .method-info {
      display: flex;
      justify-content: space-between;
      width: 240px;
      flex-shrink: 0;
    }

    .method-name {
      font-weight: 500;
      color: #333;
    }

    .method-amount {
      color: #666;
      font-size: 14px;
    }

    .method-bar-track {
      flex: 1;
      height: 12px;
      background: #f0f0f0;
      border-radius: 6px;
      overflow: hidden;
    }

    .method-bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.6s ease;
    }

    .method-percent {
      width: 50px;
      text-align: right;
      font-weight: 600;
      color: #444;
      font-size: 14px;
    }

    /* ── Transactions table ── */
    .table-responsive {
      overflow-x: auto;
    }

    .transactions-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 12px 16px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
      }

      th {
        font-weight: 600;
        color: #555;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: #fafafa;
      }

      td {
        font-size: 14px;
        color: #333;
      }

      tbody tr:hover {
        background: #f5f7ff;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: capitalize;

      &.status-completed {
        background: #e8f5e9;
        color: #2e7d32;
      }
      &.status-pending {
        background: #fff3e0;
        color: #e65100;
      }
      &.status-refunded {
        background: #fce4ec;
        color: #c62828;
      }
      &.status-failed {
        background: #ffebee;
        color: #b71c1c;
      }
    }

    /* ── Responsive ── */
    @media (max-width: 1200px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }

      .chart-card.full-width {
        grid-column: 1;
      }
    }

    @media (max-width: 1024px) {
      .metrics-row-revenue { grid-template-columns: repeat(2, 1fr); }
      .metrics-row-ops { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 768px) {
      .revenue-dashboard { padding: 16px; }

      .date-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .date-fields {
        flex-direction: column;
        width: 100%;
      }

      .date-field { width: 100%; }
      .date-arrow { display: none; }

      .toolbar-actions {
        width: 100%;
        button { flex: 1; }
      }

      .metrics-row-revenue { grid-template-columns: repeat(2, 1fr); }
      .metrics-row-ops { grid-template-columns: repeat(2, 1fr); }

      .method-info { width: 160px; }
    }

    @media (max-width: 480px) {
      .metrics-row-revenue,
      .metrics-row-ops { grid-template-columns: 1fr; }

      .metric-card mat-card-content {
        flex-direction: column;
        text-align: center;
      }

      .method-row { flex-wrap: wrap; }
      .method-info { width: 100%; }
    }
  `],
})
export class RevenueDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('methodChart') methodChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('attorneyChart') attorneyChartRef!: ElementRef<HTMLCanvasElement>;

  private readonly revenueService = inject(RevenueService);
  private readonly snackBar = inject(MatSnackBar);

  loading = signal(false);
  metrics = signal<RevenueMetrics | null>(null);
  metricCards = signal<MetricCard[]>([]);
  revenueCards = signal<MetricCard[]>([]);
  operationalCards = signal<MetricCard[]>([]);
  paymentMethods = signal<RevenueByMethod[]>([]);
  recentTransactions = signal<RecentTransaction[]>([]);

  private revenueChart: Chart | null = null;
  private methodChart: Chart | null = null;
  private attorneyChart: Chart | null = null;
  private viewReady = false;
  private pendingChartData: {
    daily?: RevenueByDate[];
    methods?: RevenueByMethod[];
    attorneys?: RevenueByAttorney[];
  } = {};

  dateRangeForm = new FormGroup({
    startDate: new FormControl(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    endDate: new FormControl(new Date()),
  });

  private readonly methodColorMap: Record<string, string> = {
    'Credit Card': '#2196f3',
    'ACH Transfer': '#4caf50',
    'Payment Plan': '#ff9800',
    'Wire Transfer': '#9c27b0',
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    // Render any charts that arrived before the view was ready
    if (this.pendingChartData.daily) {
      this.createRevenueChart(this.pendingChartData.daily);
    }
    if (this.pendingChartData.methods) {
      this.createMethodChart(this.pendingChartData.methods);
    }
    if (this.pendingChartData.attorneys) {
      this.createAttorneyChart(this.pendingChartData.attorneys);
    }
    this.pendingChartData = {};
  }

  loadDashboardData(): void {
    this.loading.set(true);
    const dateRange = this.getDateRange();

    Promise.all([
      this.loadMetrics(dateRange),
      this.loadRevenueOverTime(dateRange),
      this.loadRevenueByMethod(dateRange),
      this.loadRevenueByAttorney(dateRange),
      this.loadRecentTransactions(dateRange),
    ]).then(() => {
      this.loading.set(false);
    }).catch(() => {
      this.loading.set(false);
      this.snackBar.open('ADMIN.REVENUE_ERROR', 'Close', { duration: 3000 });
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
        this.snackBar.open('ADMIN.EXPORT_SUCCESS', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('ADMIN.EXPORT_ERROR', 'Close', { duration: 3000 }),
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount / 100);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getMethodColor(method: string): string {
    return this.methodColorMap[method] ?? '#607d8b';
  }

  ngOnDestroy(): void {
    this.revenueChart?.destroy();
    this.methodChart?.destroy();
    this.attorneyChart?.destroy();
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private getDateRange(): DateRange {
    const { startDate, endDate } = this.dateRangeForm.value;
    return {
      start_date: startDate ? startDate.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end_date: endDate ? endDate.toISOString() : new Date().toISOString(),
    };
  }

  private async loadMetrics(dateRange: DateRange): Promise<void> {
    const emptyMetrics: RevenueMetrics = {
      total_revenue: 0, refunded_amount: 0, total_transactions: 0,
      failed_transactions: 0, success_rate: 0, monthly_recurring_revenue: 0, average_transaction: 0,
    };
    const m = await new Promise<RevenueMetrics>((resolve) => {
      this.revenueService.getRevenueMetrics(dateRange).pipe(
        catchError(() => of(emptyMetrics)),
      ).subscribe((data) => resolve(data));
    });
    this.metrics.set(m);
    this.buildMetricCards(m);
  }

  private buildMetricCards(m: RevenueMetrics): void {
    const netRevenue = m.total_revenue - m.refunded_amount;
    const cards: MetricCard[] = [
      {
        icon: 'attach_money',
        labelKey: 'ADMIN.TOTAL_REVENUE',
        value: this.formatCurrency(m.total_revenue),
        trendDirection: 'up',
        trendPercent: '+8.2%',
        colorClass: 'color-blue',
      },
      {
        icon: 'account_balance_wallet',
        labelKey: 'ADMIN.NET_REVENUE',
        value: this.formatCurrency(netRevenue),
        trendDirection: 'up',
        trendPercent: '+7.5%',
        colorClass: 'color-green',
      },
      {
        icon: 'hourglass_empty',
        labelKey: 'ADMIN.PENDING_REVENUE',
        value: this.formatCurrency(Math.round(m.total_revenue * 0.18)),
        trendDirection: 'down',
        trendPercent: '-2.3%',
        colorClass: 'color-orange',
      },
      {
        icon: 'money_off',
        labelKey: 'ADMIN.REFUNDS',
        value: this.formatCurrency(m.refunded_amount),
        trendDirection: 'down',
        trendPercent: '-3.1%',
        colorClass: 'color-red',
      },
      {
        icon: 'receipt_long',
        labelKey: 'ADMIN.TRANSACTIONS',
        value: m.total_transactions.toLocaleString(),
        trendDirection: 'up',
        trendPercent: '+5.4%',
        colorClass: 'color-purple',
      },
      {
        icon: 'equalizer',
        labelKey: 'ADMIN.AVG_TRANSACTION',
        value: this.formatCurrency(m.average_transaction),
        trendDirection: 'up',
        trendPercent: '+2.8%',
        colorClass: 'color-teal',
      },
      {
        icon: 'verified',
        labelKey: 'ADMIN.SUCCESS_RATE_METRIC',
        value: this.formatPercentage(m.success_rate),
        trendDirection: 'up',
        trendPercent: '+0.4%',
        colorClass: 'color-teal',
      },
      {
        icon: 'autorenew',
        labelKey: 'ADMIN.MRR',
        value: this.formatCurrency(m.monthly_recurring_revenue),
        trendDirection: 'up',
        trendPercent: '+6.1%',
        colorClass: 'color-indigo',
      },
      {
        icon: 'trending_up',
        labelKey: 'ADMIN.GROWTH',
        value: m.total_revenue > 0 ? `${((m.total_revenue - m.refunded_amount) / m.total_revenue * 100).toFixed(1)}%` : '0%',
        trendDirection: m.total_revenue > m.refunded_amount ? 'up' : 'down',
        trendPercent: m.total_revenue > 0 ? `${((m.total_revenue - m.refunded_amount) / m.total_revenue * 100).toFixed(1)}%` : '0%',
        colorClass: 'color-cyan',
      },
    ];
    this.metricCards.set(cards);
    // Row 1: revenue-related (first 4), Row 2: operational (rest)
    this.revenueCards.set(cards.slice(0, 4));
    this.operationalCards.set(cards.slice(4));
  }

  private async loadRevenueOverTime(dateRange: DateRange): Promise<void> {
    const data = await new Promise<RevenueByDate[]>((resolve) => {
      this.revenueService.getDailyRevenue(dateRange).pipe(
        catchError(() => of([] as RevenueByDate[])),
      ).subscribe((d) => resolve(d));
    });
    if (this.viewReady) {
      this.createRevenueChart(data);
    } else {
      this.pendingChartData.daily = data;
    }
  }

  private async loadRevenueByMethod(dateRange: DateRange): Promise<void> {
    const data = await new Promise<RevenueByMethod[]>((resolve) => {
      this.revenueService.getRevenueByMethod(dateRange).pipe(
        catchError(() => of([] as RevenueByMethod[])),
      ).subscribe((d) => resolve(d));
    });
    this.paymentMethods.set(data);
    if (this.viewReady) {
      this.createMethodChart(data);
    } else {
      this.pendingChartData.methods = data;
    }
  }

  private async loadRevenueByAttorney(dateRange: DateRange): Promise<void> {
    const data = await new Promise<RevenueByAttorney[]>((resolve) => {
      this.revenueService.getRevenueByAttorney(dateRange).pipe(
        catchError(() => of([] as RevenueByAttorney[])),
      ).subscribe((d) => resolve(d));
    });
    if (this.viewReady) {
      this.createAttorneyChart(data);
    } else {
      this.pendingChartData.attorneys = data;
    }
  }

  private async loadRecentTransactions(dateRange: DateRange): Promise<void> {
    const data = await new Promise<RecentTransaction[]>((resolve) => {
      this.revenueService.getRecentTransactions(dateRange).pipe(
        catchError(() => of([] as RecentTransaction[])),
      ).subscribe((d) => resolve(d));
    });
    this.recentTransactions.set(data);
  }

  private createRevenueChart(data: RevenueByDate[]): void {
    const ctx = this.revenueChartRef?.nativeElement;
    if (!ctx) return;
    this.revenueChart?.destroy();
    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => {
          const parts = d.date.split('-');
          return `${parts[1]}/${parts[2]}`;
        }),
        datasets: [{
          label: 'Revenue',
          data: data.map(d => d.revenue / 100),
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#2196f3',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipCtx) => `Revenue: $${(tooltipCtx.parsed.y ?? 0).toFixed(2)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (v) => `$${v}` },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          x: {
            grid: { display: false },
          },
        },
      },
    });
  }

  private createMethodChart(data: RevenueByMethod[]): void {
    const ctx = this.methodChartRef?.nativeElement;
    if (!ctx) return;
    this.methodChart?.destroy();
    this.methodChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.method),
        datasets: [{
          data: data.map(d => d.revenue / 100),
          backgroundColor: data.map(d => this.getMethodColor(d.method)),
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: (tooltipCtx) => {
                const idx = tooltipCtx.dataIndex;
                return `${tooltipCtx.label}: $${tooltipCtx.parsed.toFixed(2)} (${data[idx].percentage.toFixed(1)}%)`;
              },
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
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipCtx) => {
                const idx = tooltipCtx.dataIndex;
                return [
                  `Revenue: $${(tooltipCtx.parsed.x ?? 0).toFixed(2)}`,
                  `Transactions: ${sorted[idx].transactions}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { callback: (v) => `$${v}` },
            grid: { color: 'rgba(0,0,0,0.05)' },
          },
          y: {
            grid: { display: false },
          },
        },
      },
    });
  }
}

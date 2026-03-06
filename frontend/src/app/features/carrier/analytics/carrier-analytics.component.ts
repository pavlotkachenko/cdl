import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CarrierService, FleetAnalytics } from '../../../core/services/carrier.service';

@Component({
  selector: 'app-carrier-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe, DecimalPipe,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="analytics-page">
      <header class="page-header">
        <button mat-button (click)="goBack()" aria-label="Back to dashboard">
          <mat-icon>arrow_back</mat-icon> Dashboard
        </button>
        <h1>Fleet Analytics</h1>
        <button mat-raised-button color="accent" (click)="exportCsv()" [disabled]="exporting()">
          <mat-icon>download</mat-icon>
          {{ exporting() ? 'Exporting…' : 'Export CSV' }}
        </button>
      </header>

      @if (loading()) {
        <div class="loading" aria-busy="true"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadData()">Retry</button>
        </div>
      } @else if (data().totalCases === 0) {
        <!-- Zero-data full-page empty state -->
        <div class="zero-state" role="status">
          <mat-icon aria-hidden="true">analytics</mat-icon>
          <h2>No fleet data yet</h2>
          <p>Analytics will appear here once your drivers submit their first cases.</p>
          <button mat-raised-button color="primary" (click)="goBack()">Go to Dashboard</button>
        </div>

      } @else {

        <!-- KPI Cards -->
        <div class="kpi-grid" role="list">
          <mat-card class="kpi-card" role="listitem">
            <mat-card-content>
              <p class="kpi-value success">{{ data().successRate }}%</p>
              <p class="kpi-label">Success Rate</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" role="listitem">
            <mat-card-content>
              <p class="kpi-value">{{ data().avgResolutionDays }}</p>
              <p class="kpi-label">Avg Days to Resolve</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" role="listitem">
            <mat-card-content>
              <p class="kpi-value">{{ data().totalCases }}</p>
              <p class="kpi-label">Total Cases</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card savings" role="listitem">
            <mat-card-content>
              <p class="kpi-value savings-val">{{ data().estimatedSavings | currency:'USD':'symbol':'1.0-0' }}</p>
              <p class="kpi-label">Est. Savings</p>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Monthly Trend -->
        <mat-card class="chart-card">
          <mat-card-content>
            <h2 class="section-title">Cases — Last 6 Months</h2>
            @if (data().casesByMonth.length === 0) {
              <div class="chart-empty" role="status">
                <mat-icon aria-hidden="true">bar_chart</mat-icon>
                <p>No monthly data yet</p>
              </div>
            } @else {
              <div class="bar-chart" role="img" [attr.aria-label]="'Monthly case trend chart'">
                @for (m of data().casesByMonth; track m.month) {
                  <div class="bar-col">
                    <span class="bar-count">{{ m.count }}</span>
                    <div class="bar" [style.height.%]="barHeight(m.count)" [attr.aria-label]="m.month + ': ' + m.count + ' cases'"></div>
                    <span class="bar-label">{{ m.month }}</span>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Violation Breakdown -->
        <mat-card class="chart-card">
          <mat-card-content>
            <h2 class="section-title">Violation Types</h2>
            @if (data().violationBreakdown.length === 0) {
              <div class="chart-empty" role="status">
                <mat-icon aria-hidden="true">gavel</mat-icon>
                <p>No violations recorded</p>
              </div>
            } @else {
              <div class="violation-list">
                @for (v of data().violationBreakdown; track v.type) {
                  <div class="violation-row">
                    <span class="violation-type">{{ v.type }}</span>
                    <div class="violation-bar-wrap">
                      <div class="violation-bar" [style.width.%]="v.pct" [attr.aria-label]="v.type + ': ' + v.pct + '%'"></div>
                    </div>
                    <span class="violation-pct">{{ v.pct }}%</span>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- At-Risk Drivers -->
        @if (data().atRiskDrivers.length > 0) {
          <mat-card class="chart-card">
            <mat-card-content>
              <h2 class="section-title">At-Risk Drivers</h2>
              <div class="driver-table" role="table" aria-label="At-risk drivers">
                <div class="driver-row header-row" role="row">
                  <span role="columnheader">Driver</span>
                  <span role="columnheader">Open Cases</span>
                  <span role="columnheader">Risk</span>
                </div>
                @for (d of data().atRiskDrivers; track d.id) {
                  <div class="driver-row" role="row">
                    <span role="cell">{{ d.name }}</span>
                    <span role="cell">{{ d.openCases }}</span>
                    <span role="cell" [class]="'risk-badge risk-' + d.riskLevel">{{ d.riskLevel }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }

      }
    </div>
  `,
  styles: [`
    .analytics-page { max-width: 760px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-header h1 { margin: 0; font-size: 1.4rem; flex: 1; }
    .loading { display: flex; justify-content: center; padding: 64px; }
    .error-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px;
      color: #c62828; text-align: center; }

    /* KPI grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
    @media (min-width: 600px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
    .kpi-card mat-card-content { display: flex; flex-direction: column; align-items: center; padding: 16px; gap: 4px; }
    .kpi-value { font-size: 1.9rem; font-weight: 700; margin: 0; color: #1976d2; }
    .kpi-value.success { color: #2e7d32; }
    .kpi-value.savings-val { color: #1b5e20; font-size: 1.5rem; }
    .kpi-label { font-size: 0.78rem; color: #666; margin: 0; text-align: center; }

    /* Charts */
    .chart-card { margin-bottom: 16px; }
    .section-title { font-size: 1rem; font-weight: 600; margin: 0 0 16px; }
    .zero-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px 24px; color: #999; text-align: center; }
    .zero-state mat-icon { font-size: 56px; width: 56px; height: 56px; color: #ccc; }
    .zero-state h2 { margin: 0; font-size: 1.2rem; font-weight: 600; color: #555; }
    .zero-state p { margin: 0; font-size: 0.9rem; max-width: 300px; }
    .chart-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 24px; color: #bbb; }
    .chart-empty mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .chart-empty p { margin: 0; font-size: 0.85rem; color: #999; }

    /* Bar chart */
    .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 120px; padding-bottom: 24px; position: relative; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; }
    .bar { width: 100%; background: #1976d2; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.3s; }
    .bar-count { font-size: 0.75rem; font-weight: 600; color: #444; margin-bottom: 4px; }
    .bar-label { font-size: 0.68rem; color: #666; margin-top: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-align: center; }

    /* Violation breakdown */
    .violation-list { display: flex; flex-direction: column; gap: 10px; }
    .violation-row { display: flex; align-items: center; gap: 10px; }
    .violation-type { font-size: 0.82rem; width: 130px; flex-shrink: 0; color: #444; }
    .violation-bar-wrap { flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; }
    .violation-bar { height: 100%; background: #42a5f5; border-radius: 5px; transition: width 0.3s; }
    .violation-pct { font-size: 0.78rem; color: #666; width: 36px; text-align: right; flex-shrink: 0; }

    /* At-risk drivers */
    .driver-table { display: flex; flex-direction: column; gap: 8px; }
    .driver-row { display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: center;
      padding: 8px 12px; border-radius: 6px; font-size: 0.88rem; }
    .header-row { font-weight: 600; font-size: 0.78rem; color: #666; background: #f5f5f5; }
    .risk-badge { font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; text-transform: capitalize; }
    .risk-green { background: #e8f5e9; color: #2e7d32; }
    .risk-yellow { background: #fff8e1; color: #f57f17; }
    .risk-red { background: #ffebee; color: #c62828; }
  `],
})
export class CarrierAnalyticsComponent implements OnInit {
  private carrierService = inject(CarrierService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  error = signal('');
  exporting = signal(false);

  private analytics = signal<FleetAnalytics | null>(null);

  data = computed(() => this.analytics() ?? {
    casesByMonth: [], violationBreakdown: [], successRate: 0,
    avgResolutionDays: 0, atRiskDrivers: [], estimatedSavings: 0, totalCases: 0,
  });

  maxMonthCount = computed(() => {
    const months = this.analytics()?.casesByMonth ?? [];
    return months.length > 0 ? Math.max(...months.map(m => m.count)) : 1;
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.carrierService.getAnalytics().subscribe({
      next: (d) => { this.analytics.set(d); this.loading.set(false); },
      error: () => { this.error.set('Failed to load analytics. Please try again.'); this.loading.set(false); },
    });
  }

  barHeight(count: number): number {
    const max = this.maxMonthCount();
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  exportCsv(): void {
    this.exporting.set(true);
    this.carrierService.exportCsv().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fleet-report.csv';
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => {
        this.exporting.set(false);
        this.snackBar.open('Export failed. Please try again.', 'Close', { duration: 3000 });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/carrier/dashboard']);
  }
}

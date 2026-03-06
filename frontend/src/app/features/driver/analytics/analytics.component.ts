import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { DriverAnalyticsService, DriverAnalytics } from '../../../core/services/driver-analytics.service';

@Component({
  selector: 'app-analytics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="analytics-page">
      <header class="page-header">
        <button mat-button (click)="goBack()" aria-label="Back to dashboard">
          <mat-icon>arrow_back</mat-icon> Dashboard
        </button>
        <h1>My Analytics</h1>
      </header>

      @if (loading()) {
        <div class="loading" aria-busy="true"><mat-spinner diameter="40"></mat-spinner></div>
      } @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-raised-button color="primary" (click)="loadData()">Retry</button>
        </div>
      } @else {

        <!-- KPI cards -->
        <div class="kpi-grid" role="list">
          <mat-card class="kpi-card" role="listitem">
            <mat-card-content>
              <p class="kpi-value">{{ data().totalCases }}</p>
              <p class="kpi-label">Total Cases</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" role="listitem">
            <mat-card-content>
              <p class="kpi-value open">{{ data().openCases }}</p>
              <p class="kpi-label">Open</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" role="listitem">
            <mat-card-content>
              <p class="kpi-value resolved">{{ data().resolvedCases }}</p>
              <p class="kpi-label">Resolved</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card" role="listitem">
            <mat-card-content>
              <p class="kpi-value success">{{ data().successRate }}%</p>
              <p class="kpi-label">Success Rate</p>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Monthly trend -->
        <mat-card class="chart-card">
          <mat-card-content>
            <h2 class="section-title">Cases — Last 6 Months</h2>
            @if (data().casesByMonth.length === 0) {
              <p class="empty">No data yet.</p>
            } @else {
              <div class="bar-chart" role="img" aria-label="Monthly case trend">
                @for (m of data().casesByMonth; track m.month) {
                  <div class="bar-col">
                    <span class="bar-count">{{ m.count }}</span>
                    <div class="bar" [style.height.%]="barHeight(m.count)"
                         [attr.aria-label]="m.month + ': ' + m.count + ' cases'"></div>
                    <span class="bar-label">{{ m.month }}</span>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Violation breakdown -->
        <mat-card class="chart-card">
          <mat-card-content>
            <h2 class="section-title">Violation Types</h2>
            @if (data().violationBreakdown.length === 0) {
              <p class="empty">No violations recorded.</p>
            } @else {
              <div class="violation-list">
                @for (v of data().violationBreakdown; track v.type) {
                  <div class="violation-row">
                    <span class="violation-type">{{ v.type }}</span>
                    <div class="violation-bar-wrap">
                      <div class="violation-bar" [style.width.%]="v.pct"
                           [attr.aria-label]="v.type + ': ' + v.pct + '%'"></div>
                    </div>
                    <span class="violation-pct">{{ v.pct }}%</span>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .analytics-page { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .page-header h1 { margin: 0; font-size: 1.4rem; flex: 1; }
    .loading { display: flex; justify-content: center; padding: 64px; }
    .error-state { display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 48px; color: #c62828; text-align: center; }

    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px; }
    @media (min-width: 600px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }
    .kpi-card mat-card-content { display: flex; flex-direction: column; align-items: center; padding: 16px; gap: 4px; }
    .kpi-value { font-size: 2rem; font-weight: 700; margin: 0; color: #1976d2; }
    .kpi-value.open     { color: #f57c00; }
    .kpi-value.resolved { color: #388e3c; }
    .kpi-value.success  { color: #2e7d32; }
    .kpi-label { font-size: 0.78rem; color: #666; margin: 0; text-align: center; }

    .chart-card { margin-bottom: 16px; }
    .section-title { font-size: 1rem; font-weight: 600; margin: 0 0 16px; }
    .empty { color: #999; font-size: 0.85rem; }

    .bar-chart { display: flex; align-items: flex-end; gap: 8px; height: 120px;
      padding-bottom: 24px; position: relative; }
    .bar-col { display: flex; flex-direction: column; align-items: center; flex: 1;
      height: 100%; justify-content: flex-end; }
    .bar { width: 100%; background: #1976d2; border-radius: 4px 4px 0 0;
      min-height: 4px; transition: height 0.3s; }
    .bar-count { font-size: 0.75rem; font-weight: 600; color: #444; margin-bottom: 4px; }
    .bar-label { font-size: 0.68rem; color: #666; margin-top: 4px; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis; max-width: 100%; text-align: center; }

    .violation-list { display: flex; flex-direction: column; gap: 10px; }
    .violation-row { display: flex; align-items: center; gap: 10px; }
    .violation-type { font-size: 0.82rem; width: 130px; flex-shrink: 0; color: #444; }
    .violation-bar-wrap { flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; }
    .violation-bar { height: 100%; background: #42a5f5; border-radius: 5px; transition: width 0.3s; }
    .violation-pct { font-size: 0.78rem; color: #666; width: 36px; text-align: right; flex-shrink: 0; }
  `],
})
export class AnalyticsComponent implements OnInit {
  private analyticsService = inject(DriverAnalyticsService);
  private router = inject(Router);

  loading = signal(true);
  error   = signal('');

  private analytics = signal<DriverAnalytics | null>(null);

  data = computed(() => this.analytics() ?? {
    totalCases: 0, openCases: 0, resolvedCases: 0, successRate: 0,
    casesByMonth: [], violationBreakdown: [],
  });

  maxMonthCount = computed(() => {
    const months = this.analytics()?.casesByMonth ?? [];
    return months.length > 0 ? Math.max(...months.map(m => m.count)) : 1;
  });

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');
    this.analyticsService.getAnalytics().subscribe({
      next: (d) => { this.analytics.set(d); this.loading.set(false); },
      error: () => { this.error.set('Failed to load analytics. Please try again.'); this.loading.set(false); },
    });
  }

  barHeight(count: number): number {
    const max = this.maxMonthCount();
    return max > 0 ? Math.round((count / max) * 100) : 0;
  }

  goBack(): void { this.router.navigate(['/driver/dashboard']); }
}

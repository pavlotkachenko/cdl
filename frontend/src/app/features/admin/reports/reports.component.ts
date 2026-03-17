import {
  Component, OnInit, ChangeDetectionStrategy, signal, computed, inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecimalPipe, CurrencyPipe, LowerCasePipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, forkJoin, of } from 'rxjs';

import { AdminService, DashboardStats, PerformanceMetrics, StaffMember } from '../../../core/services/admin.service';

// ============================================
// Report Type
// ============================================

type ReportType = 'overview' | 'staff' | 'cases' | 'financial';

// ============================================
// Data Interfaces
// ============================================

interface OverviewKPI {
  key: string;
  value: number;
  format: 'number' | 'currency' | 'percent' | 'days';
  icon: string;
  color: string;
  trend: number;
}

interface ReportStaffMember {
  id: string;
  name: string;
  role: string;
  totalCases: number;
  resolved: number;
  successRate: number;
  avgResolution: number;
  satisfaction: number;
  caseBreakdown: { label: string; count: number }[];
}

interface CaseStatusItem {
  status: string;
  count: number;
  color: string;
}

interface ViolationTypeItem {
  type: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  cases: number;
  resolved: number;
  revenue: number;
}

interface FinancialMonth {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
}

// ============================================
// Status color mapping
// ============================================

const STATUS_COLORS: Record<string, string> = {
  'new': '#42a5f5',
  'assigned': '#66bb6a',
  'in_progress': '#ffa726',
  'pending_court': '#ef5350',
  'resolved': '#26a69a',
  'closed': '#78909c',
};

const PRIORITY_COLORS: Record<string, string> = {
  'urgent': '#d32f2f',
  'high': '#f57c00',
  'medium': '#fbc02d',
  'low': '#388e3c',
};

// ============================================
// Component
// ============================================

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatButtonToggleModule, MatProgressBarModule, MatProgressSpinnerModule,
    DecimalPipe, CurrencyPipe, LowerCasePipe,
    TranslateModule,
  ],
  template: `
    <div class="reports-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">assessment</mat-icon>
          <h1>{{ 'ADMIN.REPORTS_ANALYTICS' | translate }}</h1>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="printReport()" aria-label="Print report">
            <mat-icon>print</mat-icon> {{ 'ADMIN.PRINT' | translate }}
          </button>
          <button mat-stroked-button (click)="exportReport()" aria-label="Export report">
            <mat-icon>download</mat-icon> {{ 'ADMIN.EXPORT' | translate }}
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <mat-button-toggle-group
        [value]="reportType()"
        (change)="reportType.set($event.value)"
        class="report-tabs"
        aria-label="Report type">
        <mat-button-toggle value="overview">
          <mat-icon>dashboard</mat-icon>
          <span class="tab-label">{{ 'ADMIN.OVERVIEW' | translate }}</span>
        </mat-button-toggle>
        <mat-button-toggle value="staff">
          <mat-icon>group</mat-icon>
          <span class="tab-label">{{ 'ADMIN.STAFF_PERFORMANCE' | translate }}</span>
        </mat-button-toggle>
        <mat-button-toggle value="cases">
          <mat-icon>folder_open</mat-icon>
          <span class="tab-label">{{ 'ADMIN.CASE_ANALYTICS' | translate }}</span>
        </mat-button-toggle>
        <mat-button-toggle value="financial">
          <mat-icon>account_balance</mat-icon>
          <span class="tab-label">{{ 'ADMIN.FINANCIAL' | translate }}</span>
        </mat-button-toggle>
      </mat-button-toggle-group>

      <!-- Report Content -->
      @switch (reportType()) {

        <!-- ==================== OVERVIEW ==================== -->
        @case ('overview') {
          <section class="report-section" aria-label="Overview report">
            <!-- KPI Cards -->
            <div class="kpi-grid">
              @for (kpi of overviewKPIs(); track kpi.key) {
                <mat-card class="kpi-card" [style.border-left-color]="kpi.color">
                  <mat-card-content>
                    <div class="kpi-header">
                      <mat-icon [style.color]="kpi.color">{{ kpi.icon }}</mat-icon>
                      <span class="kpi-label">{{ kpi.key | translate }}</span>
                    </div>
                    <div class="kpi-value">
                      @switch (kpi.format) {
                        @case ('currency') { {{ kpi.value | currency:'USD':'symbol':'1.0-0' }} }
                        @case ('days') { {{ kpi.value | number:'1.1-1' }} {{ 'ADMIN.DAYS' | translate }} }
                        @default { {{ kpi.value | number:'1.0-0' }} }
                      }
                    </div>
                    <div class="kpi-trend" [class.positive]="kpi.trend > 0" [class.negative]="kpi.trend < 0">
                      <mat-icon>{{ kpi.trend > 0 ? 'trending_up' : 'trending_down' }}</mat-icon>
                      {{ (kpi.trend > 0 ? '+' : '') }}{{ kpi.trend | number:'1.1-1' }}%
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>

            <!-- Success Rate Card -->
            <mat-card class="success-rate-card">
              <mat-card-content>
                <h3>{{ 'ADMIN.SUCCESS_RATE' | translate }}</h3>
                <div class="success-rate-display">
                  <div class="rate-circle" [style.background]="getSuccessGradient(successRate())">
                    <span class="rate-number">{{ successRate() | number:'1.1-1' }}%</span>
                  </div>
                  <div class="rate-details">
                    <p class="rate-summary">{{ 'ADMIN.RESOLVED' | translate }}: 198 / 247 {{ 'ADMIN.TOTAL_CASES' | translate | lowercase }}</p>
                    <mat-progress-bar mode="determinate" [value]="successRate()" color="primary"></mat-progress-bar>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Monthly Trend Summary -->
            <mat-card class="trend-card">
              <mat-card-content>
                <h3>{{ 'ADMIN.MONTHLY_TRENDS' | translate }}</h3>
                <div class="mini-bar-chart">
                  @for (trend of monthlyTrends(); track trend.month) {
                    <div class="bar-group">
                      <div class="bar-container">
                        <div class="bar cases-bar" [style.height.%]="getBarHeight(trend.cases, maxTrendCases())">
                          <span class="bar-tooltip">{{ trend.cases }}</span>
                        </div>
                        <div class="bar resolved-bar" [style.height.%]="getBarHeight(trend.resolved, maxTrendCases())">
                          <span class="bar-tooltip">{{ trend.resolved }}</span>
                        </div>
                      </div>
                      <span class="bar-label">{{ trend.month }}</span>
                    </div>
                  }
                </div>
                <div class="chart-legend">
                  <span class="legend-item"><span class="legend-dot cases"></span> {{ 'ADMIN.CASES_COL' | translate }}</span>
                  <span class="legend-item"><span class="legend-dot resolved"></span> {{ 'ADMIN.RESOLVED' | translate }}</span>
                </div>
              </mat-card-content>
            </mat-card>
          </section>
        }

        <!-- ==================== STAFF PERFORMANCE ==================== -->
        @case ('staff') {
          <section class="report-section" aria-label="Staff performance report">
            @if (staffData().length === 0) {
              <mat-card>
                <mat-card-content class="empty-state">
                  <mat-icon>bar_chart</mat-icon>
                  <p>{{ 'ADMIN.NO_DATA' | translate }}</p>
                </mat-card-content>
              </mat-card>
            }

            <div class="staff-grid">
              @for (member of staffData(); track member.id) {
                <mat-card class="staff-card">
                  <mat-card-content>
                    <div class="staff-header">
                      <div class="staff-avatar" [style.background-color]="getAvatarColor(member.name)">
                        {{ getInitials(member.name) }}
                      </div>
                      <div class="staff-info">
                        <h3>{{ member.name }}</h3>
                        <span class="staff-role">{{ member.role }}</span>
                      </div>
                      <div class="staff-badge" [class]="getRateBadgeClass(member.successRate)">
                        {{ member.successRate | number:'1.1-1' }}%
                      </div>
                    </div>

                    <!-- Performance Bars -->
                    <div class="staff-metrics">
                      <div class="metric-row">
                        <span class="metric-label">{{ 'ADMIN.SUCCESS_RATE' | translate }}</span>
                        <div class="metric-bar-wrap">
                          <div class="metric-bar" [style.width.%]="member.successRate"
                               [class]="getRateBarClass(member.successRate)"></div>
                        </div>
                        <span class="metric-val">{{ member.successRate | number:'1.1-1' }}%</span>
                      </div>
                      <div class="metric-row">
                        <span class="metric-label">{{ 'ADMIN.RESOLVED' | translate }}</span>
                        <div class="metric-bar-wrap">
                          <div class="metric-bar bar-blue" [style.width.%]="(member.resolved / member.totalCases) * 100"></div>
                        </div>
                        <span class="metric-val">{{ member.resolved }}/{{ member.totalCases }}</span>
                      </div>
                      <div class="metric-row">
                        <span class="metric-label">{{ 'ADMIN.SATISFACTION' | translate }}</span>
                        <div class="star-rating">
                          @for (star of [1, 2, 3, 4, 5]; track star) {
                            <mat-icon [class.filled]="star <= member.satisfaction"
                                      [class.half]="star > member.satisfaction && star - 1 < member.satisfaction">
                              {{ star <= member.satisfaction ? 'star' : (star - 1 < member.satisfaction ? 'star_half' : 'star_border') }}
                            </mat-icon>
                          }
                          <span class="rating-num">{{ member.satisfaction | number:'1.1-1' }}</span>
                        </div>
                      </div>
                      <div class="metric-row">
                        <span class="metric-label">{{ 'ADMIN.AVG_RESOLUTION' | translate }}</span>
                        <span class="metric-val days-val">{{ member.avgResolution | number:'1.1-1' }} {{ 'ADMIN.DAYS' | translate }}</span>
                      </div>
                    </div>

                    <!-- Case Breakdown -->
                    <div class="case-breakdown">
                      <h4>{{ 'ADMIN.CASES_BY_TYPE' | translate }}</h4>
                      <div class="breakdown-bars">
                        @for (item of member.caseBreakdown; track item.label) {
                          <div class="breakdown-item">
                            <span class="breakdown-label">{{ item.label }}</span>
                            <div class="breakdown-bar-wrap">
                              <div class="breakdown-bar" [style.width.%]="(item.count / member.totalCases) * 100"
                                   [style.background-color]="getTypeColor($index)"></div>
                            </div>
                            <span class="breakdown-count">{{ item.count }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </section>
        }

        <!-- ==================== CASE ANALYTICS ==================== -->
        @case ('cases') {
          <section class="report-section" aria-label="Case analytics report">
            <!-- Cases by Status -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ADMIN.CASES_BY_STATUS' | translate }}</h3>
                <div class="status-grid">
                  @for (item of casesByStatus(); track item.status) {
                    <div class="status-stat" [style.border-top-color]="item.color">
                      <span class="stat-count" [style.color]="item.color">{{ item.count }}</span>
                      <span class="stat-label">{{ item.status }}</span>
                      <div class="stat-bar">
                        <div class="stat-bar-fill" [style.width.%]="(item.count / totalCasesCount()) * 100"
                             [style.background-color]="item.color"></div>
                      </div>
                      <span class="stat-pct">{{ ((item.count / totalCasesCount()) * 100) | number:'1.1-1' }}%</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Cases by Violation Type -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ADMIN.CASES_BY_TYPE' | translate }}</h3>
                <div class="type-list">
                  @for (item of casesByType(); track item.type) {
                    <div class="type-row">
                      <span class="type-name">{{ item.type }}</span>
                      <div class="type-bar-wrap">
                        <div class="type-bar" [style.width.%]="(item.count / maxTypeCount()) * 100"
                             [style.background-color]="getTypeColor($index)"></div>
                      </div>
                      <span class="type-count">{{ item.count }}</span>
                      <span class="type-pct">{{ ((item.count / totalViolations()) * 100) | number:'1.0-0' }}%</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Cases by Priority -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ADMIN.CASES_BY_PRIORITY' | translate }}</h3>
                <div class="priority-grid">
                  @for (item of casesByPriority(); track item.priority) {
                    <div class="priority-card" [style.border-left-color]="item.color">
                      <div class="priority-count" [style.color]="item.color">{{ item.count }}</div>
                      <div class="priority-label">{{ item.priority }}</div>
                      <mat-progress-bar mode="determinate" [value]="(item.count / totalPriority()) * 100"></mat-progress-bar>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Monthly Trends Table -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ADMIN.MONTHLY_TRENDS' | translate }}</h3>
                <table class="data-table" aria-label="Monthly case trends">
                  <thead>
                    <tr>
                      <th>{{ 'ADMIN.MONTH' | translate }}</th>
                      <th>{{ 'ADMIN.CASES_COL' | translate }}</th>
                      <th>{{ 'ADMIN.RESOLVED' | translate }}</th>
                      <th>{{ 'ADMIN.RATE_COL' | translate }}</th>
                      <th>{{ 'ADMIN.REVENUE_COL' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of monthlyTrends(); track row.month) {
                      <tr>
                        <td>{{ row.month }}</td>
                        <td>{{ row.cases }}</td>
                        <td>{{ row.resolved }}</td>
                        <td>
                          <span class="inline-rate" [class]="getRateBadgeClass((row.resolved / row.cases) * 100)">
                            {{ ((row.resolved / row.cases) * 100) | number:'1.0-0' }}%
                          </span>
                        </td>
                        <td>{{ row.revenue | currency:'USD':'symbol':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </mat-card-content>
            </mat-card>
          </section>
        }

        <!-- ==================== FINANCIAL ==================== -->
        @case ('financial') {
          <section class="report-section" aria-label="Financial report">
            <!-- Financial KPI Cards -->
            <div class="kpi-grid">
              <mat-card class="kpi-card" style="border-left-color: #1976d2">
                <mat-card-content>
                  <div class="kpi-header">
                    <mat-icon style="color: #1976d2">payments</mat-icon>
                    <span class="kpi-label">{{ 'ADMIN.TOTAL_REVENUE' | translate }}</span>
                  </div>
                  <div class="kpi-value">{{ financialSummary().totalRevenue | currency:'USD':'symbol':'1.0-0' }}</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="kpi-card" style="border-left-color: #f57c00">
                <mat-card-content>
                  <div class="kpi-header">
                    <mat-icon style="color: #f57c00">pending_actions</mat-icon>
                    <span class="kpi-label">{{ 'ADMIN.OUTSTANDING' | translate }}</span>
                  </div>
                  <div class="kpi-value">{{ financialSummary().outstanding | currency:'USD':'symbol':'1.0-0' }}</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="kpi-card" style="border-left-color: #388e3c">
                <mat-card-content>
                  <div class="kpi-header">
                    <mat-icon style="color: #388e3c">price_check</mat-icon>
                    <span class="kpi-label">{{ 'ADMIN.COLLECTED' | translate }}</span>
                  </div>
                  <div class="kpi-value">{{ financialSummary().collected | currency:'USD':'symbol':'1.0-0' }}</div>
                </mat-card-content>
              </mat-card>
              <mat-card class="kpi-card" style="border-left-color: #7b1fa2">
                <mat-card-content>
                  <div class="kpi-header">
                    <mat-icon style="color: #7b1fa2">receipt_long</mat-icon>
                    <span class="kpi-label">{{ 'ADMIN.AVG_CASE_VALUE' | translate }}</span>
                  </div>
                  <div class="kpi-value">{{ financialSummary().avgCaseValue | currency:'USD':'symbol':'1.0-0' }}</div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Revenue vs Costs Bar Chart -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ADMIN.MONTHLY_TRENDS' | translate }}</h3>
                <div class="financial-chart">
                  @for (fm of financialMonths(); track fm.month) {
                    <div class="fin-bar-group">
                      <div class="fin-bars">
                        <div class="fin-bar revenue-bar" [style.height.%]="getBarHeight(fm.revenue, maxFinRevenue())">
                          <span class="bar-tooltip">{{ fm.revenue | currency:'USD':'symbol':'1.0-0' }}</span>
                        </div>
                        <div class="fin-bar cost-bar" [style.height.%]="getBarHeight(fm.costs, maxFinRevenue())">
                          <span class="bar-tooltip">{{ fm.costs | currency:'USD':'symbol':'1.0-0' }}</span>
                        </div>
                        <div class="fin-bar profit-bar" [style.height.%]="getBarHeight(fm.profit, maxFinRevenue())">
                          <span class="bar-tooltip">{{ fm.profit | currency:'USD':'symbol':'1.0-0' }}</span>
                        </div>
                      </div>
                      <span class="bar-label">{{ fm.month }}</span>
                    </div>
                  }
                </div>
                <div class="chart-legend">
                  <span class="legend-item"><span class="legend-dot revenue"></span> {{ 'ADMIN.TOTAL_REVENUE' | translate }}</span>
                  <span class="legend-item"><span class="legend-dot costs"></span> Costs</span>
                  <span class="legend-item"><span class="legend-dot profit"></span> Profit</span>
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Financial Table -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <table class="data-table" aria-label="Monthly financial breakdown">
                  <thead>
                    <tr>
                      <th>{{ 'ADMIN.MONTH' | translate }}</th>
                      <th>{{ 'ADMIN.REVENUE_COL' | translate }}</th>
                      <th>Costs</th>
                      <th>Profit</th>
                      <th>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (fm of financialMonths(); track fm.month) {
                      <tr>
                        <td>{{ fm.month }}</td>
                        <td class="text-green">{{ fm.revenue | currency:'USD':'symbol':'1.0-0' }}</td>
                        <td class="text-red">{{ fm.costs | currency:'USD':'symbol':'1.0-0' }}</td>
                        <td class="text-bold">{{ fm.profit | currency:'USD':'symbol':'1.0-0' }}</td>
                        <td>
                          <span class="inline-rate rate-high">
                            {{ ((fm.profit / fm.revenue) * 100) | number:'1.0-0' }}%
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="totals-row">
                      <td><strong>Total</strong></td>
                      <td class="text-green"><strong>{{ totalFinRevenue() | currency:'USD':'symbol':'1.0-0' }}</strong></td>
                      <td class="text-red"><strong>{{ totalFinCosts() | currency:'USD':'symbol':'1.0-0' }}</strong></td>
                      <td class="text-bold"><strong>{{ totalFinProfit() | currency:'USD':'symbol':'1.0-0' }}</strong></td>
                      <td>
                        <span class="inline-rate rate-high">
                          <strong>{{ ((totalFinProfit() / totalFinRevenue()) * 100) | number:'1.0-0' }}%</strong>
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </mat-card-content>
            </mat-card>

            <!-- Collection Rate Progress -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ADMIN.COLLECTED' | translate }} {{ 'ADMIN.RATE_COL' | translate }}</h3>
                <div class="collection-rate">
                  <div class="collection-bar-track">
                    <div class="collection-bar-fill" [style.width.%]="collectionRate()"></div>
                  </div>
                  <div class="collection-labels">
                    <span>{{ 'ADMIN.COLLECTED' | translate }}: {{ financialSummary().collected | currency:'USD':'symbol':'1.0-0' }}</span>
                    <span>{{ 'ADMIN.OUTSTANDING' | translate }}: {{ financialSummary().outstanding | currency:'USD':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="collection-pct">{{ collectionRate() | number:'1.1-1' }}%</div>
                </div>
              </mat-card-content>
            </mat-card>
          </section>
        }
      }
    </div>
  `,
  styles: `
    /* ==================== Layout ==================== */
    .reports-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-title h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #1976d2;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    /* ==================== Tabs ==================== */
    .report-tabs {
      margin-bottom: 24px;
      width: 100%;
    }

    .report-tabs .mat-button-toggle {
      flex: 1;
    }

    .tab-label {
      margin-left: 8px;
    }

    .report-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    /* ==================== KPI Cards ==================== */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      border-left: 4px solid;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }

    .kpi-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .kpi-label {
      font-size: 13px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .kpi-trend {
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .kpi-trend mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .kpi-trend.positive {
      color: #388e3c;
    }

    .kpi-trend.negative {
      color: #d32f2f;
    }

    /* ==================== Success Rate ==================== */
    .success-rate-card h3 {
      margin: 0 0 16px;
      font-size: 18px;
      font-weight: 500;
    }

    .success-rate-display {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .rate-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .rate-number {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }

    .rate-details {
      flex: 1;
    }

    .rate-summary {
      margin: 0 0 12px;
      color: #555;
    }

    /* ==================== Mini Bar Chart ==================== */
    .trend-card h3 {
      margin: 0 0 16px;
      font-size: 18px;
      font-weight: 500;
    }

    .mini-bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 180px;
      padding: 0 8px;
    }

    .bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    .bar-container {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: 4px;
      width: 100%;
      justify-content: center;
    }

    .bar {
      width: 24px;
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: height 0.3s ease;
      min-height: 4px;
      cursor: default;
    }

    .bar:hover .bar-tooltip {
      opacity: 1;
    }

    .bar-tooltip {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    .cases-bar {
      background: #42a5f5;
    }

    .resolved-bar {
      background: #66bb6a;
    }

    .bar-label {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
    }

    .chart-legend {
      display: flex;
      gap: 24px;
      justify-content: center;
      margin-top: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #555;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
    }

    .legend-dot.cases {
      background: #42a5f5;
    }

    .legend-dot.resolved {
      background: #66bb6a;
    }

    .legend-dot.revenue {
      background: #1976d2;
    }

    .legend-dot.costs {
      background: #ef5350;
    }

    .legend-dot.profit {
      background: #66bb6a;
    }

    /* ==================== Staff Cards ==================== */
    .staff-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 20px;
    }

    .staff-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .staff-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }

    .staff-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .staff-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .staff-info {
      flex: 1;
    }

    .staff-info h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .staff-role {
      font-size: 13px;
      color: #888;
    }

    .staff-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 14px;
    }

    .staff-badge.rate-high {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .staff-badge.rate-mid {
      background: #fff3e0;
      color: #ef6c00;
    }

    .staff-badge.rate-low {
      background: #fce4ec;
      color: #c62828;
    }

    .staff-metrics {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .metric-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .metric-row .metric-label {
      width: 110px;
      font-size: 13px;
      color: #666;
      flex-shrink: 0;
    }

    .metric-bar-wrap {
      flex: 1;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .metric-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .metric-bar.bar-green {
      background: #66bb6a;
    }

    .metric-bar.bar-orange {
      background: #ffa726;
    }

    .metric-bar.bar-red {
      background: #ef5350;
    }

    .metric-bar.bar-blue {
      background: #42a5f5;
    }

    .metric-val {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      width: 70px;
      text-align: right;
      flex-shrink: 0;
    }

    .days-val {
      width: auto;
    }

    .star-rating {
      display: flex;
      align-items: center;
      gap: 2px;
      flex: 1;
    }

    .star-rating mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #ccc;
    }

    .star-rating mat-icon.filled,
    .star-rating mat-icon.half {
      color: #ffc107;
    }

    .rating-num {
      margin-left: 8px;
      font-weight: 600;
      font-size: 13px;
      color: #333;
    }

    .case-breakdown {
      border-top: 1px solid #eee;
      padding-top: 16px;
    }

    .case-breakdown h4 {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .breakdown-bars {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .breakdown-label {
      width: 80px;
      font-size: 12px;
      color: #666;
      flex-shrink: 0;
    }

    .breakdown-bar-wrap {
      flex: 1;
      height: 6px;
      background: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .breakdown-bar {
      height: 100%;
      border-radius: 3px;
      transition: width 0.4s ease;
    }

    .breakdown-count {
      font-size: 12px;
      font-weight: 600;
      color: #444;
      width: 28px;
      text-align: right;
    }

    /* ==================== Analytics Cards ==================== */
    .analytics-card h3 {
      margin: 0 0 20px;
      font-size: 18px;
      font-weight: 500;
    }

    /* Status Grid */
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
    }

    .status-stat {
      padding: 16px;
      border-top: 3px solid;
      background: #fafafa;
      border-radius: 0 0 8px 8px;
      text-align: center;
    }

    .stat-count {
      font-size: 36px;
      font-weight: 700;
      display: block;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
      display: block;
      margin: 4px 0 12px;
    }

    .stat-bar {
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .stat-bar-fill {
      height: 100%;
      border-radius: 2px;
    }

    .stat-pct {
      font-size: 12px;
      color: #888;
    }

    /* Type List */
    .type-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .type-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .type-name {
      width: 180px;
      font-size: 14px;
      color: #333;
      flex-shrink: 0;
    }

    .type-bar-wrap {
      flex: 1;
      height: 20px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .type-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .type-count {
      font-size: 14px;
      font-weight: 700;
      color: #333;
      width: 36px;
      text-align: right;
    }

    .type-pct {
      font-size: 13px;
      color: #888;
      width: 36px;
      text-align: right;
    }

    /* Priority Grid */
    .priority-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .priority-card {
      padding: 20px;
      background: #fafafa;
      border-left: 4px solid;
      border-radius: 0 8px 8px 0;
    }

    .priority-count {
      font-size: 36px;
      font-weight: 700;
    }

    .priority-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
    }

    /* ==================== Data Table ==================== */
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e0e0e0;
      background: #fafafa;
    }

    .data-table td {
      padding: 12px 16px;
      font-size: 14px;
      color: #333;
      border-bottom: 1px solid #eee;
    }

    .data-table tbody tr:hover {
      background: #f5f9ff;
    }

    .data-table tfoot td {
      border-top: 2px solid #e0e0e0;
      border-bottom: none;
      background: #fafafa;
    }

    .totals-row td {
      font-size: 15px;
    }

    .inline-rate {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .inline-rate.rate-high {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .inline-rate.rate-mid {
      background: #fff3e0;
      color: #ef6c00;
    }

    .inline-rate.rate-low {
      background: #fce4ec;
      color: #c62828;
    }

    .text-green {
      color: #2e7d32;
    }

    .text-red {
      color: #c62828;
    }

    .text-bold {
      font-weight: 700;
    }

    /* ==================== Financial Chart ==================== */
    .financial-chart {
      display: flex;
      align-items: flex-end;
      gap: 20px;
      height: 200px;
      padding: 0 8px;
    }

    .fin-bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    .fin-bars {
      flex: 1;
      display: flex;
      align-items: flex-end;
      gap: 3px;
      width: 100%;
      justify-content: center;
    }

    .fin-bar {
      width: 20px;
      border-radius: 3px 3px 0 0;
      position: relative;
      transition: height 0.3s ease;
      min-height: 4px;
      cursor: default;
    }

    .fin-bar:hover .bar-tooltip {
      opacity: 1;
    }

    .revenue-bar {
      background: #1976d2;
    }

    .cost-bar {
      background: #ef5350;
    }

    .profit-bar {
      background: #66bb6a;
    }

    /* ==================== Collection Rate ==================== */
    .collection-rate {
      text-align: center;
    }

    .collection-bar-track {
      height: 32px;
      background: #fce4ec;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 12px;
    }

    .collection-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #66bb6a, #388e3c);
      border-radius: 16px;
      transition: width 0.6s ease;
    }

    .collection-labels {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }

    .collection-pct {
      font-size: 28px;
      font-weight: 700;
      color: #388e3c;
    }

    /* ==================== Empty State ==================== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    /* ==================== Responsive ==================== */
    @media (max-width: 768px) {
      .reports-page {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .tab-label {
        display: none;
      }

      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .kpi-value {
        font-size: 24px;
      }

      .staff-grid {
        grid-template-columns: 1fr;
      }

      .status-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .priority-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .type-name {
        width: 100px;
      }

      .success-rate-display {
        flex-direction: column;
      }

      .data-table {
        font-size: 12px;
      }

      .data-table th,
      .data-table td {
        padding: 8px;
      }
    }

    @media (max-width: 480px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .status-grid {
        grid-template-columns: 1fr;
      }

      .priority-grid {
        grid-template-columns: 1fr;
      }

      .header-actions {
        flex-wrap: wrap;
      }
    }
  `,
})
export class ReportsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  // ==================== State ====================
  reportType = signal<ReportType>('overview');
  loading = signal(false);

  // ==================== Data Signals ====================
  overviewKPIs = signal<OverviewKPI[]>([]);
  successRate = signal(0);
  staffData = signal<ReportStaffMember[]>([]);
  casesByStatus = signal<CaseStatusItem[]>([]);
  casesByType = signal<ViolationTypeItem[]>([]);
  casesByPriority = signal<{ priority: string; count: number; color: string }[]>([]);
  monthlyTrends = signal<MonthlyTrend[]>([]);
  financialMonths = signal<FinancialMonth[]>([]);
  financialSummary = signal({ totalRevenue: 0, outstanding: 0, collected: 0, avgCaseValue: 0 });

  // ==================== Computed ====================
  totalCasesCount = computed(() =>
    this.casesByStatus().reduce((sum, s) => sum + s.count, 0)
  );

  maxTypeCount = computed(() =>
    Math.max(...this.casesByType().map(t => t.count))
  );

  totalViolations = computed(() =>
    this.casesByType().reduce((sum, t) => sum + t.count, 0)
  );

  totalPriority = computed(() =>
    this.casesByPriority().reduce((sum, p) => sum + p.count, 0)
  );

  maxTrendCases = computed(() =>
    Math.max(...this.monthlyTrends().map(t => t.cases))
  );

  maxFinRevenue = computed(() =>
    Math.max(...this.financialMonths().map(f => f.revenue))
  );

  totalFinRevenue = computed(() =>
    this.financialMonths().reduce((sum, f) => sum + f.revenue, 0)
  );

  totalFinCosts = computed(() =>
    this.financialMonths().reduce((sum, f) => sum + f.costs, 0)
  );

  totalFinProfit = computed(() =>
    this.financialMonths().reduce((sum, f) => sum + f.profit, 0)
  );

  collectionRate = computed(() =>
    (this.financialSummary().collected / (this.financialSummary().collected + this.financialSummary().outstanding)) * 100
  );

  // ==================== Lifecycle ====================
  ngOnInit(): void {
    this.loadReportData();
  }

  loadReportData(): void {
    this.loading.set(true);
    forkJoin({
      stats: this.adminService.getDashboardStats().pipe(catchError(() => of(null))),
      performance: this.adminService.getStaffPerformance().pipe(catchError(() => of([] as PerformanceMetrics[]))),
      staff: this.adminService.getAllStaff().pipe(catchError(() => of([] as StaffMember[]))),
    }).subscribe({
      next: ({ stats, performance, staff }) => {
        if (stats) {
          this.buildOverviewFromStats(stats);
          this.buildCaseAnalyticsFromStats(stats);
          this.buildFinancialFromStats(stats);
        }
        this.buildStaffData(performance, staff);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private buildOverviewFromStats(stats: DashboardStats): void {
    const totalCases = stats.totalCases || 0;
    const resolved = stats.resolvedCases || 0;
    const rate = totalCases > 0 ? (resolved / totalCases) * 100 : 0;

    this.overviewKPIs.set([
      { key: 'ADMIN.TOTAL_CASES', value: totalCases, format: 'number', icon: 'folder', color: '#1976d2', trend: stats.casesThisWeek > stats.casesLastWeek ? ((stats.casesThisWeek - stats.casesLastWeek) / (stats.casesLastWeek || 1)) * 100 : 0 },
      { key: 'ADMIN.RESOLVED', value: resolved, format: 'number', icon: 'check_circle', color: '#388e3c', trend: 0 },
      { key: 'ADMIN.AVG_RESOLUTION', value: stats.avgResolutionTime || 0, format: 'days', icon: 'schedule', color: '#f57c00', trend: 0 },
      { key: 'ADMIN.REVENUE_TOTAL', value: stats.revenueThisMonth || 0, format: 'currency', icon: 'attach_money', color: '#7b1fa2', trend: stats.revenueLastMonth > 0 ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100 : 0 },
    ]);
    this.successRate.set(parseFloat(rate.toFixed(1)));
  }

  private buildCaseAnalyticsFromStats(stats: DashboardStats): void {
    const statusItems: CaseStatusItem[] = [];
    if (stats.activeCases) statusItems.push({ status: 'Active', count: stats.activeCases, color: STATUS_COLORS['in_progress'] || '#ffa726' });
    if (stats.pendingCases) statusItems.push({ status: 'Pending', count: stats.pendingCases, color: STATUS_COLORS['pending_court'] || '#ef5350' });
    if (stats.resolvedCases) statusItems.push({ status: 'Resolved', count: stats.resolvedCases, color: STATUS_COLORS['resolved'] || '#26a69a' });
    const otherCases = stats.totalCases - (stats.activeCases || 0) - (stats.pendingCases || 0) - (stats.resolvedCases || 0);
    if (otherCases > 0) statusItems.push({ status: 'Other', count: otherCases, color: STATUS_COLORS['closed'] || '#78909c' });
    this.casesByStatus.set(statusItems);
  }

  private buildFinancialFromStats(stats: DashboardStats): void {
    const thisMonth = stats.revenueThisMonth || 0;
    const lastMonth = stats.revenueLastMonth || 0;
    const totalRev = thisMonth + lastMonth;
    const estimatedCosts = Math.round(totalRev * 0.6);
    const profit = totalRev - estimatedCosts;

    this.financialSummary.set({
      totalRevenue: totalRev,
      outstanding: Math.round(totalRev * 0.14),
      collected: Math.round(totalRev * 0.86),
      avgCaseValue: stats.totalCases > 0 ? Math.round(totalRev / stats.totalCases) : 0,
    });

    if (thisMonth > 0 || lastMonth > 0) {
      const now = new Date();
      const months: FinancialMonth[] = [];
      if (lastMonth > 0) {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastCosts = Math.round(lastMonth * 0.6);
        months.push({
          month: lastMonthDate.toLocaleString('en', { month: 'short' }),
          revenue: lastMonth,
          costs: lastCosts,
          profit: lastMonth - lastCosts,
        });
      }
      if (thisMonth > 0) {
        const thisCosts = Math.round(thisMonth * 0.6);
        months.push({
          month: now.toLocaleString('en', { month: 'short' }),
          revenue: thisMonth,
          costs: thisCosts,
          profit: thisMonth - thisCosts,
        });
      }
      this.financialMonths.set(months);
    }
  }

  private buildStaffData(performance: PerformanceMetrics[], staff: StaffMember[]): void {
    if (performance.length > 0) {
      this.staffData.set(performance.map(p => ({
        id: p.staffId,
        name: p.staffName,
        role: staff.find(s => s.id === p.staffId)?.role || 'Staff',
        totalCases: p.totalCases,
        resolved: p.resolvedCases,
        successRate: p.successRate,
        avgResolution: p.avgResolutionTime,
        satisfaction: p.clientSatisfaction,
        caseBreakdown: (p.casesByType || []).map(t => ({ label: t.type, count: t.count })),
      })));
    } else if (staff.length > 0) {
      this.staffData.set(staff.map(s => ({
        id: s.id,
        name: s.name,
        role: s.role,
        totalCases: s.totalCases,
        resolved: Math.round(s.totalCases * s.successRate / 100),
        successRate: s.successRate,
        avgResolution: s.avgResolutionTime,
        satisfaction: 0,
        caseBreakdown: [],
      })));
    }
  }

  // ==================== Methods ====================
  printReport(): void {
    window.print();
  }

  exportReport(): void {
    window.print();
  }

  getBarHeight(value: number, max: number): number {
    if (max === 0) return 0;
    return (value / max) * 100;
  }

  getSuccessGradient(rate: number): string {
    if (rate >= 85) return 'linear-gradient(135deg, #66bb6a, #388e3c)';
    if (rate >= 70) return 'linear-gradient(135deg, #ffa726, #f57c00)';
    return 'linear-gradient(135deg, #ef5350, #c62828)';
  }

  getRateBadgeClass(rate: number): string {
    if (rate >= 85) return 'rate-high';
    if (rate >= 70) return 'rate-mid';
    return 'rate-low';
  }

  getRateBarClass(rate: number): string {
    if (rate >= 85) return 'metric-bar bar-green';
    if (rate >= 70) return 'metric-bar bar-orange';
    return 'metric-bar bar-red';
  }

  getAvatarColor(name: string): string {
    const colors = ['#1976d2', '#388e3c', '#7b1fa2', '#f57c00', '#c62828', '#00838f'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getTypeColor(index: number): string {
    const palette = ['#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#ef5350', '#26a69a', '#78909c'];
    return palette[index % palette.length];
  }
}

import {
  Component, ChangeDetectionStrategy, signal, computed,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { DecimalPipe, CurrencyPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

// ============================================
// Report Type
// ============================================

type ReportType = 'performance' | 'cases' | 'revenue' | 'clients';

// ============================================
// Interfaces
// ============================================

interface PerformanceKPI {
  key: string;
  value: number;
  format: 'number' | 'percent' | 'days';
  icon: string;
  color: string;
}

interface MonthlyPerformance {
  month: string;
  cases: number;
  won: number;
  lost: number;
  winRate: number;
}

interface ResolutionTrend {
  month: string;
  days: number;
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

interface StateItem {
  state: string;
  count: number;
}

interface RevenueKPI {
  key: string;
  value: number;
  icon: string;
  color: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  cases: number;
}

interface TopClient {
  name: string;
  cases: number;
  revenue: number;
}

// ============================================
// Mock Data
// ============================================

const MOCK_PERFORMANCE_KPIS: PerformanceKPI[] = [
  { key: 'ATT.CASES_WON', value: 47, format: 'number', icon: 'emoji_events', color: '#388e3c' },
  { key: 'ATT.CASES_LOST', value: 6, format: 'number', icon: 'cancel', color: '#c62828' },
  { key: 'ATT.WIN_RATE', value: 88.7, format: 'percent', icon: 'trending_up', color: '#1976d2' },
  { key: 'ATT.AVG_RESOLUTION', value: 12.4, format: 'days', icon: 'schedule', color: '#f57c00' },
];

const MOCK_MONTHLY_PERFORMANCE: MonthlyPerformance[] = [
  { month: 'Oct 2025', cases: 9, won: 8, lost: 1, winRate: 88.9 },
  { month: 'Nov 2025', cases: 11, won: 10, lost: 1, winRate: 90.9 },
  { month: 'Dec 2025', cases: 7, won: 6, lost: 1, winRate: 85.7 },
  { month: 'Jan 2026', cases: 10, won: 9, lost: 1, winRate: 90.0 },
  { month: 'Feb 2026', cases: 8, won: 7, lost: 1, winRate: 87.5 },
  { month: 'Mar 2026', cases: 8, won: 7, lost: 1, winRate: 87.5 },
];

const MOCK_RESOLUTION_TREND: ResolutionTrend[] = [
  { month: 'Oct', days: 14.2 },
  { month: 'Nov', days: 13.8 },
  { month: 'Dec', days: 15.1 },
  { month: 'Jan', days: 11.9 },
  { month: 'Feb', days: 10.7 },
  { month: 'Mar', days: 12.4 },
];

const MOCK_CASES_BY_STATUS: CaseStatusItem[] = [
  { status: 'New', count: 5, color: '#42a5f5' },
  { status: 'In Progress', count: 12, color: '#ffa726' },
  { status: 'Pending Court', count: 8, color: '#ef5350' },
  { status: 'Won', count: 47, color: '#66bb6a' },
  { status: 'Lost', count: 6, color: '#78909c' },
];

const MOCK_CASES_BY_TYPE: ViolationTypeItem[] = [
  { type: 'Speeding', count: 28 },
  { type: 'Improper Lane Change', count: 14 },
  { type: 'Following Too Closely', count: 11 },
  { type: 'Overweight', count: 9 },
  { type: 'Log Book Violation', count: 7 },
  { type: 'Equipment Violation', count: 5 },
];

const MOCK_CASES_BY_STATE: StateItem[] = [
  { state: 'Texas', count: 22 },
  { state: 'California', count: 18 },
  { state: 'Florida', count: 14 },
  { state: 'Illinois', count: 11 },
  { state: 'Georgia', count: 8 },
];

const MOCK_REVENUE_KPIS: RevenueKPI[] = [
  { key: 'ATT.TOTAL_REVENUE', value: 67450, icon: 'payments', color: '#1976d2' },
  { key: 'ATT.AVG_CASE_VALUE', value: 1275, icon: 'receipt_long', color: '#7b1fa2' },
  { key: 'ATT.OUTSTANDING', value: 8200, icon: 'pending_actions', color: '#f57c00' },
  { key: 'ATT.COLLECTED', value: 59250, icon: 'price_check', color: '#388e3c' },
];

const MOCK_MONTHLY_REVENUE: MonthlyRevenue[] = [
  { month: 'Oct 2025', revenue: 9800, cases: 9 },
  { month: 'Nov 2025', revenue: 12650, cases: 11 },
  { month: 'Dec 2025', revenue: 8400, cases: 7 },
  { month: 'Jan 2026', revenue: 13200, cases: 10 },
  { month: 'Feb 2026', revenue: 11400, cases: 8 },
  { month: 'Mar 2026', revenue: 12000, cases: 8 },
];

const MOCK_TOP_CLIENTS: TopClient[] = [
  { name: 'James Kowalski', cases: 5, revenue: 6375 },
  { name: 'Miguel Rivera', cases: 4, revenue: 5100 },
  { name: 'Lisa Chen', cases: 3, revenue: 3825 },
  { name: 'David Park', cases: 3, revenue: 3600 },
  { name: 'Sarah Thompson', cases: 2, revenue: 2550 },
];

// ============================================
// Component
// ============================================

@Component({
  selector: 'app-attorney-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatButtonToggleModule,
    DecimalPipe, CurrencyPipe,
    TranslateModule,
  ],
  template: `
    <div class="reports-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">assessment</mat-icon>
          <h1>{{ 'ATT.REPORTS_ANALYTICS' | translate }}</h1>
        </div>
        <div class="header-actions">
          <button mat-stroked-button (click)="printReport()" aria-label="Print report">
            <mat-icon>print</mat-icon> {{ 'ATT.PRINT' | translate }}
          </button>
        </div>
      </div>

      <!-- Tab Navigation -->
      <mat-button-toggle-group
        [value]="reportType()"
        (change)="reportType.set($event.value)"
        class="report-tabs"
        aria-label="Report type">
        <mat-button-toggle value="performance">
          <mat-icon>speed</mat-icon>
          <span class="tab-label">{{ 'ATT.PERFORMANCE' | translate }}</span>
        </mat-button-toggle>
        <mat-button-toggle value="cases">
          <mat-icon>folder_open</mat-icon>
          <span class="tab-label">{{ 'ATT.CASE_ANALYTICS' | translate }}</span>
        </mat-button-toggle>
        <mat-button-toggle value="revenue">
          <mat-icon>attach_money</mat-icon>
          <span class="tab-label">{{ 'ATT.REVENUE' | translate }}</span>
        </mat-button-toggle>
        <mat-button-toggle value="clients">
          <mat-icon>people</mat-icon>
          <span class="tab-label">{{ 'ATT.CLIENT_INSIGHTS' | translate }}</span>
        </mat-button-toggle>
      </mat-button-toggle-group>

      <!-- Report Content -->
      @switch (reportType()) {

        <!-- ==================== PERFORMANCE ==================== -->
        @case ('performance') {
          <section class="report-section" aria-label="Performance report">
            <!-- KPI Cards -->
            <div class="kpi-grid">
              @for (kpi of performanceKPIs(); track kpi.key) {
                <mat-card class="kpi-card" [style.border-left-color]="kpi.color">
                  <mat-card-content>
                    <div class="kpi-header">
                      <mat-icon [style.color]="kpi.color">{{ kpi.icon }}</mat-icon>
                      <span class="kpi-label">{{ kpi.key | translate }}</span>
                    </div>
                    <div class="kpi-value">
                      @switch (kpi.format) {
                        @case ('percent') { {{ kpi.value | number:'1.1-1' }}% }
                        @case ('days') { {{ kpi.value | number:'1.1-1' }} {{ 'ATT.DAYS' | translate }} }
                        @default { {{ kpi.value | number:'1.0-0' }} }
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>

            <!-- Monthly Performance Table -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ATT.MONTHLY_PERFORMANCE' | translate }}</h3>
                <table class="data-table" aria-label="Monthly performance breakdown">
                  <thead>
                    <tr>
                      <th>{{ 'ATT.MONTH' | translate }}</th>
                      <th>{{ 'ATT.CASES_COL' | translate }}</th>
                      <th>{{ 'ATT.WON_COL' | translate }}</th>
                      <th>{{ 'ATT.LOST_COL' | translate }}</th>
                      <th>{{ 'ATT.WIN_RATE_COL' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of monthlyPerformance(); track row.month) {
                      <tr>
                        <td>{{ row.month }}</td>
                        <td>{{ row.cases }}</td>
                        <td class="text-green">{{ row.won }}</td>
                        <td class="text-red">{{ row.lost }}</td>
                        <td>
                          <span class="inline-rate" [class]="getRateBadgeClass(row.winRate)">
                            {{ row.winRate | number:'1.1-1' }}%
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </mat-card-content>
            </mat-card>

            <!-- Resolution Time Trend (CSS bar chart) -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ATT.RESOLUTION_TIME_TREND' | translate }}</h3>
                <div class="resolution-chart">
                  @for (item of resolutionTrend(); track item.month) {
                    <div class="resolution-bar-group">
                      <div class="resolution-bar-container">
                        <div class="resolution-bar"
                             [style.height.%]="getBarHeight(item.days, maxResolutionDays())"
                             [style.background]="getResolutionBarColor(item.days)">
                          <span class="bar-tooltip">{{ item.days | number:'1.1-1' }}d</span>
                        </div>
                      </div>
                      <span class="bar-label">{{ item.month }}</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </section>
        }

        <!-- ==================== CASE ANALYTICS ==================== -->
        @case ('cases') {
          <section class="report-section" aria-label="Case analytics report">
            <!-- Cases by Status (horizontal bars) -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ATT.CASES_BY_STATUS' | translate }}</h3>
                <div class="status-list">
                  @for (item of casesByStatus(); track item.status) {
                    <div class="status-row">
                      <span class="status-name">{{ item.status }}</span>
                      <div class="status-bar-wrap">
                        <div class="status-bar" [style.width.%]="(item.count / maxStatusCount()) * 100"
                             [style.background-color]="item.color"></div>
                      </div>
                      <span class="status-count" [style.color]="item.color">{{ item.count }}</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <!-- Cases by Violation Type (bar visualization) -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ATT.CASES_BY_VIOLATION' | translate }}</h3>
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

            <!-- Cases by State (top 5) -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ATT.CASES_BY_STATE' | translate }}</h3>
                <div class="state-list">
                  @for (item of casesByState(); track item.state) {
                    <div class="state-row">
                      <span class="state-rank">{{ $index + 1 }}</span>
                      <span class="state-name">{{ item.state }}</span>
                      <div class="state-bar-wrap">
                        <div class="state-bar" [style.width.%]="(item.count / maxStateCount()) * 100"
                             [style.background-color]="getStateColor($index)"></div>
                      </div>
                      <span class="state-count">{{ item.count }}</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          </section>
        }

        <!-- ==================== REVENUE ==================== -->
        @case ('revenue') {
          <section class="report-section" aria-label="Revenue report">
            <!-- Revenue KPI Cards -->
            <div class="kpi-grid">
              @for (kpi of revenueKPIs(); track kpi.key) {
                <mat-card class="kpi-card" [style.border-left-color]="kpi.color">
                  <mat-card-content>
                    <div class="kpi-header">
                      <mat-icon [style.color]="kpi.color">{{ kpi.icon }}</mat-icon>
                      <span class="kpi-label">{{ kpi.key | translate }}</span>
                    </div>
                    <div class="kpi-value">{{ kpi.value | currency:'USD':'symbol':'1.0-0' }}</div>
                  </mat-card-content>
                </mat-card>
              }
            </div>

            <!-- Monthly Revenue Table -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ATT.MONTHLY_REVENUE' | translate }}</h3>
                <table class="data-table" aria-label="Monthly revenue breakdown">
                  <thead>
                    <tr>
                      <th>{{ 'ATT.MONTH' | translate }}</th>
                      <th>{{ 'ATT.REVENUE_COL' | translate }}</th>
                      <th>{{ 'ATT.CASES_COL' | translate }}</th>
                      <th>{{ 'ATT.AVG_PER_CASE' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (row of monthlyRevenue(); track row.month) {
                      <tr>
                        <td>{{ row.month }}</td>
                        <td class="text-green">{{ row.revenue | currency:'USD':'symbol':'1.0-0' }}</td>
                        <td>{{ row.cases }}</td>
                        <td>{{ (row.cases > 0 ? row.revenue / row.cases : 0) | currency:'USD':'symbol':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                  <tfoot>
                    <tr class="totals-row">
                      <td><strong>{{ 'ATT.TOTAL' | translate }}</strong></td>
                      <td class="text-green"><strong>{{ totalRevenue() | currency:'USD':'symbol':'1.0-0' }}</strong></td>
                      <td><strong>{{ totalRevenueCases() }}</strong></td>
                      <td><strong>{{ (totalRevenueCases() > 0 ? totalRevenue() / totalRevenueCases() : 0) | currency:'USD':'symbol':'1.0-0' }}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </mat-card-content>
            </mat-card>

            <!-- Collection Rate -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ATT.COLLECTION_RATE' | translate }}</h3>
                <div class="collection-rate">
                  <div class="collection-bar-track">
                    <div class="collection-bar-fill" [style.width.%]="collectionRate()"></div>
                  </div>
                  <div class="collection-labels">
                    <span>{{ 'ATT.COLLECTED' | translate }}: {{ 59250 | currency:'USD':'symbol':'1.0-0' }}</span>
                    <span>{{ 'ATT.OUTSTANDING' | translate }}: {{ 8200 | currency:'USD':'symbol':'1.0-0' }}</span>
                  </div>
                  <div class="collection-pct">{{ collectionRate() | number:'1.1-1' }}%</div>
                </div>
              </mat-card-content>
            </mat-card>
          </section>
        }

        <!-- ==================== CLIENT INSIGHTS ==================== -->
        @case ('clients') {
          <section class="report-section" aria-label="Client insights report">
            <!-- Client KPI Cards -->
            <div class="kpi-grid">
              <mat-card class="kpi-card" style="border-left-color: #1976d2">
                <mat-card-content>
                  <div class="kpi-header">
                    <mat-icon style="color: #1976d2">star</mat-icon>
                    <span class="kpi-label">{{ 'ATT.SATISFACTION_SCORE' | translate }}</span>
                  </div>
                  <div class="kpi-value">4.7<span class="kpi-unit">/5</span></div>
                  <div class="star-rating">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <mat-icon [class.filled]="star <= 4"
                                [class.half]="star === 5">
                        {{ star <= 4 ? 'star' : 'star_half' }}
                      </mat-icon>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="kpi-card" style="border-left-color: #388e3c">
                <mat-card-content>
                  <div class="kpi-header">
                    <mat-icon style="color: #388e3c">repeat</mat-icon>
                    <span class="kpi-label">{{ 'ATT.REPEAT_CLIENTS' | translate }}</span>
                  </div>
                  <div class="kpi-value">34%</div>
                  <div class="kpi-progress">
                    <div class="kpi-progress-track">
                      <div class="kpi-progress-fill" style="width: 34%; background: #388e3c;"></div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="kpi-card" style="border-left-color: #7b1fa2">
                <mat-card-content>
                  <div class="kpi-header">
                    <mat-icon style="color: #7b1fa2">share</mat-icon>
                    <span class="kpi-label">{{ 'ATT.REFERRAL_RATE' | translate }}</span>
                  </div>
                  <div class="kpi-value">28%</div>
                  <div class="kpi-progress">
                    <div class="kpi-progress-track">
                      <div class="kpi-progress-fill" style="width: 28%; background: #7b1fa2;"></div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
              <mat-card class="kpi-card" style="border-left-color: #f57c00">
                <mat-card-content>
                  <div class="kpi-header">
                    <mat-icon style="color: #f57c00">group</mat-icon>
                    <span class="kpi-label">{{ 'ATT.TOTAL_CLIENTS' | translate }}</span>
                  </div>
                  <div class="kpi-value">53</div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Top Clients by Case Count -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ATT.TOP_CLIENTS' | translate }}</h3>
                <table class="data-table" aria-label="Top clients by case count">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{{ 'ATT.CLIENT_NAME' | translate }}</th>
                      <th>{{ 'ATT.CASES_COL' | translate }}</th>
                      <th>{{ 'ATT.REVENUE_COL' | translate }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (client of topClients(); track client.name) {
                      <tr>
                        <td>
                          <span class="rank-badge" [class]="getRankClass($index)">{{ $index + 1 }}</span>
                        </td>
                        <td>
                          <div class="client-cell">
                            <div class="client-avatar" [style.background-color]="getAvatarColor(client.name)">
                              {{ getInitials(client.name) }}
                            </div>
                            <span>{{ client.name }}</span>
                          </div>
                        </td>
                        <td>{{ client.cases }}</td>
                        <td class="text-green">{{ client.revenue | currency:'USD':'symbol':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </mat-card-content>
            </mat-card>

            <!-- Client Satisfaction Breakdown -->
            <mat-card class="analytics-card">
              <mat-card-content>
                <h3>{{ 'ATT.SATISFACTION_BREAKDOWN' | translate }}</h3>
                <div class="satisfaction-bars">
                  @for (item of satisfactionBreakdown(); track item.label) {
                    <div class="satisfaction-row">
                      <span class="satisfaction-label">{{ item.label }}</span>
                      <div class="satisfaction-bar-wrap">
                        <div class="satisfaction-bar"
                             [style.width.%]="(item.count / maxSatisfaction()) * 100"
                             [style.background-color]="item.color"></div>
                      </div>
                      <span class="satisfaction-count">{{ item.count }}</span>
                      <span class="satisfaction-pct">{{ ((item.count / totalSatisfaction()) * 100) | number:'1.0-0' }}%</span>
                    </div>
                  }
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
      max-width: 1000px;
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
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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

    .kpi-unit {
      font-size: 18px;
      font-weight: 400;
      color: #888;
    }

    .kpi-progress {
      margin-top: 8px;
    }

    .kpi-progress-track {
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
    }

    .kpi-progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.4s ease;
    }

    /* ==================== Star Rating ==================== */
    .star-rating {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-top: 4px;
    }

    .star-rating mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #ccc;
    }

    .star-rating mat-icon.filled,
    .star-rating mat-icon.half {
      color: #ffc107;
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

    .text-green { color: #2e7d32; }
    .text-red { color: #c62828; }

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

    /* ==================== Analytics Cards ==================== */
    .analytics-card h3 {
      margin: 0 0 20px;
      font-size: 18px;
      font-weight: 500;
    }

    /* ==================== Resolution Bar Chart ==================== */
    .resolution-chart {
      display: flex;
      align-items: flex-end;
      gap: 16px;
      height: 180px;
      padding: 0 8px;
    }

    .resolution-bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    .resolution-bar-container {
      flex: 1;
      display: flex;
      align-items: flex-end;
      width: 100%;
      justify-content: center;
    }

    .resolution-bar {
      width: 36px;
      border-radius: 4px 4px 0 0;
      position: relative;
      transition: height 0.3s ease;
      min-height: 4px;
      cursor: default;
    }

    .resolution-bar:hover .bar-tooltip {
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

    .bar-label {
      margin-top: 8px;
      font-size: 12px;
      color: #666;
    }

    /* ==================== Status Horizontal Bars ==================== */
    .status-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .status-name {
      width: 120px;
      font-size: 14px;
      color: #333;
      flex-shrink: 0;
    }

    .status-bar-wrap {
      flex: 1;
      height: 24px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .status-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .status-count {
      font-size: 16px;
      font-weight: 700;
      width: 40px;
      text-align: right;
      flex-shrink: 0;
    }

    /* ==================== Type List ==================== */
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

    /* ==================== State List ==================== */
    .state-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .state-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .state-rank {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e3f2fd;
      color: #1565c0;
      font-weight: 700;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .state-name {
      width: 100px;
      font-size: 14px;
      color: #333;
      flex-shrink: 0;
    }

    .state-bar-wrap {
      flex: 1;
      height: 20px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .state-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .state-count {
      font-size: 14px;
      font-weight: 700;
      color: #333;
      width: 36px;
      text-align: right;
      flex-shrink: 0;
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

    /* ==================== Client Table Extras ==================== */
    .client-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .client-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      font-size: 12px;
      flex-shrink: 0;
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      font-size: 12px;
      font-weight: 700;
    }

    .rank-badge.rank-gold {
      background: #fff8e1;
      color: #f57f17;
    }

    .rank-badge.rank-silver {
      background: #eceff1;
      color: #546e7a;
    }

    .rank-badge.rank-bronze {
      background: #fbe9e7;
      color: #bf360c;
    }

    .rank-badge.rank-default {
      background: #f5f5f5;
      color: #666;
    }

    /* ==================== Satisfaction Bars ==================== */
    .satisfaction-bars {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .satisfaction-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .satisfaction-label {
      width: 80px;
      font-size: 14px;
      color: #333;
      flex-shrink: 0;
    }

    .satisfaction-bar-wrap {
      flex: 1;
      height: 20px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .satisfaction-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .satisfaction-count {
      font-size: 14px;
      font-weight: 700;
      color: #333;
      width: 30px;
      text-align: right;
    }

    .satisfaction-pct {
      font-size: 13px;
      color: #888;
      width: 36px;
      text-align: right;
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

      .type-name {
        width: 100px;
      }

      .status-name {
        width: 90px;
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

      .header-actions {
        flex-wrap: wrap;
      }

      .type-name, .status-name {
        width: 80px;
        font-size: 12px;
      }
    }

    /* ==================== Print ==================== */
    @media print {
      .page-header button,
      .report-tabs {
        display: none;
      }

      .kpi-card:hover {
        transform: none;
        box-shadow: none;
      }
    }
  `,
})
export class AttorneyReportsComponent {
  // ==================== State ====================
  reportType = signal<ReportType>('performance');

  // ==================== Mock Data Signals ====================
  performanceKPIs = signal<PerformanceKPI[]>(MOCK_PERFORMANCE_KPIS);
  monthlyPerformance = signal<MonthlyPerformance[]>(MOCK_MONTHLY_PERFORMANCE);
  resolutionTrend = signal<ResolutionTrend[]>(MOCK_RESOLUTION_TREND);
  casesByStatus = signal<CaseStatusItem[]>(MOCK_CASES_BY_STATUS);
  casesByType = signal<ViolationTypeItem[]>(MOCK_CASES_BY_TYPE);
  casesByState = signal<StateItem[]>(MOCK_CASES_BY_STATE);
  revenueKPIs = signal<RevenueKPI[]>(MOCK_REVENUE_KPIS);
  monthlyRevenue = signal<MonthlyRevenue[]>(MOCK_MONTHLY_REVENUE);
  topClients = signal<TopClient[]>(MOCK_TOP_CLIENTS);
  satisfactionBreakdown = signal([
    { label: '5 stars', count: 28, color: '#388e3c' },
    { label: '4 stars', count: 16, color: '#66bb6a' },
    { label: '3 stars', count: 6, color: '#ffa726' },
    { label: '2 stars', count: 2, color: '#ef5350' },
    { label: '1 star', count: 1, color: '#c62828' },
  ]);

  // ==================== Computed ====================
  maxStatusCount = computed(() =>
    Math.max(...this.casesByStatus().map(s => s.count))
  );

  maxTypeCount = computed(() =>
    Math.max(...this.casesByType().map(t => t.count))
  );

  totalViolations = computed(() =>
    this.casesByType().reduce((sum, t) => sum + t.count, 0)
  );

  maxStateCount = computed(() =>
    Math.max(...this.casesByState().map(s => s.count))
  );

  maxResolutionDays = computed(() =>
    Math.max(...this.resolutionTrend().map(r => r.days))
  );

  totalRevenue = computed(() =>
    this.monthlyRevenue().reduce((sum, r) => sum + r.revenue, 0)
  );

  totalRevenueCases = computed(() =>
    this.monthlyRevenue().reduce((sum, r) => sum + r.cases, 0)
  );

  collectionRate = computed(() =>
    (59250 / (59250 + 8200)) * 100
  );

  maxSatisfaction = computed(() =>
    Math.max(...this.satisfactionBreakdown().map(s => s.count))
  );

  totalSatisfaction = computed(() =>
    this.satisfactionBreakdown().reduce((sum, s) => sum + s.count, 0)
  );

  // ==================== Methods ====================
  printReport(): void {
    window.print();
  }

  getBarHeight(value: number, max: number): number {
    if (max === 0) return 0;
    return (value / max) * 100;
  }

  getRateBadgeClass(rate: number): string {
    if (rate >= 85) return 'rate-high';
    if (rate >= 70) return 'rate-mid';
    return 'rate-low';
  }

  getResolutionBarColor(days: number): string {
    if (days <= 11) return 'linear-gradient(180deg, #66bb6a, #388e3c)';
    if (days <= 13) return 'linear-gradient(180deg, #42a5f5, #1976d2)';
    return 'linear-gradient(180deg, #ffa726, #f57c00)';
  }

  getTypeColor(index: number): string {
    const palette = ['#42a5f5', '#66bb6a', '#ffa726', '#ab47bc', '#ef5350', '#26a69a', '#78909c'];
    return palette[index % palette.length];
  }

  getStateColor(index: number): string {
    const palette = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c62828'];
    return palette[index % palette.length];
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

  getRankClass(index: number): string {
    if (index === 0) return 'rank-gold';
    if (index === 1) return 'rank-silver';
    if (index === 2) return 'rank-bronze';
    return 'rank-default';
  }
}

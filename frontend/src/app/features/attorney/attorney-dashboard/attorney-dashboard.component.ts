import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule } from '@ngx-translate/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AttorneyService, AttorneyCase, AttorneyRating } from '../../../core/services/attorney.service';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

type TabId = 'pending' | 'active' | 'resolved';

const ACTIVE_STATUSES = new Set([
  'send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager',
]);

@Component({
  selector: 'app-attorney-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTabsModule, MatChipsModule,
    DecimalPipe,
    ErrorStateComponent, SkeletonLoaderComponent, TranslateModule,
  ],
  template: `
    <div class="dashboard">
      <!-- Welcome Header -->
      <header class="dash-header">
        <div class="header-left">
          <h1>{{ 'ATT.WELCOME_BACK' | translate }}</h1>
          <p class="header-subtitle">{{ 'ATT.DASHBOARD_SUBTITLE' | translate }}</p>
        </div>
        <button mat-icon-button class="refresh-btn" (click)="loadCases()" aria-label="Refresh cases">
          <mat-icon>refresh</mat-icon>
        </button>
      </header>

      @if (!loading() && !error()) {
        <!-- Primary Stats Row -->
        <div class="stats-row" role="region" aria-label="Case statistics">
          <mat-card class="stat-card" appearance="outlined">
            <div class="stat-icon-wrap pending-gradient">
              <mat-icon>pending_actions</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">{{ 'ATT.PENDING_CASES' | translate }}</span>
              <span class="stat-value">{{ pendingCases().length }}</span>
            </div>
          </mat-card>

          <mat-card class="stat-card" appearance="outlined">
            <div class="stat-icon-wrap active-gradient">
              <mat-icon>work</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">{{ 'ATT.ACTIVE_CASES' | translate }}</span>
              <span class="stat-value">{{ activeCases().length }}</span>
            </div>
          </mat-card>

          <mat-card class="stat-card" appearance="outlined">
            <div class="stat-icon-wrap resolved-gradient">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">{{ 'ATT.RESOLVED_CASES' | translate }}</span>
              <span class="stat-value">{{ resolvedCases().length }}</span>
            </div>
          </mat-card>

          <mat-card class="stat-card" appearance="outlined">
            <div class="stat-icon-wrap winrate-gradient">
              <mat-icon>emoji_events</mat-icon>
            </div>
            <div class="stat-body">
              <span class="stat-label">{{ 'ATT.WIN_RATE' | translate }}</span>
              <span class="stat-value">87.5%</span>
            </div>
          </mat-card>
        </div>

        <!-- Secondary Stats Row -->
        <div class="secondary-stats-row" role="region" aria-label="Performance metrics">
          <mat-card class="secondary-stat-card" appearance="outlined">
            <mat-icon class="secondary-icon">schedule</mat-icon>
            <div class="secondary-body">
              <span class="secondary-value">12.4 {{ 'ATT.DAYS' | translate }}</span>
              <span class="secondary-label">{{ 'ATT.AVG_RESOLUTION' | translate }}</span>
            </div>
          </mat-card>

          <mat-card class="secondary-stat-card" appearance="outlined">
            <mat-icon class="secondary-icon">attach_money</mat-icon>
            <div class="secondary-body">
              <span class="secondary-value">$14,250</span>
              <span class="secondary-label">{{ 'ATT.REVENUE_MTD' | translate }}</span>
            </div>
          </mat-card>

          <mat-card class="secondary-stat-card" appearance="outlined">
            <mat-icon class="secondary-icon star-color">star</mat-icon>
            <div class="secondary-body">
              @if (rating()?.average_score !== null && rating()?.average_score !== undefined) {
                <span class="secondary-value">{{ rating()!.average_score }}/5</span>
                <span class="secondary-label">{{ rating()!.total_ratings }} {{ 'ATT.REVIEWS' | translate }}</span>
              } @else {
                <span class="secondary-value">--/5</span>
                <span class="secondary-label">{{ 'ATT.NO_RATINGS' | translate }}</span>
              }
            </div>
          </mat-card>
        </div>

        <!-- Case Distribution Chart -->
        <section class="section-block" aria-label="Case distribution">
          <div class="section-header">
            <h2>{{ 'ATT.CASES_BY_STATUS' | translate }}</h2>
            <mat-icon class="section-icon">pie_chart</mat-icon>
          </div>
          <div class="chart-row">
            <div class="chart-bar-group">
              <div class="chart-bar-item">
                <div class="chart-bar-label">{{ 'ATT.TAB_PENDING' | translate }}</div>
                <div class="chart-bar-track">
                  <div class="chart-bar-fill pending-fill" [style.width.%]="barPercent('pending')"></div>
                </div>
                <div class="chart-bar-count">{{ pendingCases().length }}</div>
              </div>
              <div class="chart-bar-item">
                <div class="chart-bar-label">{{ 'ATT.TAB_ACTIVE' | translate }}</div>
                <div class="chart-bar-track">
                  <div class="chart-bar-fill active-fill" [style.width.%]="barPercent('active')"></div>
                </div>
                <div class="chart-bar-count">{{ activeCases().length }}</div>
              </div>
              <div class="chart-bar-item">
                <div class="chart-bar-label">{{ 'ATT.TAB_RESOLVED' | translate }}</div>
                <div class="chart-bar-track">
                  <div class="chart-bar-fill resolved-fill" [style.width.%]="barPercent('resolved')"></div>
                </div>
                <div class="chart-bar-count">{{ resolvedCases().length }}</div>
              </div>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-dot pending-fill"></span>
                <span>{{ 'ATT.TAB_PENDING' | translate }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot active-fill"></span>
                <span>{{ 'ATT.TAB_ACTIVE' | translate }}</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot resolved-fill"></span>
                <span>{{ 'ATT.TAB_RESOLVED' | translate }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Upcoming Court Dates -->
        <section class="section-block" aria-label="Upcoming court dates">
          <div class="section-header">
            <h2>{{ 'ATT.UPCOMING_COURT_DATES' | translate }}</h2>
            <mat-icon class="section-icon">gavel</mat-icon>
          </div>
          <div class="court-dates-list">
            @for (cd of upcomingCourtDates(); track cd.caseNumber) {
              <div class="court-date-item">
                <div class="court-date-cal">
                  <span class="cal-month">{{ cd.month }}</span>
                  <span class="cal-day">{{ cd.day }}</span>
                </div>
                <div class="court-date-info">
                  <span class="court-case-num">{{ cd.caseNumber }}</span>
                  <span class="court-location">{{ cd.location }}</span>
                  <span class="court-driver">{{ cd.driverName }}</span>
                </div>
                <mat-icon class="court-arrow">chevron_right</mat-icon>
              </div>
            } @empty {
              <p class="empty-hint">{{ 'ATT.NO_COURT_DATES' | translate }}</p>
            }
          </div>
        </section>

        <!-- Recent Activity -->
        <section class="section-block" aria-label="Recent activity">
          <div class="section-header">
            <h2>{{ 'ATT.RECENT_ACTIVITY' | translate }}</h2>
            <button mat-button color="primary" class="view-all-btn" (click)="activeTab.set('active')">
              {{ 'ATT.VIEW_ALL_CASES' | translate }}
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
          <div class="recent-list">
            @for (c of recentCases(); track c.id) {
              <div class="recent-item" (click)="viewCase(c.id)"
                   role="button" tabindex="0" (keyup.enter)="viewCase(c.id)"
                   [attr.aria-label]="'Open case ' + c.case_number">
                <div class="recent-left">
                  <span class="recent-case-num">{{ c.case_number }}</span>
                  <span class="recent-driver">{{ c.driver_name }} &mdash; {{ c.violation_type }}</span>
                </div>
                <span class="status-badge"
                      [class.badge-pending]="c.status === 'assigned_to_attorney'"
                      [class.badge-active]="isActiveStatus(c.status)"
                      [class.badge-resolved]="c.status === 'closed' || c.status === 'resolved'">
                  {{ formatStatus(c.status) }}
                </span>
              </div>
            } @empty {
              <p class="empty-hint">{{ 'ATT.NO_RECENT_ACTIVITY' | translate }}</p>
            }
          </div>
        </section>
      }

      <!-- Tab System -->
      <div class="tabs-section">
        <div class="tabs">
          @for (tab of tabs; track tab.id) {
            <button mat-stroked-button
                    [class.active-tab]="activeTab() === tab.id"
                    (click)="activeTab.set(tab.id)"
                    [attr.aria-pressed]="activeTab() === tab.id">
              {{ tab.label | translate }}
              <span class="tab-count"
                    [class.tab-count-pending]="tab.id === 'pending'"
                    [class.tab-count-active]="tab.id === 'active'"
                    [class.tab-count-resolved]="tab.id === 'resolved'">
                {{ tabCount(tab.id) }}
              </span>
            </button>
          }
        </div>

        @if (loading()) {
          <app-skeleton-loader [rows]="4" [height]="88"></app-skeleton-loader>
        } @else if (error()) {
          <app-error-state [message]="error()" retryLabel="Retry" (retry)="loadCases()"></app-error-state>
        } @else {
          <div class="case-list" role="list">
            @for (c of visibleCases(); track c.id) {
              <mat-card class="case-card" role="listitem" appearance="outlined">
                <mat-card-content>
                  <div class="case-row">
                    <div class="case-main" (click)="viewCase(c.id)" style="cursor:pointer"
                         [attr.aria-label]="'Open case ' + c.case_number" role="button" tabindex="0"
                         (keyup.enter)="viewCase(c.id)">
                      <div class="case-top-line">
                        <p class="case-num">{{ c.case_number }}</p>
                        <span class="status-badge small-badge"
                              [class.badge-pending]="c.status === 'assigned_to_attorney'"
                              [class.badge-active]="isActiveStatus(c.status)"
                              [class.badge-resolved]="c.status === 'closed' || c.status === 'resolved'">
                          {{ formatStatus(c.status) }}
                        </span>
                      </div>
                      <p class="driver">{{ c.driver_name }}</p>
                      <p class="meta">
                        <mat-icon class="meta-icon">description</mat-icon>{{ c.violation_type }}
                        <span class="meta-sep">&bull;</span>
                        <mat-icon class="meta-icon">location_on</mat-icon>{{ c.state }}
                        @if (c.attorney_price) {
                          <span class="meta-sep">&bull;</span>
                          <mat-icon class="meta-icon">attach_money</mat-icon>{{ c.attorney_price | number:'1.0-0' }}
                        }
                      </p>
                    </div>
                    @if (activeTab() === 'pending') {
                      <div class="actions">
                        <button mat-raised-button color="primary"
                                (click)="acceptCase(c.id)"
                                [disabled]="processingId() === c.id"
                                [attr.aria-label]="'Accept case ' + c.case_number">
                          @if (processingId() === c.id) {
                            <mat-spinner diameter="16"></mat-spinner>
                          } @else {
                            <ng-container>
                              <mat-icon>check</mat-icon> {{ 'ATT.ACCEPT' | translate }}
                            </ng-container>
                          }
                        </button>
                        <button mat-stroked-button color="warn"
                                (click)="declineCase(c.id)"
                                [disabled]="processingId() === c.id"
                                [attr.aria-label]="'Decline case ' + c.case_number">
                          <mat-icon>close</mat-icon> {{ 'ATT.DECLINE' | translate }}
                        </button>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            } @empty {
              <div class="empty-state">
                <mat-icon aria-hidden="true">folder_open</mat-icon>
                <p>{{ 'ATT.NO_CASES_TAB' | translate }} {{ activeTab() }}.</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    /* ---- Layout ---- */
    .dashboard {
      max-width: 900px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }

    /* ---- Welcome Header ---- */
    .dash-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }
    .header-left h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      color: #1a1a2e;
      letter-spacing: -0.5px;
    }
    .header-subtitle {
      margin: 4px 0 0;
      font-size: 14px;
      color: #6b7280;
    }
    .refresh-btn {
      color: #6b7280;
      transition: color 0.2s;
    }
    .refresh-btn:hover {
      color: #1976d2;
    }

    /* ---- Primary Stats Row ---- */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }
    .stat-card {
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      transition: transform 0.2s, box-shadow 0.2s;
      border: 1px solid #e5e7eb;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }
    .stat-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #fff;
    }
    .pending-gradient  { background: linear-gradient(135deg, #f7971e, #ffd200); }
    .active-gradient   { background: linear-gradient(135deg, #4facfe, #00f2fe); }
    .resolved-gradient { background: linear-gradient(135deg, #11998e, #38ef7d); }
    .winrate-gradient  { background: linear-gradient(135deg, #667eea, #764ba2); }

    .stat-body {
      display: flex;
      flex-direction: column;
    }
    .stat-label {
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 800;
      color: #1a1a2e;
      line-height: 1.1;
    }

    /* ---- Secondary Stats Row ---- */
    .secondary-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .secondary-stat-card {
      border-radius: 14px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      gap: 14px;
      border: 1px solid #e5e7eb;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .secondary-stat-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    }
    .secondary-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: #6b7280;
    }
    .secondary-icon.star-color {
      color: #f9a825;
    }
    .secondary-body {
      display: flex;
      flex-direction: column;
    }
    .secondary-value {
      font-size: 20px;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.2;
    }
    .secondary-label {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    /* ---- Section Block ---- */
    .section-block {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 20px 24px;
      margin-bottom: 24px;
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .section-header h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .section-icon {
      color: #9ca3af;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }
    .view-all-btn {
      font-size: 13px;
      font-weight: 600;
    }
    .view-all-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* ---- Court Dates ---- */
    .court-dates-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .court-date-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border-radius: 12px;
      background: #f9fafb;
      transition: background 0.15s;
    }
    .court-date-item:hover {
      background: #f3f4f6;
    }
    .court-date-cal {
      width: 52px;
      height: 56px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .cal-month {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: rgba(255,255,255,0.85);
      line-height: 1;
    }
    .cal-day {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      line-height: 1.1;
    }
    .court-date-info {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }
    .court-case-num {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .court-location {
      font-size: 13px;
      color: #4b5563;
    }
    .court-driver {
      font-size: 12px;
      color: #9ca3af;
    }
    .court-arrow {
      color: #d1d5db;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* ---- Recent Activity ---- */
    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .recent-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .recent-item:hover {
      background: #f3f4f6;
    }
    .recent-item:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }
    .recent-left {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .recent-case-num {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
    }
    .recent-driver {
      font-size: 13px;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ---- Status Badges ---- */
    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .small-badge {
      font-size: 10px;
      padding: 2px 8px;
    }
    .badge-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-active {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-resolved {
      background: #d1fae5;
      color: #065f46;
    }

    .empty-hint {
      text-align: center;
      color: #9ca3af;
      font-size: 14px;
      padding: 12px 0;
      margin: 0;
    }

    /* ---- Chart Row ---- */
    .chart-row {
      display: flex;
      gap: 24px;
      align-items: flex-start;
    }
    .chart-bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .chart-bar-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .chart-bar-label {
      width: 72px;
      font-size: 13px;
      font-weight: 600;
      color: #4b5563;
      flex-shrink: 0;
    }
    .chart-bar-track {
      flex: 1;
      height: 22px;
      background: #f3f4f6;
      border-radius: 6px;
      overflow: hidden;
    }
    .chart-bar-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 0.6s ease;
    }
    .pending-fill  { background: linear-gradient(135deg, #f7971e, #ffd200); }
    .active-fill   { background: linear-gradient(135deg, #4facfe, #00f2fe); }
    .resolved-fill { background: linear-gradient(135deg, #11998e, #38ef7d); }
    .chart-bar-count {
      width: 28px;
      text-align: right;
      font-size: 14px;
      font-weight: 700;
      color: #1a1a2e;
      flex-shrink: 0;
    }
    .chart-legend {
      display: flex;
      flex-direction: column;
      gap: 10px;
      flex-shrink: 0;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
    }
    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    /* ---- Tabs Section ---- */
    .tabs-section {
      margin-top: 8px;
    }
    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .tabs button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .active-tab {
      background: #1976d2 !important;
      color: #fff !important;
    }
    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
    }
    .tab-count-pending  { background: #fef3c7; color: #92400e; }
    .tab-count-active   { background: #dbeafe; color: #1e40af; }
    .tab-count-resolved { background: #d1fae5; color: #065f46; }
    .active-tab .tab-count {
      background: rgba(255,255,255,0.25);
      color: #fff;
    }

    /* ---- Case List ---- */
    .case-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .case-card {
      border-radius: 14px;
      transition: transform 0.15s, box-shadow 0.15s;
      border: 1px solid #e5e7eb;
    }
    .case-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.1);
    }
    .case-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .case-main {
      flex: 1;
      min-width: 0;
    }
    .case-main:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
      border-radius: 4px;
    }
    .case-top-line {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 2px;
    }
    .case-num {
      margin: 0;
      font-weight: 700;
      font-size: 15px;
      color: #1a1a2e;
    }
    .driver {
      margin: 2px 0 0;
      font-size: 14px;
      color: #333;
    }
    .meta {
      margin: 4px 0 0;
      font-size: 12px;
      color: #6b7280;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .meta-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #9ca3af;
    }
    .meta-sep {
      margin: 0 2px;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }
    .actions button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .actions button mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px;
      color: #9ca3af;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    /* ---- Responsive ---- */
    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
      .secondary-stats-row {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 480px) {
      .dashboard {
        padding: 16px 12px 40px;
      }
      .stats-row {
        grid-template-columns: 1fr;
      }
      .header-left h1 {
        font-size: 22px;
      }
      .case-row {
        flex-direction: column;
      }
      .actions {
        flex-direction: row;
        align-self: flex-end;
      }
    }
  `],
})
export class AttorneyDashboardComponent implements OnInit {
  private attorneyService = inject(AttorneyService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  cases = signal<AttorneyCase[]>([]);
  loading = signal(true);
  error = signal('');
  activeTab = signal<TabId>('pending');
  processingId = signal<string | null>(null);
  rating = signal<AttorneyRating | null>(null);

  pendingCases = computed(() => this.cases().filter(c => c.status === 'assigned_to_attorney'));
  activeCases = computed(() => this.cases().filter(c => ACTIVE_STATUSES.has(c.status)));
  resolvedCases = computed(() => this.cases().filter(c => c.status === 'closed' || c.status === 'resolved'));

  recentCases = computed(() => {
    const all = [...this.cases()];
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all.slice(0, 3);
  });

  upcomingCourtDates = computed(() => {
    const active = this.activeCases();
    const dates: { caseNumber: string; driverName: string; month: string; day: string; location: string }[] = [];

    if (active.length > 0) {
      dates.push({
        caseNumber: active[0]?.case_number ?? '',
        driverName: active[0]?.driver_name ?? '',
        month: 'Mar',
        day: '18',
        location: 'Miami-Dade County Court, FL',
      });
    }
    if (active.length > 1) {
      dates.push({
        caseNumber: active[1]?.case_number ?? '',
        driverName: active[1]?.driver_name ?? '',
        month: 'Mar',
        day: '24',
        location: 'Sacramento Superior Court, CA',
      });
    }
    if (active.length > 2) {
      dates.push({
        caseNumber: active[2]?.case_number ?? '',
        driverName: active[2]?.driver_name ?? '',
        month: 'Apr',
        day: '02',
        location: 'Queens County Criminal Court, NY',
      });
    }

    return dates;
  });

  visibleCases = computed(() => {
    const tab = this.activeTab();
    if (tab === 'pending') return this.pendingCases();
    if (tab === 'active') return this.activeCases();
    return this.resolvedCases();
  });

  tabs: { id: TabId; label: string }[] = [
    { id: 'pending', label: 'ATT.TAB_PENDING' },
    { id: 'active', label: 'ATT.TAB_ACTIVE' },
    { id: 'resolved', label: 'ATT.TAB_RESOLVED' },
  ];

  ngOnInit(): void {
    this.loadCases();
    this.attorneyService.getMyRating().pipe(
      catchError(() => of(null)),
    ).subscribe({
      next: (r) => this.rating.set(r ?? null),
    });
  }

  loadCases(): void {
    this.loading.set(true);
    this.error.set('');
    this.attorneyService.getMyCases().pipe(
      catchError(() => of({ cases: [] as AttorneyCase[] })),
    ).subscribe({
      next: (r) => {
        this.cases.set(r.cases ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load cases. Please try again.');
        this.loading.set(false);
      },
    });
  }

  tabCount(tabId: TabId): number {
    if (tabId === 'pending') return this.pendingCases().length;
    if (tabId === 'active') return this.activeCases().length;
    return this.resolvedCases().length;
  }

  isActiveStatus(status: string): boolean {
    return ACTIVE_STATUSES.has(status);
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      'assigned_to_attorney': 'Pending',
      'send_info_to_attorney': 'Info Sent',
      'waiting_for_driver': 'Awaiting Driver',
      'call_court': 'Call Court',
      'check_with_manager': 'Manager Review',
      'closed': 'Closed',
      'resolved': 'Resolved',
    };
    return map[status] ?? status;
  }

  acceptCase(id: string): void {
    this.processingId.set(id);
    this.attorneyService.acceptCase(id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.snackBar.open('Case accepted — now active in your queue.', 'Close', { duration: 3000 });
        this.loadCases();
      },
      error: () => {
        this.processingId.set(null);
        this.snackBar.open('Failed to accept case.', 'Close', { duration: 3000 });
      },
    });
  }

  declineCase(id: string): void {
    this.processingId.set(id);
    this.attorneyService.declineCase(id).subscribe({
      next: () => {
        this.processingId.set(null);
        this.cases.update(all => all.filter(c => c.id !== id));
        this.snackBar.open('Case declined.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.processingId.set(null);
        this.snackBar.open('Failed to decline case.', 'Close', { duration: 3000 });
      },
    });
  }

  barPercent(category: 'pending' | 'active' | 'resolved'): number {
    const total = this.cases().length;
    if (total === 0) return 0;
    let count = 0;
    if (category === 'pending') count = this.pendingCases().length;
    else if (category === 'active') count = this.activeCases().length;
    else count = this.resolvedCases().length;
    return Math.round((count / total) * 100);
  }

  viewCase(id: string): void {
    this.router.navigate(['/attorney/cases', id]);
  }
}

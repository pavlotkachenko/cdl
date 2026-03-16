import {
  Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef,
  signal, computed, effect, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { Chart } from 'chart.js/auto';
import { catchError, of } from 'rxjs';

import {
  AdminService, DashboardStats,
} from '../../../core/services/admin.service';
import { CaseService } from '../../../core/services/case.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { AdminOperatorKanbanComponent } from '../operator-kanban/admin-operator-kanban.component';
import { OperatorKanbanComponent } from '../../operator/kanban/operator-kanban.component';

/* ------------------------------------------------------------------ */
/*  Label maps                                                        */
/* ------------------------------------------------------------------ */
const STATUS_LABELS: Record<string, string> = {
  new: 'New', reviewed: 'Reviewed', assigned_to_attorney: 'Assigned',
  send_info_to_attorney: 'Info Sent', waiting_for_driver: 'Waiting',
  call_court: 'Call Court', check_with_manager: 'Check Mgr',
  pay_attorney: 'Pay Atty', attorney_paid: 'Atty Paid',
  resolved: 'Resolved', closed: 'Closed',
};

/** Compute priority from case age (hours since creation) */
function agePriority(ageHours: number): 'high' | 'medium' | 'low' {
  if (ageHours > 168) return 'high';
  if (ageHours > 72) return 'medium';
  return 'low';
}

@Component({
  selector: 'app-admin-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTabsModule,
    TitleCasePipe,
    ErrorStateComponent, SkeletonLoaderComponent, TranslateModule,
    AdminOperatorKanbanComponent, OperatorKanbanComponent,
  ],
  template: `
    <div class="admin-dash">

      <!-- ====== 1. PAGE HEADER ====== -->
      <div class="page-header">
        <h1>{{ 'ADMIN.DASHBOARD' | translate }}</h1>
        <button mat-stroked-button (click)="refresh()" aria-label="Refresh dashboard">
          <mat-icon>refresh</mat-icon>
          {{ 'ADMIN.REFRESH' | translate }}
        </button>
      </div>

      @if (loading()) {
        <app-skeleton-loader [rows]="6" [height]="68"></app-skeleton-loader>
        <div style="height:16px"></div>
        <app-skeleton-loader [rows]="3" [height]="56"></app-skeleton-loader>
      } @else if (error()) {
        <app-error-state
          [message]="error() | translate"
          [retryLabel]="'ADMIN.RETRY' | translate"
          (retry)="refresh()">
        </app-error-state>
      } @else {

        <!-- ====== 2. KPI STAT CARDS — ROW 1: CASES ====== -->
        <div class="stat-grid">
          <mat-card class="stat-card border-blue">
            <mat-card-content>
              <div class="stat-icon bg-blue"><mat-icon>folder</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.TOTAL_CASES' | translate }}</p>
              <p class="stat-val">{{ stats()?.totalCases ?? 0 }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-blue">
            <mat-card-content>
              <div class="stat-icon bg-blue"><mat-icon>pending_actions</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.ACTIVE' | translate }}</p>
              <p class="stat-val active">{{ stats()?.activeCases ?? 0 }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-amber">
            <mat-card-content>
              <div class="stat-icon bg-amber"><mat-icon>hourglass_top</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.PENDING' | translate }}</p>
              <p class="stat-val pending">{{ stats()?.pendingCases ?? 0 }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-green">
            <mat-card-content>
              <div class="stat-icon bg-green"><mat-icon>check_circle</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.RESOLVED' | translate }}</p>
              <p class="stat-val resolved">{{ stats()?.resolvedCases ?? 0 }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-blue">
            <mat-card-content>
              <div class="stat-icon bg-blue"><mat-icon>date_range</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.CASES_THIS_WEEK' | translate }}</p>
              <p class="stat-val">{{ stats()?.casesThisWeek ?? 0 }}</p>
              @if (weeklyChange() !== 0) {
                <p [class]="'stat-delta ' + (weeklyChange() > 0 ? 'up' : 'down')">
                  {{ weeklyChange() > 0 ? '+' : '' }}{{ weeklyChange().toFixed(1) }}%
                </p>
              }
            </mat-card-content>
          </mat-card>
        </div>

        <!-- ====== KPI STAT CARDS — ROW 2: REVENUE & METRICS ====== -->
        <div class="stat-grid">
          <mat-card class="stat-card border-green">
            <mat-card-content>
              <div class="stat-icon bg-green"><mat-icon>attach_money</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.REVENUE_MONTH' | translate }}</p>
              <p class="stat-val">{{ formatCurrency(stats()?.revenueThisMonth ?? 0) }}</p>
              @if (revenueChange() !== 0) {
                <p [class]="'stat-delta ' + (revenueChange() > 0 ? 'up' : 'down')">
                  {{ revenueChange() > 0 ? '+' : '' }}{{ revenueChange().toFixed(1) }}%
                </p>
              }
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-amber">
            <mat-card-content>
              <div class="stat-icon bg-amber"><mat-icon>hourglass_empty</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.PENDING_REVENUE' | translate }}</p>
              <p class="stat-val pending">{{ formatCurrency(pendingRevenue()) }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-purple">
            <mat-card-content>
              <div class="stat-icon bg-purple"><mat-icon>trending_up</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.SUCCESS_RATE' | translate }}</p>
              <p class="stat-val">{{ stats()?.successRate?.toFixed(1) ?? 0 }}%</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-purple">
            <mat-card-content>
              <div class="stat-icon bg-purple"><mat-icon>schedule</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.AVG_RESOLUTION' | translate }}</p>
              <p class="stat-val">{{ stats()?.avgResolutionTime?.toFixed(1) ?? 0 }}d</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-green">
            <mat-card-content>
              <div class="stat-icon bg-green"><mat-icon>people</mat-icon></div>
              <p class="stat-lbl">{{ 'ADMIN.TOTAL_CLIENTS' | translate }}</p>
              <p class="stat-val">{{ stats()?.totalClients ?? 0 }}</p>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- ====== 3. MULTI-BOARD TABS ====== -->
        <mat-tab-group [selectedIndex]="activeTab()"
                       (selectedIndexChange)="onTabChange($event)"
                       mat-stretch-tabs="false"
                       class="admin-tabs"
                       animationDuration="200ms">

          <!-- ── Tab 0: All Cases ── -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">list</mat-icon>
              <span class="tab-text">{{ 'ADMIN.TAB_ALL_CASES' | translate }}</span>
              <span class="tab-badge" [attr.aria-label]="'Active cases: ' + (stats()?.activeCases ?? 0)">
                {{ stats()?.activeCases ?? 0 }}
              </span>
            </ng-template>

            <div class="tab-content">
              <!-- Charts -->
              <div class="charts-row">
                <mat-card class="chart-card">
                  <mat-card-header><mat-card-title>{{ 'ADMIN.CASE_STATUS' | translate }}</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <div class="chart-wrap"><canvas #statusChart role="img" aria-label="Bar chart showing case status distribution"></canvas></div>
                  </mat-card-content>
                </mat-card>
                <mat-card class="chart-card">
                  <mat-card-header><mat-card-title>{{ 'ADMIN.VIOLATION_TYPES' | translate }}</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <div class="chart-wrap"><canvas #violationChart role="img" aria-label="Doughnut chart showing violation type distribution"></canvas></div>
                  </mat-card-content>
                </mat-card>
                <mat-card class="chart-card">
                  <mat-card-header><mat-card-title>{{ 'ADMIN.ATTORNEY_WORKLOAD' | translate }}</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <div class="chart-wrap"><canvas #workloadChart role="img" aria-label="Bar chart showing attorney workload distribution"></canvas></div>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Case queue -->
              <mat-card class="section-card">
                <mat-card-header>
                  <mat-card-title>{{ 'ADMIN.CASE_QUEUE' | translate }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="queue-filters">
                    <mat-form-field appearance="outline" class="filter-field search-field">
                      <mat-label>{{ 'ADMIN.SEARCH_CASES' | translate }}</mat-label>
                      <input matInput
                             [ngModel]="searchTerm()"
                             (ngModelChange)="searchTerm.set($event)"
                             [placeholder]="'ADMIN.SEARCH_PLACEHOLDER' | translate" />
                      <mat-icon matPrefix>search</mat-icon>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="filter-field">
                      <mat-label>{{ 'ADMIN.STATUS' | translate }}</mat-label>
                      <mat-select [ngModel]="queueStatusFilter()" (ngModelChange)="queueStatusFilter.set($event)">
                        <mat-option value="">{{ 'ADMIN.ALL_STATUSES' | translate }}</mat-option>
                        <mat-option value="new">{{ 'ADMIN.STATUS_NEW' | translate }}</mat-option>
                        <mat-option value="assigned">{{ 'ADMIN.STATUS_ASSIGNED' | translate }}</mat-option>
                        <mat-option value="in_progress">{{ 'ADMIN.STATUS_IN_PROGRESS' | translate }}</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="filter-field">
                      <mat-label>{{ 'ADMIN.PRIORITY' | translate }}</mat-label>
                      <mat-select [ngModel]="queuePriorityFilter()" (ngModelChange)="queuePriorityFilter.set($event)">
                        <mat-option value="">{{ 'ADMIN.ALL_PRIORITIES' | translate }}</mat-option>
                        <mat-option value="high">{{ 'ADMIN.PRIORITY_HIGH' | translate }}</mat-option>
                        <mat-option value="medium">{{ 'ADMIN.PRIORITY_MEDIUM' | translate }}</mat-option>
                        <mat-option value="low">{{ 'ADMIN.PRIORITY_LOW' | translate }}</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <button mat-stroked-button class="clear-btn" (click)="clearFilters()">
                      <mat-icon>clear</mat-icon>
                      {{ 'ADMIN.CLEAR' | translate }}
                    </button>
                  </div>

                  @if (filteredQueue().length === 0) {
                    <div class="empty-state" role="status">
                      <mat-icon aria-hidden="true">inbox</mat-icon>
                      <p class="empty-title">{{ 'ADMIN.NO_CASES_QUEUE' | translate }}</p>
                    </div>
                  } @else {
                    @for (item of filteredQueue(); track item.id) {
                      <div [class]="'queue-item priority-stripe-' + item.priority">
                        <div class="queue-item-header">
                          <div class="queue-item-id">
                            <span class="case-num">{{ item.case_number }}</span>
                            <span class="queue-state-tag">{{ item.state }}</span>
                          </div>
                          <div class="queue-item-badges">
                            <span [class]="'chip priority-' + item.priority">{{ item.priority | titlecase }}</span>
                            <span [class]="'chip status-' + item.status">{{ formatQueueStatus(item.status) }}</span>
                          </div>
                        </div>
                        <div class="queue-item-body">
                          <span class="queue-driver">{{ item.customer_name }}</span>
                          <span class="queue-sep">&middot;</span>
                          <span class="queue-violation">{{ item.violation_type }}</span>
                        </div>
                        <div class="queue-item-actions">
                          <mat-form-field appearance="outline" class="assign-field">
                            <mat-label>{{ 'ADMIN.ASSIGN_OPERATOR' | translate }}</mat-label>
                            <mat-select (selectionChange)="assignOperator(item.id, $event.value)">
                              @for (op of operators(); track op.id) {
                                <mat-option [value]="op.id">{{ op.name }} ({{ op.activeCaseCount }})</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                          <mat-form-field appearance="outline" class="assign-field">
                            <mat-label>{{ 'ADMIN.ASSIGN_ATTORNEY' | translate }}</mat-label>
                            <mat-select (selectionChange)="assignAttorney(item.id, $event.value)">
                              @for (att of attorneys(); track att.id) {
                                <mat-option [value]="att.id">{{ att.full_name }} ({{ att.active_cases || 0 }})</mat-option>
                              }
                            </mat-select>
                          </mat-form-field>
                          <button mat-flat-button
                                  color="primary"
                                  class="auto-assign-btn"
                                  (click)="autoAssign(item.id)"
                                  [disabled]="assigningCaseId() === item.id">
                            @if (assigningCaseId() === item.id) {
                              <mat-spinner diameter="16"></mat-spinner>
                            } @else {
                              <ng-container>
                                <mat-icon>auto_fix_high</mat-icon>
                                {{ 'ADMIN.AUTO_ASSIGN' | translate }}
                              </ng-container>
                            }
                          </button>
                        </div>
                      </div>
                    }
                  }
                </mat-card-content>
              </mat-card>

              <!-- Recent cases -->
              <mat-card class="section-card">
                <mat-card-header>
                  <mat-card-title>{{ 'ADMIN.RECENT_CASES' | translate }}</mat-card-title>
                  <div class="card-action">
                    <button mat-button (click)="viewAllCases()">{{ 'ADMIN.VIEW_ALL' | translate }}</button>
                  </div>
                </mat-card-header>
                <mat-card-content>
                  @if (recentCases().length === 0) {
                    <div class="empty-state" role="status">
                      <mat-icon aria-hidden="true">folder_open</mat-icon>
                      <p class="empty-title">{{ 'ADMIN.NO_CASES_YET' | translate }}</p>
                      <p class="empty-hint">{{ 'ADMIN.CASES_WILL_APPEAR' | translate }}</p>
                      <button mat-stroked-button color="primary" (click)="viewAllCases()">{{ 'ADMIN.VIEW_ALL_CASES' | translate }}</button>
                    </div>
                  } @else {
                    @for (c of recentCases(); track c.id) {
                      <div class="case-row"
                           role="button"
                           tabindex="0"
                           (click)="viewCase(c)"
                           (keydown.enter)="viewCase(c)"
                           [attr.aria-label]="'View case ' + c.case_number">
                        <div class="case-info">
                          <span class="case-num">{{ c.case_number }}</span>
                          <span class="case-client">{{ c.customer_name }}</span>
                          <span class="case-type">{{ c.violation_type }}</span>
                        </div>
                        <div class="case-staff">
                          @if (c.attorney_name) {
                            <span class="staff-label"><mat-icon class="staff-icon">gavel</mat-icon> {{ c.attorney_name }}</span>
                          }
                          @if (c.operator_name) {
                            <span class="staff-label"><mat-icon class="staff-icon">support_agent</mat-icon> {{ c.operator_name }}</span>
                          }
                        </div>
                        <div class="case-badges">
                          <span [class]="'badge status-' + c.status">{{ getStatusLabel(c.status) }}</span>
                        </div>
                      </div>
                      <mat-divider></mat-divider>
                    }
                  }
                </mat-card-content>
              </mat-card>

              <!-- Staff workload -->
              @if (workload().length > 0) {
                <mat-card class="section-card">
                  <mat-card-header><mat-card-title>{{ 'ADMIN.STAFF_WORKLOAD' | translate }}</mat-card-title></mat-card-header>
                  <mat-card-content>
                    @for (w of workload(); track w.id) {
                      <div class="workload-row">
                        <span class="staff-name">{{ w.name }}</span>
                        <span class="workload-num">{{ w.activeCases }}/{{ w.capacity }}</span>
                        <span [class]="'util-badge ' + (w.utilization >= 90 ? 'over' : w.utilization >= 70 ? 'high' : 'ok')">
                          {{ w.utilization.toFixed(0) }}%
                        </span>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-tab>

          <!-- ── Tab 1: By Operator ── -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">view_column</mat-icon>
              <span class="tab-text">{{ 'ADMIN.TAB_BY_OPERATOR' | translate }}</span>
              <span class="tab-badge warn" [attr.aria-label]="'Unassigned cases: ' + unassignedCount()">
                {{ unassignedCount() }}
              </span>
            </ng-template>
            @if (byOperatorLoaded()) {
              <div class="tab-content">
                <app-admin-operator-kanban></app-admin-operator-kanban>
              </div>
            }
          </mat-tab>

          <!-- ── Tab 2: By Status ── -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">view_kanban</mat-icon>
              <span class="tab-text">{{ 'ADMIN.TAB_BY_STATUS' | translate }}</span>
              <span class="tab-badge" [attr.aria-label]="'In-progress cases: ' + inProgressCount()">
                {{ inProgressCount() }}
              </span>
            </ng-template>
            @if (byStatusLoaded()) {
              <div class="tab-content">
                <app-operator-kanban [cases]="allCasesForStatusKanban()" (caseUpdated)="onStatusKanbanUpdated()"></app-operator-kanban>
              </div>
            }
          </mat-tab>

          <!-- ── Tab 3: Archive ── -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">archive</mat-icon>
              <span class="tab-text">{{ 'ADMIN.TAB_ARCHIVE' | translate }}</span>
              <span class="tab-badge muted" [attr.aria-label]="'Archived cases: ' + archiveCases().length">
                {{ archiveCases().length }}
              </span>
            </ng-template>
            @if (archiveLoaded()) {
              <div class="tab-content archive-content">
                <mat-form-field appearance="outline" class="archive-search">
                  <mat-label>{{ 'ADMIN.SEARCH_ARCHIVE' | translate }}</mat-label>
                  <input matInput
                         [ngModel]="archiveSearch()"
                         (ngModelChange)="archiveSearch.set($event)"
                         [placeholder]="'ADMIN.SEARCH_ARCHIVE' | translate" />
                  <mat-icon matPrefix>search</mat-icon>
                </mat-form-field>

                @if (filteredArchive().length === 0) {
                  <div class="empty-state" role="status">
                    <mat-icon aria-hidden="true">archive</mat-icon>
                    <p class="empty-title">{{ 'ADMIN.NO_ARCHIVED_CASES' | translate }}</p>
                  </div>
                } @else {
                  @for (c of filteredArchive(); track c.id) {
                    <div class="archive-row"
                         role="button"
                         tabindex="0"
                         (click)="viewCase(c)"
                         (keydown.enter)="viewCase(c)"
                         [attr.aria-label]="'View archived case ' + c.case_number">
                      <div class="archive-info">
                        <span class="case-num">{{ c.case_number }}</span>
                        <span class="archive-client">{{ c.customer_name }}</span>
                      </div>
                      <span class="archive-type">{{ c.violation_type }}</span>
                      <span [class]="'badge status-' + c.status">{{ getStatusLabel(c.status) }}</span>
                    </div>
                  }
                }
              </div>
            }
          </mat-tab>

        </mat-tab-group>

      }
    </div>
  `,
  styles: [`
    /* --- Layout --- */
    .admin-dash { max-width: 1100px; margin: 0 auto; padding: 24px 16px; }

    /* --- Page header --- */
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }

    /* --- Stat cards --- */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card { position: relative; overflow: hidden; }
    .stat-card mat-card-content { padding: 14px 16px; }
    .stat-icon {
      width: 36px; height: 36px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 8px;
    }
    .stat-icon mat-icon { color: #fff; font-size: 20px; width: 20px; height: 20px; }
    .bg-blue   { background: linear-gradient(135deg, #1976d2, #42a5f5); }
    .bg-green  { background: linear-gradient(135deg, #388e3c, #66bb6a); }
    .bg-amber  { background: linear-gradient(135deg, #f57c00, #ffb74d); }
    .bg-purple { background: linear-gradient(135deg, #7b1fa2, #ba68c8); }
    .border-blue   { border-left: 4px solid #1976d2; }
    .border-green  { border-left: 4px solid #388e3c; }
    .border-amber  { border-left: 4px solid #f57c00; }
    .border-purple { border-left: 4px solid #7b1fa2; }
    .stat-lbl { margin: 0; font-size: 0.72rem; color: #888; text-transform: uppercase; letter-spacing: 0.3px; }
    .stat-val { margin: 4px 0 0; font-size: 1.5rem; font-weight: 700; }
    .stat-val.active { color: #1976d2; }
    .stat-val.pending { color: #f57c00; }
    .stat-val.resolved { color: #388e3c; }
    .stat-delta { margin: 2px 0 0; font-size: 0.72rem; font-weight: 600; }
    .stat-delta.up { color: #388e3c; }
    .stat-delta.down { color: #d32f2f; }

    /* --- Tabs --- */
    .admin-tabs { margin-bottom: 20px; }
    .tab-icon { margin-right: 6px; font-size: 18px; width: 18px; height: 18px; }
    .tab-text { margin-right: 6px; }
    .tab-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; padding: 0 6px;
      border-radius: 10px; font-size: 0.7rem; font-weight: 600;
      background: #e3f2fd; color: #1565c0;
    }
    .tab-badge.warn { background: #fff3e0; color: #e65100; }
    .tab-badge.muted { background: #f5f5f5; color: #616161; }
    .tab-content { padding-top: 16px; }

    /* --- Charts --- */
    .charts-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .chart-card mat-card-header { padding-bottom: 0; }
    .chart-wrap { position: relative; height: 250px; }
    .chart-wrap canvas { width: 100% !important; height: 100% !important; }

    /* --- Section cards --- */
    .section-card { margin-bottom: 16px; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-action { margin-left: auto; }

    /* --- Queue filters --- */
    .queue-filters {
      display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 12px;
    }
    .filter-field { font-size: 0.85rem; }
    .filter-field.search-field { flex: 1 1 200px; min-width: 180px; }
    .filter-field:not(.search-field) { flex: 0 1 160px; min-width: 130px; }
    .filter-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .clear-btn { flex-shrink: 0; height: 56px; min-height: 44px; }

    /* --- Queue items (card style) --- */
    .queue-item {
      background: #fafbfc; border-radius: 10px; padding: 14px 16px; margin-bottom: 10px;
      border-left: 4px solid #e0e0e0; transition: box-shadow 0.2s, transform 0.15s;
    }
    .queue-item:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
    .queue-item.priority-stripe-high   { border-left-color: #e65100; }
    .queue-item.priority-stripe-medium { border-left-color: #1565c0; }
    .queue-item.priority-stripe-low    { border-left-color: #9e9e9e; }
    .queue-item.priority-stripe-urgent { border-left-color: #b71c1c; }
    .queue-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .queue-item-id { display: flex; align-items: center; gap: 8px; }
    .queue-state-tag {
      font-size: 0.7rem; font-weight: 700; color: #555; background: #eee;
      padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px;
    }
    .queue-item-badges { display: flex; gap: 6px; }
    .queue-item-body { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
    .queue-driver { font-size: 0.88rem; color: #333; font-weight: 500; }
    .queue-sep { color: #bbb; }
    .queue-violation { font-size: 0.82rem; color: #777; }
    .queue-item-actions {
      display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap;
      padding-top: 10px; border-top: 1px solid #eee;
    }
    .assign-field { font-size: 0.82rem; width: 190px; }
    .assign-field ::ng-deep .mat-mdc-form-field-infix { padding-top: 8px; padding-bottom: 8px; min-height: 40px; text-align: center; }
    .assign-field ::ng-deep .mat-mdc-select-value-text { text-align: left; }
    .assign-field ::ng-deep .mat-mdc-text-field-wrapper { height: 44px; }
    .assign-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .auto-assign-btn { font-size: 0.82rem; height: 44px; min-height: 44px; }
    .auto-assign-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }

    /* --- Chips (queue) --- */
    .chip {
      font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap;
    }
    .priority-high   { background: #fff3e0; color: #e65100; }
    .priority-medium { background: #e8eaf6; color: #283593; }
    .priority-low    { background: #e3f2fd; color: #1565c0; }
    .status-new         { background: #e3f2fd; color: #1565c0; }
    .status-assigned    { background: #e8f5e9; color: #2e7d32; }
    .status-in_progress { background: #fff3e0; color: #e65100; }

    /* --- Recent cases --- */
    .case-row { display: flex; align-items: center; gap: 16px; padding: 10px 8px; cursor: pointer; }
    .case-row:hover { background: #f5f7ff; border-radius: 6px; }
    .case-row:focus-visible { outline: 2px solid #1976d2; border-radius: 6px; }
    .case-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .case-num { font-weight: 600; font-size: 0.9rem; }
    .case-client { font-size: 0.82rem; color: #444; }
    .case-type { font-size: 0.78rem; color: #888; }
    .case-staff { display: flex; flex-direction: column; gap: 4px; width: 180px; flex-shrink: 0; }
    .staff-label { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: #555; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .staff-icon { font-size: 14px; width: 14px; height: 14px; color: #888; }
    .case-badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; width: 160px; flex-shrink: 0; }
    .badge { font-size: 0.7rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
    .badge.status-new { background: #e3f2fd; color: #1565c0; }
    .badge.status-assigned { background: #e8f5e9; color: #2e7d32; }
    .badge.status-in_progress { background: #fff3e0; color: #e65100; }
    .badge.status-pending_court { background: #fff8e1; color: #f57f17; }
    .badge.status-resolved { background: #e8f5e9; color: #1b5e20; }
    .badge.status-closed { background: #f5f5f5; color: #616161; }
    .badge.priority-low { background: #f5f5f5; color: #616161; }
    .badge.priority-medium { background: #fff3e0; color: #e65100; }
    .badge.priority-high { background: #fce4ec; color: #880e4f; }
    .badge.priority-urgent { background: #ffebee; color: #b71c1c; }

    /* --- Empty state --- */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: #999; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ccc; }
    .empty-title { margin: 4px 0 0; font-size: 1rem; font-weight: 500; color: #666; }
    .empty-hint { margin: 0; font-size: 0.82rem; color: #999; }

    /* --- Staff workload --- */
    .workload-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
    .staff-name { flex: 1; font-size: 0.9rem; }
    .workload-num { font-size: 0.82rem; color: #666; }
    .util-badge { font-size: 0.72rem; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
    .util-badge.ok   { background: #e8f5e9; color: #2e7d32; }
    .util-badge.high { background: #fff3e0; color: #e65100; }
    .util-badge.over { background: #ffebee; color: #c62828; }

    /* --- Archive --- */
    .archive-content { max-width: 900px; }
    .archive-search { width: 100%; max-width: 400px; margin-bottom: 12px; }
    .archive-search ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    .archive-row {
      display: flex; align-items: center; gap: 16px; padding: 10px 8px;
      cursor: pointer; border-bottom: 1px solid #f0f0f0;
    }
    .archive-row:hover { background: #f5f7ff; border-radius: 6px; }
    .archive-row:focus-visible { outline: 2px solid #1976d2; border-radius: 6px; }
    .archive-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .archive-client { font-size: 0.82rem; color: #444; }
    .archive-type { font-size: 0.82rem; color: #777; width: 140px; flex-shrink: 0; }

    /* --- Responsive --- */
    @media (max-width: 1024px) {
      .charts-row { grid-template-columns: 1fr 1fr; }
      .charts-row .chart-card:last-child { grid-column: 1 / -1; }
    }
    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
      .charts-row .chart-card:last-child { grid-column: auto; }
      .stat-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
      .queue-filters { flex-direction: column; }
      .filter-field, .filter-field.search-field { flex: 1 1 100%; min-width: 0; }
      .queue-item-actions { flex-direction: column; }
      .assign-field { width: 100%; }
      .case-row { flex-wrap: wrap; }
      .case-staff { width: auto; flex-shrink: 1; }
      .case-badges { width: auto; }
      .archive-row { flex-wrap: wrap; }
      .archive-type { width: auto; }
    }
    @media (max-width: 480px) {
      .admin-dash { padding: 16px 8px; }
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private adminService = inject(AdminService);
  private caseService = inject(CaseService);
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private router = inject(Router);

  /* --- ViewChild canvas refs --- */
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('violationChart') violationChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workloadChart') workloadChartRef!: ElementRef<HTMLCanvasElement>;

  /* --- Chart.js instances --- */
  private statusChartInstance: Chart | null = null;
  private violationChartInstance: Chart | null = null;
  private workloadChartInstance: Chart | null = null;

  /* --- State signals --- */
  stats = signal<DashboardStats | null>(null);
  recentCases = signal<any[]>([]);
  workload = signal<any[]>([]);
  caseQueue = signal<any[]>([]);
  operators = signal<any[]>([]);
  attorneys = signal<any[]>([]);
  loading = signal(true);
  error = signal('');
  assigningCaseId = signal<string | null>(null);

  /* --- Queue filter signals --- */
  searchTerm = signal('');
  queueStatusFilter = signal('');
  queuePriorityFilter = signal('');

  /* --- Tab signals --- */
  activeTab = signal(this.readSavedTab());
  byOperatorLoaded = signal(false);
  byStatusLoaded = signal(false);
  archiveLoaded = signal(false);
  archiveCases = signal<any[]>([]);
  archiveSearch = signal('');
  allCasesForStatusKanban = signal<any[]>([]);

  /* --- Tab persistence effect --- */
  private _tabPersist = effect(() => {
    try { localStorage.setItem('admin_active_tab', this.activeTab().toString()); } catch { /* noop */ }
  });

  /* --- Computed --- */
  revenueChange = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    if (!s.revenueLastMonth) return s.revenueThisMonth ? 100 : 0;
    return ((s.revenueThisMonth - s.revenueLastMonth) / s.revenueLastMonth) * 100;
  });

  pendingRevenue = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    return Math.round((s.pendingCases ?? 0) * 420);
  });

  weeklyChange = computed(() => {
    const s = this.stats();
    if (!s) return 0;
    if (!s.casesLastWeek) return s.casesThisWeek > 0 ? 100 : 0;
    return ((s.casesThisWeek - s.casesLastWeek) / s.casesLastWeek) * 100;
  });

  unassignedCount = computed(() =>
    this.caseQueue().filter((c: any) => !c.assigned_operator_id).length,
  );

  inProgressCount = computed(() => this.stats()?.activeCases ?? 0);

  filteredQueue = computed(() => {
    let items = this.caseQueue();
    const term = this.searchTerm().toLowerCase().trim();
    const statusF = this.queueStatusFilter();
    const priorityF = this.queuePriorityFilter();

    if (term) {
      items = items.filter(
        (i: any) =>
          (i.case_number || '').toLowerCase().includes(term) ||
          (i.customer_name || '').toLowerCase().includes(term) ||
          (i.violation_type || '').toLowerCase().includes(term) ||
          (i.state || '').toLowerCase().includes(term),
      );
    }
    if (statusF) {
      items = items.filter((i: any) => i.status === statusF);
    }
    if (priorityF) {
      items = items.filter((i: any) => i.priority === priorityF);
    }
    return items;
  });

  filteredArchive = computed(() => {
    const term = this.archiveSearch().toLowerCase().trim();
    if (!term) return this.archiveCases();
    return this.archiveCases().filter(
      (c: any) =>
        (c.case_number || '').toLowerCase().includes(term) ||
        (c.customer_name || '').toLowerCase().includes(term),
    );
  });

  /* --- Lifecycle --- */
  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts are created once the first data load completes (see buildCharts)
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  /* --- Tab management --- */
  private readSavedTab(): number {
    try {
      const val = parseInt(localStorage.getItem('admin_active_tab') ?? '0', 10);
      return val >= 0 && val <= 3 ? val : 0;
    } catch {
      return 0;
    }
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);

    if (index === 0) {
      // Rebuild charts when returning to Tab 0 (canvas may have been hidden)
      setTimeout(() => this.buildCharts());
    }
    if (index === 1 && !this.byOperatorLoaded()) {
      this.byOperatorLoaded.set(true);
    }
    if (index === 2 && !this.byStatusLoaded()) {
      this.loadAllCasesForStatusKanban();
      this.byStatusLoaded.set(true);
    }
    if (index === 3 && !this.archiveLoaded()) {
      this.loadArchive();
      this.archiveLoaded.set(true);
    }
  }

  /* --- Data loading --- */
  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');

    // Admin stats
    this.adminService.getDashboardStats().pipe(
      catchError(() => of(null)),
    ).subscribe({
      next: (s) => { if (s) this.stats.set(s); },
    });

    // Recent cases (controls loading spinner)
    this.adminService.getAllCases({ limit: 10 }).subscribe({
      next: (resp) => {
        this.recentCases.set(resp.cases || []);
        this.loading.set(false);
        if (this.activeTab() === 0) {
          setTimeout(() => this.buildCharts());
        }
      },
      error: () => {
        this.error.set('ADMIN.FAILED_LOAD');
        this.loading.set(false);
      },
    });

    // Staff workload
    this.adminService.getWorkloadDistribution().pipe(
      catchError(() => of({ staff: [] })),
    ).subscribe({
      next: (resp) => this.workload.set(resp.staff || []),
    });

    // Case queue (active cases — not closed/resolved)
    this.adminService.getAllCases({ limit: 50 }).pipe(
      catchError(() => of({ cases: [], total: 0 })),
    ).subscribe({
      next: (resp) => {
        const cases = (resp.cases || [])
          .filter((c: any) => c.status !== 'closed' && c.status !== 'resolved')
          .map((c: any) => ({ ...c, priority: agePriority(c.ageHours || 0) }));
        this.caseQueue.set(cases);
      },
    });

    // Load operators
    this.adminService.getOperators().pipe(
      catchError(() => of({ operators: [] })),
    ).subscribe({
      next: (resp) => this.operators.set(resp.operators || []),
    });

    // Load attorneys for assignment dropdown
    this.loadAttorneys();
  }

  private loadAttorneys(): void {
    this.caseService.getAvailableAttorneys().pipe(
      catchError(() => of({ attorneys: [] })),
    ).subscribe((resp: any) => {
      this.attorneys.set(resp.attorneys || []);
    });
  }

  private loadAllCasesForStatusKanban(): void {
    this.adminService.getAllCases({ limit: 500 }).pipe(
      catchError(() => of({ cases: [], total: 0 })),
    ).subscribe((resp) => {
      const cases = (resp.cases || []).filter(
        (c: any) => c.status !== 'closed' && c.status !== 'resolved',
      );
      this.allCasesForStatusKanban.set(cases);
    });
  }

  private loadArchive(): void {
    this.adminService.getAllCases({ status: 'closed,resolved', limit: 100 }).pipe(
      catchError(() => of({ cases: [], total: 0 })),
    ).subscribe((resp) => {
      this.archiveCases.set(resp.cases || []);
    });
  }

  onStatusKanbanUpdated(): void {
    this.loadAllCasesForStatusKanban();
    this.loadDashboardData();
  }

  refresh(): void {
    this.destroyCharts();
    this.loadDashboardData();

    // Also refresh data for the current tab
    const tab = this.activeTab();
    if (tab === 2 && this.byStatusLoaded()) {
      this.loadAllCasesForStatusKanban();
    }
    if (tab === 3 && this.archiveLoaded()) {
      this.loadArchive();
    }
  }

  /* --- Charts --- */
  private buildCharts(): void {
    this.destroyCharts();
    this.buildStatusChart();
    this.buildViolationChart();
    this.buildAttorneyWorkloadChart();
  }

  private buildStatusChart(): void {
    if (!this.statusChartRef) return;

    this.adminService.getChartData('status-distribution').pipe(
      catchError(() => of(null)),
    ).subscribe((chartData) => {
      if (!chartData || !this.statusChartRef) return;
      const labels = chartData.labels.map((l: string) => STATUS_LABELS[l] || l);
      this.statusChartInstance = new Chart(this.statusChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: chartData.data,
            backgroundColor: ['#1976d2', '#f57c00', '#388e3c', '#7b1fa2', '#ff5722', '#9e9e9e', '#00bcd4', '#795548', '#607d8b', '#e91e63', '#4caf50'],
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          },
        },
      });
    });
  }

  private buildViolationChart(): void {
    if (!this.violationChartRef) return;

    this.adminService.getChartData('violation-distribution').pipe(
      catchError(() => of(null)),
    ).subscribe((chartData) => {
      if (!chartData || !this.violationChartRef) return;

      this.violationChartInstance = new Chart(this.violationChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [{
            label: 'Cases',
            data: chartData.data,
            backgroundColor: '#42a5f5',
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { font: { size: 10 } } },
            x: { ticks: { font: { size: 10 }, maxRotation: 45 } },
          },
        },
      });
    });
  }

  private buildAttorneyWorkloadChart(): void {
    if (!this.workloadChartRef) return;

    this.adminService.getChartData('attorney-workload').pipe(
      catchError(() => of(null)),
    ).subscribe((chartData) => {
      if (!chartData || !this.workloadChartRef) return;

      this.workloadChartInstance = new Chart(this.workloadChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: chartData.labels,
          datasets: [{
            label: 'Cases',
            data: chartData.data,
            backgroundColor: '#7b1fa2',
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { font: { size: 10 } } },
            y: { ticks: { font: { size: 11 } } },
          },
        },
      });
    });
  }

  private destroyCharts(): void {
    this.statusChartInstance?.destroy();
    this.statusChartInstance = null;
    this.violationChartInstance?.destroy();
    this.violationChartInstance = null;
    this.workloadChartInstance?.destroy();
    this.workloadChartInstance = null;
  }

  /* --- Queue actions --- */
  autoAssign(caseId: string): void {
    this.assigningCaseId.set(caseId);
    this.dashboardService.autoAssignCase(caseId).pipe(
      catchError(() => of(null)),
    ).subscribe({
      next: () => {
        this.caseQueue.update((queue) =>
          queue.map((item: any) =>
            item.id === caseId ? { ...item, status: 'assigned_to_attorney' } : item,
          ),
        );
        this.assigningCaseId.set(null);
      },
      error: () => this.assigningCaseId.set(null),
    });
  }

  assignOperator(caseId: string, operatorId: string): void {
    this.adminService.assignOperator(caseId, operatorId).pipe(
      catchError(() => of(null)),
    ).subscribe(() => {
      this.caseQueue.update((queue) =>
        queue.map((item: any) =>
          item.id === caseId ? { ...item, assigned_operator_id: operatorId } : item,
        ),
      );
    });
  }

  assignAttorney(caseId: string, attorneyId: string): void {
    this.adminService.assignAttorney(caseId, attorneyId).pipe(
      catchError(() => of(null)),
    ).subscribe(() => {
      this.caseQueue.update((queue) =>
        queue.map((item: any) =>
          item.id === caseId ? { ...item, assigned_attorney_id: attorneyId, status: 'assigned_to_attorney' } : item,
        ),
      );
    });
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.queueStatusFilter.set('');
    this.queuePriorityFilter.set('');
  }

  /* --- Navigation --- */
  viewCase(c: any): void { this.router.navigate(['/admin/cases', c.id]); }
  viewAllCases(): void { this.router.navigate(['/admin/cases']); }

  /* --- Formatters --- */
  getStatusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  formatQueueStatus(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  }
}

import {
  Component, OnInit, DestroyRef, signal, computed, ChangeDetectionStrategy, inject, effect,
} from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { CaseService } from '../../../core/services/case.service';
import { AuthService } from '../../../core/services/auth.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { OperatorKanbanComponent } from '../kanban/operator-kanban.component';

/* ------------------------------------------------------------------ */
/*  Mock data — fallback when API returns empty                        */
/* ------------------------------------------------------------------ */
const MOCK_MY_CASES: any[] = [
  { id: 'c1', case_number: 'CDL-2026-601', status: 'reviewed', state: 'TX', violation_type: 'Speeding 20+ Over', created_at: '2026-03-08T10:30:00Z', customer_name: 'Marcus Rivera', ageHours: 72, fine_amount: 350, court_date: '2026-04-10T09:00:00Z', courthouse: 'Harris County Court', priority: 'high' },
  { id: 'c2', case_number: 'CDL-2026-602', status: 'assigned_to_attorney', state: 'CA', violation_type: 'Overweight Load', created_at: '2026-03-09T14:15:00Z', customer_name: 'Jennifer Walsh', ageHours: 44, fine_amount: 500, court_date: '2026-03-20T10:00:00Z', courthouse: 'LA Traffic Court', priority: 'medium' },
  { id: 'c3', case_number: 'CDL-2026-603', status: 'waiting_for_driver', state: 'FL', violation_type: 'Logbook Violation', created_at: '2026-03-10T08:45:00Z', customer_name: 'Ahmed Hassan', ageHours: 26, fine_amount: null, court_date: null, courthouse: null, priority: 'medium' },
];

const MOCK_UNASSIGNED: any[] = [
  { id: 'u1', case_number: 'CDL-2026-610', status: 'new', state: 'NY', violation_type: 'Improper Lane Change', created_at: '2026-03-10T16:20:00Z', customer_name: 'Sarah Kim', ageHours: 18, requested: false, fine_amount: 200, court_date: null, courthouse: null, priority: 'low' },
  { id: 'u2', case_number: 'CDL-2026-611', status: 'new', state: 'IL', violation_type: 'Following Too Closely', created_at: '2026-03-09T11:00:00Z', customer_name: 'Robert Jackson', ageHours: 47, requested: false, fine_amount: 450, court_date: '2026-03-15T14:00:00Z', courthouse: 'Cook County Court', priority: 'high' },
  { id: 'u3', case_number: 'CDL-2026-612', status: 'submitted', state: 'GA', violation_type: 'Equipment Violation', created_at: '2026-03-10T09:30:00Z', customer_name: 'Maria Gonzalez', ageHours: 24, requested: true, fine_amount: null, court_date: null, courthouse: null, priority: 'medium' },
];

const MOCK_SUMMARY = { assignedToMe: 3, inProgress: 2, resolvedToday: 0, pendingApproval: 1 };

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

const STATUS_LABELS: Record<string, string> = {
  new: 'OPR.STATUS_NEW',
  submitted: 'OPR.STATUS_NEW',
  reviewed: 'OPR.STATUS_IN_PROGRESS',
  assigned_to_attorney: 'OPR.STATUS_ASSIGNED',
  send_info_to_attorney: 'OPR.STATUS_IN_PROGRESS',
  waiting_for_driver: 'OPR.STATUS_IN_PROGRESS',
  call_court: 'OPR.STATUS_PENDING_COURT',
  check_with_manager: 'OPR.STATUS_CHECK_MANAGER',
  pay_attorney: 'OPR.STATUS_PAY_ATTORNEY',
  attorney_paid: 'OPR.STATUS_ATTORNEY_PAID',
  resolved: 'OPR.STATUS_RESOLVED',
  closed: 'OPR.STATUS_CLOSED',
  in_progress: 'OPR.STATUS_IN_PROGRESS',
};

@Component({
  selector: 'app-operator-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule, DatePipe, CurrencyPipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatChipsModule, MatRippleModule, MatTabsModule,
    TranslateModule, SkeletonLoaderComponent, OperatorKanbanComponent,
  ],
  template: `
    <div class="op-dash">

      <!-- ====== PAGE HEADER ====== -->
      <header class="page-header">
        <div class="header-text">
          <h1>{{ 'OPR.DASHBOARD' | translate }}</h1>
          <p class="subtitle">{{ 'OPR.DASHBOARD_SUBTITLE' | translate }}</p>
        </div>
        <div class="header-actions">
          @if (activeTab() === 0) {
            <div class="view-toggle" role="tablist" [attr.aria-label]="'OPR.KANBAN.VIEW_TOGGLE' | translate">
              <button mat-icon-button
                      [class.toggle-active]="view() === 'list'"
                      (click)="view.set('list')"
                      role="tab"
                      [attr.aria-selected]="view() === 'list'"
                      [attr.aria-label]="'OPR.KANBAN.LIST_VIEW' | translate">
                <mat-icon>view_list</mat-icon>
              </button>
              <button mat-icon-button
                      [class.toggle-active]="view() === 'kanban'"
                      (click)="view.set('kanban')"
                      role="tab"
                      [attr.aria-selected]="view() === 'kanban'"
                      [attr.aria-label]="'OPR.KANBAN.BOARD_VIEW' | translate">
                <mat-icon>view_kanban</mat-icon>
              </button>
            </div>
          }
          <button mat-icon-button
                  class="refresh-btn"
                  (click)="refresh()"
                  [matTooltip]="'OPR.REFRESH' | translate"
                  aria-label="Refresh dashboard">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </header>

      @if (loading()) {
        <app-skeleton-loader [rows]="4" [height]="68"></app-skeleton-loader>
      } @else {

        <!-- ====== STAT CARDS ====== -->
        <div class="stat-grid" role="region" aria-label="Case statistics">
          <mat-card class="stat-card" appearance="outlined">
            <div class="stat-icon-wrap blue-gradient"><mat-icon>assignment_ind</mat-icon></div>
            <div class="stat-body">
              <span class="stat-label">{{ 'OPR.ASSIGNED_TO_ME' | translate }}</span>
              <span class="stat-value">{{ summary().assignedToMe }}</span>
            </div>
          </mat-card>
          <mat-card class="stat-card" appearance="outlined">
            <div class="stat-icon-wrap amber-gradient"><mat-icon>pending_actions</mat-icon></div>
            <div class="stat-body">
              <span class="stat-label">{{ 'OPR.IN_PROGRESS' | translate }}</span>
              <span class="stat-value amber-text">{{ summary().inProgress }}</span>
            </div>
          </mat-card>
          <mat-card class="stat-card" appearance="outlined">
            <div class="stat-icon-wrap green-gradient"><mat-icon>check_circle</mat-icon></div>
            <div class="stat-body">
              <span class="stat-label">{{ 'OPR.RESOLVED_TODAY' | translate }}</span>
              <span class="stat-value green-text">{{ summary().resolvedToday }}</span>
            </div>
          </mat-card>
          <mat-card class="stat-card" appearance="outlined">
            <div class="stat-icon-wrap purple-gradient"><mat-icon>hourglass_top</mat-icon></div>
            <div class="stat-body">
              <span class="stat-label">{{ 'OPR.PENDING_APPROVAL' | translate }}</span>
              <span class="stat-value">{{ summary().pendingApproval }}</span>
            </div>
          </mat-card>
        </div>

        <!-- ====== TABBED NAVIGATION ====== -->
        <mat-tab-group [selectedIndex]="activeTab()"
                       (selectedIndexChange)="onTabChange($event)"
                       animationDuration="200ms"
                       class="dash-tabs">
          <!-- TAB 0: My Cases -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>folder_open</mat-icon>
              <span class="tab-label-text">{{ 'OPR.TAB_MY_CASES' | translate }}</span>
              <span class="tab-badge">{{ myCases().length }}</span>
            </ng-template>

            <!-- KANBAN VIEW -->
            @if (view() === 'kanban') {
              <section class="tab-content" aria-label="Kanban board">
                <app-operator-kanban
                  [cases]="myCases()"
                  (caseUpdated)="refresh()">
                </app-operator-kanban>
              </section>
            }

            <!-- LIST VIEW -->
            @if (view() === 'list') {
              <section class="tab-content" aria-label="My assigned cases">
                <mat-form-field appearance="outline" class="search-field">
                  <mat-label>{{ 'OPR.SEARCH_PLACEHOLDER' | translate }}</mat-label>
                  <input matInput
                         [ngModel]="mySearch()"
                         (ngModelChange)="mySearch.set($event)" />
                  <mat-icon matPrefix>search</mat-icon>
                </mat-form-field>

                @if (filteredMyCases().length === 0) {
                  <div class="empty-state" role="status">
                    <div class="empty-icon-wrap">
                      <mat-icon aria-hidden="true">inbox</mat-icon>
                    </div>
                    <p class="empty-title">{{ 'OPR.NO_ASSIGNED_CASES' | translate }}</p>
                  </div>
                } @else {
                  <div class="table-header" aria-hidden="true">
                    <span class="th-case">{{ 'OPR.CASE' | translate: { Default: 'Case' } }}</span>
                    <span class="th-violation">{{ 'OPR.VIOLATION' | translate: { Default: 'Violation' } }}</span>
                    <span class="th-status">{{ 'OPR.STATUS' | translate: { Default: 'Status' } }}</span>
                    <span class="th-court">{{ 'OPR.COURT_DATE' | translate: { Default: 'Court' } }}</span>
                    <span class="th-fine">{{ 'OPR.FINE' | translate: { Default: 'Fine' } }}</span>
                    <span class="th-age">{{ 'OPR.AGE' | translate: { Default: 'Age' } }}</span>
                  </div>

                  @for (c of filteredMyCases(); track c.id) {
                    <div class="case-row"
                         matRipple
                         role="button"
                         tabindex="0"
                         (click)="viewCase(c.id)"
                         (keydown.enter)="viewCase(c.id)"
                         [attr.aria-label]="'View case ' + c.case_number">
                      <div class="cell-case">
                        <div class="case-name-row">
                          <span class="priority-dot"
                                [class.priority-critical]="c.priority === 'critical'"
                                [class.priority-high]="c.priority === 'high'"
                                [class.priority-medium]="c.priority === 'medium'"
                                [class.priority-low]="c.priority === 'low'"
                                [matTooltip]="getPriorityLabel(c.priority)"
                                role="img"
                                [attr.aria-label]="(c.priority || 'low') + ' priority'"></span>
                          <span class="case-num">{{ c.case_number }}</span>
                        </div>
                        <span class="case-client">{{ c.customer_name }}</span>
                      </div>
                      <div class="cell-violation">
                        <span class="violation-text">{{ c.violation_type }}</span>
                        <span class="state-badge">{{ c.state }}</span>
                      </div>
                      <div class="cell-status">
                        <span [class]="'status-chip status-' + c.status">
                          {{ getStatusKey(c.status) | translate }}
                        </span>
                      </div>
                      <div class="cell-court">
                        @if (c.court_date) {
                          <span class="court-text" [matTooltip]="c.courthouse || ''">
                            {{ c.court_date | date:'mediumDate' }}
                          </span>
                        } @else {
                          <span class="cell-dash">&mdash;</span>
                        }
                      </div>
                      <div class="cell-fine">
                        @if (c.fine_amount != null) {
                          <span class="fine-text">{{ c.fine_amount | currency:'USD':'symbol':'1.0-0' }}</span>
                        } @else {
                          <span class="cell-dash">&mdash;</span>
                        }
                      </div>
                      <div class="cell-age" [matTooltip]="'Created ' + c.created_at">
                        <mat-icon class="age-icon"
                                  [class.age-warning]="c.ageHours >= 24 && c.ageHours < 48"
                                  [class.age-urgent]="c.ageHours >= 48">schedule</mat-icon>
                        <span class="age-text"
                              [class.age-warning]="c.ageHours >= 24 && c.ageHours < 48"
                              [class.age-urgent]="c.ageHours >= 48">
                          {{ formatAge(c.ageHours ?? 0) }}
                        </span>
                      </div>
                      <mat-icon class="row-arrow">chevron_right</mat-icon>
                    </div>
                  }
                }
              </section>
            }
          </mat-tab>

          <!-- TAB 1: Unassigned Queue -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>queue</mat-icon>
              <span class="tab-label-text">{{ 'OPR.TAB_QUEUE' | translate }}</span>
              <span class="tab-badge queue-tab-badge">{{ unassignedCases().length }}</span>
            </ng-template>

            <section class="tab-content" aria-label="Unassigned case queue">
              <div class="priority-legend" role="img" aria-label="Priority color legend">
                <span class="legend-item"><span class="legend-dot priority-critical"></span> {{ 'OPR.PRIORITY_CRITICAL' | translate: { Default: 'Critical' } }}</span>
                <span class="legend-item"><span class="legend-dot priority-high"></span> {{ 'OPR.PRIORITY_HIGH' | translate: { Default: 'High' } }}</span>
                <span class="legend-item"><span class="legend-dot priority-medium"></span> {{ 'OPR.PRIORITY_MEDIUM' | translate: { Default: 'Medium' } }}</span>
                <span class="legend-item"><span class="legend-dot priority-low"></span> {{ 'OPR.PRIORITY_LOW' | translate: { Default: 'Low' } }}</span>
              </div>

              <mat-form-field appearance="outline" class="search-field">
                <mat-label>{{ 'OPR.SEARCH_PLACEHOLDER' | translate }}</mat-label>
                <input matInput
                       [ngModel]="queueSearch()"
                       (ngModelChange)="queueSearch.set($event)" />
                <mat-icon matPrefix>search</mat-icon>
              </mat-form-field>

              @if (sortedUnassigned().length === 0) {
                <div class="empty-state" role="status">
                  <div class="empty-icon-wrap">
                    <mat-icon aria-hidden="true">playlist_add_check</mat-icon>
                  </div>
                  <p class="empty-title">{{ 'OPR.NO_UNASSIGNED_CASES' | translate }}</p>
                </div>
              } @else {
                <div class="queue-grid">
                  @for (c of sortedUnassigned(); track c.id) {
                    <mat-card class="queue-card" appearance="outlined"
                              data-cy="queue-card"
                              [class.queue-card--requested]="c.requested">
                      <div class="priority-bar"
                           data-cy="priority-indicator"
                           [class.priority-bar-critical]="c.priority === 'critical'"
                           [class.priority-bar-high]="c.priority === 'high'"
                           [class.priority-bar-medium]="c.priority === 'medium'"
                           [class.priority-bar-low]="c.priority === 'low'"></div>
                      <div class="queue-card-body">
                        <div class="qc-header">
                          <span class="qc-number">{{ c.case_number }}</span>
                          <span class="qc-age"
                                [class.age-warning]="c.ageHours >= 24 && c.ageHours < 48"
                                [class.age-urgent]="c.ageHours >= 48"
                                [matTooltip]="'Created ' + c.created_at">
                            <mat-icon class="qc-age-icon">schedule</mat-icon>
                            {{ formatAge(c.ageHours ?? 0) }}
                          </span>
                        </div>
                        <p class="qc-client">{{ c.customer_name }}</p>
                        <div class="qc-details">
                          <span class="qc-detail-item" data-cy="violation-type">
                            <mat-icon class="qc-detail-icon">description</mat-icon>
                            {{ c.violation_type }}
                          </span>
                          <span class="qc-detail-item" data-cy="state">
                            <mat-icon class="qc-detail-icon">location_on</mat-icon>
                            {{ c.state }}
                          </span>
                          @if (c.court_date) {
                            <span class="qc-detail-item" data-cy="court-date">
                              <mat-icon class="qc-detail-icon">event</mat-icon>
                              {{ c.court_date | date:'mediumDate' }}
                            </span>
                          }
                          @if (c.fine_amount != null) {
                            <span class="qc-detail-item" data-cy="fine-amount">
                              <mat-icon class="qc-detail-icon">payments</mat-icon>
                              {{ c.fine_amount | currency:'USD':'symbol':'1.0-0' }}
                            </span>
                          }
                        </div>
                        <div class="qc-action">
                          @if (c.requested) {
                            <button mat-stroked-button disabled class="qc-requested-btn">
                              <mat-icon>hourglass_top</mat-icon>
                              {{ 'OPR.REQUESTED' | translate }}
                            </button>
                          } @else {
                            <button mat-flat-button
                                    class="qc-claim-btn"
                                    (click)="requestAssignment(c.id)"
                                    [disabled]="requestingId() === c.id">
                              @if (requestingId() === c.id) {
                                <mat-spinner diameter="18"></mat-spinner>
                              } @else {
                                <ng-container>
                                  <mat-icon>person_add</mat-icon>
                                  {{ 'OPR.REQUEST_ASSIGNMENT' | translate }}
                                </ng-container>
                              }
                            </button>
                          }
                        </div>
                      </div>
                    </mat-card>
                  }
                </div>
              }
            </section>
          </mat-tab>

          <!-- TAB 2: All Active Cases (Team View) -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>groups</mat-icon>
              <span class="tab-label-text">{{ 'OPR.TAB_ALL_CASES' | translate }}</span>
              @if (teamCasesLoaded()) {
                <span class="tab-badge">{{ teamCases().length }}</span>
              }
            </ng-template>

            <section class="tab-content" aria-label="All active cases">
              @if (teamCasesLoading()) {
                <app-skeleton-loader [rows]="4" [height]="52"></app-skeleton-loader>
              } @else {
                <mat-form-field appearance="outline" class="search-field">
                  <mat-label>{{ 'OPR.SEARCH_PLACEHOLDER' | translate }}</mat-label>
                  <input matInput
                         [ngModel]="teamSearch()"
                         (ngModelChange)="teamSearch.set($event)" />
                  <mat-icon matPrefix>search</mat-icon>
                </mat-form-field>

                @if (filteredTeamCases().length === 0) {
                  <div class="empty-state" role="status">
                    <div class="empty-icon-wrap">
                      <mat-icon aria-hidden="true">groups</mat-icon>
                    </div>
                    <p class="empty-title">{{ 'OPR.NO_TEAM_CASES' | translate }}</p>
                  </div>
                } @else {
                  <div class="table-header team-header" aria-hidden="true">
                    <span class="th-case">{{ 'OPR.CASE' | translate: { Default: 'Case' } }}</span>
                    <span class="th-violation">{{ 'OPR.VIOLATION' | translate: { Default: 'Violation' } }}</span>
                    <span class="th-status">{{ 'OPR.STATUS' | translate: { Default: 'Status' } }}</span>
                    <span class="th-operator">{{ 'OPR.OPERATOR' | translate: { Default: 'Operator' } }}</span>
                    <span class="th-age">{{ 'OPR.AGE' | translate: { Default: 'Age' } }}</span>
                  </div>

                  @for (c of filteredTeamCases(); track c.id) {
                    <div class="case-row team-row"
                         [class.case-row--mine]="c.assigned_operator_id === currentUserId"
                         matRipple
                         role="button"
                         tabindex="0"
                         (click)="viewCase(c.id)"
                         (keydown.enter)="viewCase(c.id)"
                         [attr.aria-label]="'View case ' + c.case_number">
                      <div class="cell-case">
                        <div class="case-name-row">
                          <span class="case-num">{{ c.case_number }}</span>
                          @if (c.assigned_operator_id === currentUserId) {
                            <span class="mine-badge">{{ 'OPR.MINE_BADGE' | translate }}</span>
                          }
                        </div>
                        <span class="case-client">{{ c.customer_name }}</span>
                      </div>
                      <div class="cell-violation">
                        <span class="violation-text">{{ c.violation_type }}</span>
                        <span class="state-badge">{{ c.state }}</span>
                      </div>
                      <div class="cell-status">
                        <span [class]="'status-chip status-' + c.status">
                          {{ getStatusKey(c.status) | translate }}
                        </span>
                      </div>
                      <div class="cell-operator">
                        <span class="operator-name">{{ c.operator_name || '—' }}</span>
                      </div>
                      <div class="cell-age" [matTooltip]="'Created ' + c.created_at">
                        <mat-icon class="age-icon"
                                  [class.age-warning]="c.ageHours >= 24 && c.ageHours < 48"
                                  [class.age-urgent]="c.ageHours >= 48">schedule</mat-icon>
                        <span class="age-text"
                              [class.age-warning]="c.ageHours >= 24 && c.ageHours < 48"
                              [class.age-urgent]="c.ageHours >= 48">
                          {{ formatAge(c.ageHours ?? 0) }}
                        </span>
                      </div>
                      <mat-icon class="row-arrow">chevron_right</mat-icon>
                    </div>
                  }
                }
              }
            </section>
          </mat-tab>

          <!-- TAB 3: Closed Archive -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>archive</mat-icon>
              <span class="tab-label-text">{{ 'OPR.TAB_ARCHIVE' | translate }}</span>
              @if (archiveLoaded()) {
                <span class="tab-badge archive-tab-badge">{{ archiveCases().length }}</span>
              }
            </ng-template>

            <section class="tab-content" aria-label="Closed archive">
              @if (archiveLoading()) {
                <app-skeleton-loader [rows]="4" [height]="52"></app-skeleton-loader>
              } @else {
                <mat-form-field appearance="outline" class="search-field">
                  <mat-label>{{ 'OPR.SEARCH_PLACEHOLDER' | translate }}</mat-label>
                  <input matInput
                         [ngModel]="archiveSearch()"
                         (ngModelChange)="archiveSearch.set($event)" />
                  <mat-icon matPrefix>search</mat-icon>
                </mat-form-field>

                @if (filteredArchiveCases().length === 0) {
                  <div class="empty-state" role="status">
                    <div class="empty-icon-wrap">
                      <mat-icon aria-hidden="true">archive</mat-icon>
                    </div>
                    <p class="empty-title">{{ 'OPR.NO_ARCHIVE_CASES' | translate }}</p>
                  </div>
                } @else {
                  <div class="table-header archive-header" aria-hidden="true">
                    <span class="th-case">{{ 'OPR.CASE' | translate: { Default: 'Case' } }}</span>
                    <span class="th-violation">{{ 'OPR.VIOLATION' | translate: { Default: 'Violation' } }}</span>
                    <span class="th-status">{{ 'OPR.STATUS' | translate: { Default: 'Status' } }}</span>
                    <span class="th-closed">{{ 'OPR.CLOSED_DATE' | translate: { Default: 'Closed' } }}</span>
                  </div>

                  @for (c of filteredArchiveCases(); track c.id) {
                    <div class="case-row archive-row"
                         matRipple
                         role="button"
                         tabindex="0"
                         (click)="viewCase(c.id)"
                         (keydown.enter)="viewCase(c.id)"
                         [attr.aria-label]="'View case ' + c.case_number">
                      <div class="cell-case">
                        <span class="case-num">{{ c.case_number }}</span>
                        <span class="case-client">{{ c.customer_name }}</span>
                      </div>
                      <div class="cell-violation">
                        <span class="violation-text">{{ c.violation_type }}</span>
                        <span class="state-badge">{{ c.state }}</span>
                      </div>
                      <div class="cell-status">
                        <span [class]="'status-chip status-' + c.status">
                          {{ getStatusKey(c.status) | translate }}
                        </span>
                      </div>
                      <div class="cell-closed">
                        <span class="court-text">{{ c.updated_at | date:'mediumDate' }}</span>
                      </div>
                      <mat-icon class="row-arrow">chevron_right</mat-icon>
                    </div>
                  }
                }
              }
            </section>
          </mat-tab>
        </mat-tab-group>

      }
    </div>
  `,
  styles: [`
    /* ============================================================
       LAYOUT
       ============================================================ */
    .op-dash {
      max-width: 1080px;
      margin: 0 auto;
      padding: 28px 20px 40px;
    }

    /* ============================================================
       PAGE HEADER
       ============================================================ */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-text h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .subtitle {
      margin: 4px 0 0;
      font-size: 0.85rem;
      color: var(--mat-sys-outline, #717680);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .view-toggle {
      display: flex;
      background: var(--mat-sys-surface-container, #eef0f5);
      border-radius: 8px;
      padding: 2px;
    }
    .view-toggle button {
      color: var(--mat-sys-outline, #717680);
      transition: all 0.2s;
    }
    .toggle-active {
      background: var(--mat-sys-primary, #1976d2) !important;
      color: #fff !important;
      border-radius: 6px;
    }
    .refresh-btn {
      color: var(--mat-sys-outline, #717680);
      transition: color 0.2s;
    }
    .refresh-btn:hover { color: var(--mat-sys-primary, #1976d2); }

    /* ============================================================
       STAT CARDS
       ============================================================ */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 28px;
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 16px;
      border-radius: 14px;
      transition: box-shadow 0.2s, transform 0.15s;
    }
    .stat-card:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      transform: translateY(-1px);
    }
    .stat-icon-wrap {
      width: 44px; height: 44px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-wrap mat-icon { color: #fff; font-size: 22px; width: 22px; height: 22px; }
    .blue-gradient   { background: linear-gradient(135deg, #1565c0, #42a5f5); }
    .amber-gradient  { background: linear-gradient(135deg, #e65100, #ffb74d); }
    .green-gradient  { background: linear-gradient(135deg, #2e7d32, #66bb6a); }
    .purple-gradient { background: linear-gradient(135deg, #6a1b9a, #ce93d8); }
    .stat-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .stat-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mat-sys-outline, #717680);
    }
    .stat-value {
      font-size: 1.6rem;
      font-weight: 800;
      line-height: 1.1;
      color: var(--mat-sys-on-surface, #1a1c1e);
    }
    .amber-text { color: #e65100; }
    .green-text { color: #2e7d32; }

    /* ============================================================
       TABS
       ============================================================ */
    .dash-tabs {
      margin-bottom: 20px;
    }
    .dash-tabs ::ng-deep .mat-mdc-tab-labels {
      gap: 4px;
    }
    .dash-tabs ::ng-deep .mat-mdc-tab {
      min-width: 0;
    }
    .tab-label-text {
      margin: 0 6px;
      font-weight: 600;
    }
    .tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: 11px;
      font-size: 0.72rem;
      font-weight: 700;
      background: #e3f2fd;
      color: #1565c0;
    }
    .queue-tab-badge {
      background: #fff3e0;
      color: #e65100;
    }
    .archive-tab-badge {
      background: #f3f3f3;
      color: #616161;
    }
    .tab-content {
      padding: 16px 0 0;
    }

    /* ============================================================
       SECTION BLOCKS
       ============================================================ */
    .section-block {
      background: var(--mat-sys-surface, #fff);
      border: 1px solid var(--mat-sys-outline-variant, #c4c7cf);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-icon {
      color: #1565c0;
      font-size: 22px; width: 22px; height: 22px;
    }
    .queue-icon { color: #e65100; }
    .section-header h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
    }
    .badge-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 28px;
      padding: 0 8px;
      border-radius: 14px;
      font-size: 0.82rem;
      font-weight: 700;
      background: #e3f2fd;
      color: #1565c0;
    }
    .queue-badge {
      background: #fff3e0;
      color: #e65100;
    }

    /* ============================================================
       PRIORITY LEGEND
       ============================================================ */
    .priority-legend {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      font-size: 0.75rem;
      color: var(--mat-sys-outline, #717680);
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .legend-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ============================================================
       PRIORITY COLORS (shared dot + bar)
       ============================================================ */
    .priority-critical { background-color: #E53935; }
    .priority-high     { background-color: #FB8C00; }
    .priority-medium   { background-color: #FDD835; }
    .priority-low      { background-color: #43A047; }

    .priority-dot {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ============================================================
       SEARCH FIELD
       ============================================================ */
    .search-field {
      width: 100%;
      margin-bottom: 4px;
    }
    .search-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    /* ============================================================
       MY CASES — TABLE LAYOUT
       ============================================================ */
    .table-header {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 100px 80px 80px 32px;
      gap: 12px;
      padding: 8px 16px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--mat-sys-outline, #717680);
      border-bottom: 2px solid var(--mat-sys-outline-variant, #e0e3e8);
      margin-bottom: 2px;
    }
    .case-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr 1fr 100px 80px 80px 32px;
      gap: 12px;
      align-items: center;
      padding: 14px 16px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
    }
    .case-row:hover {
      background: var(--mat-sys-surface-container-low, #f5f7ff);
      box-shadow: 0 1px 6px rgba(0,0,0,0.04);
    }
    .case-row:focus-visible {
      outline: 2px solid var(--mat-sys-primary, #1976d2);
      outline-offset: -2px;
      border-radius: 10px;
    }
    .case-row + .case-row {
      border-top: 1px solid var(--mat-sys-outline-variant, #f0f1f3);
    }

    /* Cell: Case + Client */
    .cell-case { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .case-name-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .case-num {
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--mat-sys-primary, #1565c0);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .case-client {
      font-size: 0.82rem;
      color: var(--mat-sys-on-surface-variant, #44474e);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Cell: Violation + State */
    .cell-violation { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .violation-text {
      font-size: 0.82rem;
      color: var(--mat-sys-on-surface, #1a1c1e);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .state-badge {
      display: inline-flex;
      align-self: flex-start;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      background: var(--mat-sys-surface-container, #eef0f5);
      color: var(--mat-sys-on-surface-variant, #44474e);
      letter-spacing: 0.5px;
    }

    /* Cell: Status */
    .cell-status { display: flex; align-items: center; }
    .status-chip {
      display: inline-flex;
      align-items: center;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      white-space: nowrap;
      letter-spacing: 0.2px;
    }
    .status-new, .status-submitted       { background: #e3f2fd; color: #1565c0; }
    .status-reviewed,
    .status-send_info_to_attorney,
    .status-waiting_for_driver,
    .status-in_progress                  { background: #fff3e0; color: #e65100; }
    .status-assigned_to_attorney         { background: #e8f5e9; color: #2e7d32; }
    .status-call_court,
    .status-check_with_manager           { background: #fff8e1; color: #f57f17; }
    .status-pay_attorney,
    .status-attorney_paid                { background: #e8eaf6; color: #283593; }
    .status-resolved                     { background: #e8f5e9; color: #1b5e20; }
    .status-closed                       { background: #f3f3f3; color: #616161; }

    /* Cell: Court date */
    .cell-court { min-width: 0; }
    .court-text {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface, #1a1c1e);
      white-space: nowrap;
    }
    .cell-dash {
      font-size: 0.85rem;
      color: var(--mat-sys-outline, #b0b4bc);
    }

    /* Cell: Fine */
    .cell-fine { min-width: 0; }
    .fine-text {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface, #1a1c1e);
    }

    /* Cell: Age */
    .cell-age {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .age-icon {
      font-size: 16px; width: 16px; height: 16px;
      color: var(--mat-sys-outline, #717680);
    }
    .age-text {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--mat-sys-outline, #717680);
    }
    .age-warning { color: #e65100 !important; }
    .age-urgent  { color: #b71c1c !important; }

    /* Row arrow */
    .row-arrow {
      font-size: 18px; width: 18px; height: 18px;
      color: var(--mat-sys-outline, #c4c7cf);
      transition: color 0.15s, transform 0.15s;
    }
    .case-row:hover .row-arrow {
      color: var(--mat-sys-primary, #1976d2);
      transform: translateX(2px);
    }

    /* ============================================================
       UNASSIGNED QUEUE — CARD GRID
       ============================================================ */
    .queue-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 14px;
    }
    .queue-card {
      position: relative;
      overflow: hidden;
      border-radius: 14px;
      transition: box-shadow 0.2s, transform 0.15s;
    }
    .queue-card:hover {
      box-shadow: 0 6px 24px rgba(0,0,0,0.08);
      transform: translateY(-2px);
    }
    .queue-card--requested {
      opacity: 0.72;
    }

    /* Priority color bar */
    .priority-bar {
      height: 4px;
      width: 100%;
    }
    .priority-bar-critical { background: linear-gradient(90deg, #E53935, #ef9a9a); }
    .priority-bar-high     { background: linear-gradient(90deg, #FB8C00, #ffcc80); }
    .priority-bar-medium   { background: linear-gradient(90deg, #FDD835, #fff59d); }
    .priority-bar-low      { background: linear-gradient(90deg, #43A047, #a5d6a7); }

    .queue-card-body { padding: 16px 18px 18px; }

    /* Header: case number + age */
    .qc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .qc-number {
      font-weight: 800;
      font-size: 0.9rem;
      color: var(--mat-sys-primary, #1565c0);
    }
    .qc-age {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--mat-sys-outline, #717680);
    }
    .qc-age-icon { font-size: 14px; width: 14px; height: 14px; }

    /* Client name */
    .qc-client {
      margin: 0 0 8px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface, #1a1c1e);
    }

    /* Details row */
    .qc-details {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 14px;
    }
    .qc-detail-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.8rem;
      color: var(--mat-sys-on-surface-variant, #44474e);
    }
    .qc-detail-icon {
      font-size: 16px; width: 16px; height: 16px;
      color: var(--mat-sys-outline, #717680);
    }

    /* Action row */
    .qc-action { display: flex; justify-content: flex-end; }
    .qc-claim-btn {
      border-radius: 10px;
      font-weight: 600;
      letter-spacing: 0.3px;
      background: linear-gradient(135deg, #1565c0, #1976d2);
      color: #fff;
    }
    .qc-claim-btn:hover:not([disabled]) {
      background: linear-gradient(135deg, #0d47a1, #1565c0);
      box-shadow: 0 2px 8px rgba(21,101,192,0.3);
    }
    .qc-claim-btn mat-icon {
      font-size: 18px; width: 18px; height: 18px;
      margin-right: 4px;
    }
    .qc-requested-btn {
      border-radius: 10px;
      font-weight: 600;
      color: var(--mat-sys-outline, #717680);
    }
    .qc-requested-btn mat-icon {
      font-size: 16px; width: 16px; height: 16px;
      margin-right: 4px;
    }

    /* ============================================================
       TEAM VIEW & ARCHIVE
       ============================================================ */
    .team-header {
      grid-template-columns: 2fr 1.5fr 1fr 1fr 80px 32px;
    }
    .team-row {
      grid-template-columns: 2fr 1.5fr 1fr 1fr 80px 32px;
    }
    .archive-header {
      grid-template-columns: 2fr 1.5fr 1fr 120px 32px;
    }
    .archive-row {
      grid-template-columns: 2fr 1.5fr 1fr 120px 32px;
    }
    .case-row--mine {
      background: rgba(21, 101, 192, 0.04);
    }
    .case-row--mine:hover {
      background: rgba(21, 101, 192, 0.08);
    }
    .mine-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.62rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
      background: #e3f2fd;
      color: #1565c0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cell-operator { min-width: 0; }
    .operator-name {
      font-size: 0.82rem;
      color: var(--mat-sys-on-surface-variant, #44474e);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .cell-closed { min-width: 0; }

    /* ============================================================
       EMPTY STATE
       ============================================================ */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 16px;
      text-align: center;
    }
    .empty-icon-wrap {
      width: 64px; height: 64px;
      border-radius: 50%;
      background: var(--mat-sys-surface-container, #eef0f5);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-icon-wrap mat-icon {
      font-size: 32px; width: 32px; height: 32px;
      color: var(--mat-sys-outline, #b0b4bc);
    }
    .empty-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 500;
      color: var(--mat-sys-outline, #717680);
    }

    /* ============================================================
       RESPONSIVE
       ============================================================ */
    @media (max-width: 900px) {
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .table-header { display: none; }
      .case-row {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 14px 12px;
        border: 1px solid var(--mat-sys-outline-variant, #e0e3e8);
        border-radius: 12px;
        margin-bottom: 8px;
      }
      .case-row + .case-row { border-top: none; }
      .case-row .row-arrow { display: none; }
      .cell-status { justify-content: flex-start; }
      .cell-age { justify-content: flex-start; }
      .queue-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .op-dash { padding: 16px 12px 32px; }
      .stat-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
      .stat-card { padding: 14px 12px; gap: 10px; }
      .stat-value { font-size: 1.3rem; }
      .section-block { padding: 16px 14px; border-radius: 12px; }
      .priority-legend { flex-wrap: wrap; gap: 10px; }
    }
  `],
})
export class OperatorDashboardComponent implements OnInit {
  private caseService = inject(CaseService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /* --- Current user ID for "Mine" badge in team view --- */
  currentUserId = this.authService.getCurrentUser()?.id ?? '';

  /* --- State --- */
  myCases = signal<any[]>([]);
  unassignedCases = signal<any[]>([]);
  teamCases = signal<any[]>([]);
  archiveCases = signal<any[]>([]);
  summary = signal<any>(MOCK_SUMMARY);
  loading = signal(true);
  requestingId = signal<string | null>(null);

  /* --- Tab & view state (persisted) --- */
  activeTab = signal(
    typeof localStorage !== 'undefined'
      ? parseInt(localStorage.getItem('opr_active_tab') ?? '0', 10)
      : 0
  );
  view = signal<'list' | 'kanban'>(
    (typeof localStorage !== 'undefined' && localStorage.getItem('opr_view') as 'list' | 'kanban') || 'list'
  );

  /* --- Lazy-load flags --- */
  teamCasesLoaded = signal(false);
  teamCasesLoading = signal(false);
  archiveLoaded = signal(false);
  archiveLoading = signal(false);

  /* --- Persistence effects --- */
  private viewEffect = effect(() => {
    localStorage.setItem('opr_view', this.view());
  });
  private tabEffect = effect(() => {
    localStorage.setItem('opr_active_tab', String(this.activeTab()));
  });

  /* --- Search filters --- */
  mySearch = signal('');
  queueSearch = signal('');
  teamSearch = signal('');
  archiveSearch = signal('');

  /* --- Computed filtered lists --- */
  filteredMyCases = computed(() => {
    const term = this.mySearch().toLowerCase().trim();
    const cases = this.myCases();
    if (!term) return cases;
    return cases.filter((c: any) =>
      (c.case_number || '').toLowerCase().includes(term) ||
      (c.customer_name || '').toLowerCase().includes(term) ||
      (c.violation_type || '').toLowerCase().includes(term)
    );
  });

  filteredUnassigned = computed(() => {
    const term = this.queueSearch().toLowerCase().trim();
    const cases = this.unassignedCases();
    if (!term) return cases;
    return cases.filter((c: any) =>
      (c.case_number || '').toLowerCase().includes(term) ||
      (c.customer_name || '').toLowerCase().includes(term) ||
      (c.violation_type || '').toLowerCase().includes(term)
    );
  });

  sortedUnassigned = computed(() => {
    const filtered = this.filteredUnassigned();
    return [...filtered].sort((a: any, b: any) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 3;
      const pb = PRIORITY_ORDER[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return (b.ageHours ?? 0) - (a.ageHours ?? 0);
    });
  });

  filteredTeamCases = computed(() => {
    const term = this.teamSearch().toLowerCase().trim();
    const cases = this.teamCases();
    if (!term) return cases;
    return cases.filter((c: any) =>
      (c.case_number || '').toLowerCase().includes(term) ||
      (c.customer_name || '').toLowerCase().includes(term) ||
      (c.violation_type || '').toLowerCase().includes(term) ||
      (c.operator_name || '').toLowerCase().includes(term)
    );
  });

  filteredArchiveCases = computed(() => {
    const term = this.archiveSearch().toLowerCase().trim();
    const cases = this.archiveCases();
    if (!term) return cases;
    return cases.filter((c: any) =>
      (c.case_number || '').toLowerCase().includes(term) ||
      (c.customer_name || '').toLowerCase().includes(term) ||
      (c.violation_type || '').toLowerCase().includes(term)
    );
  });

  ngOnInit(): void {
    this.loadAll();
    const interval = setInterval(() => this.loadAll(), 60_000);
    this.destroyRef.onDestroy(() => clearInterval(interval));

    // If user returns to a lazy tab that was previously loaded, reload it
    const tab = this.activeTab();
    if (tab === 2) this.loadTeamCases();
    if (tab === 3) this.loadArchive();
  }

  refresh(): void {
    this.loadAll();
    // Also reload lazy tabs if they were previously loaded
    if (this.teamCasesLoaded()) this.loadTeamCases();
    if (this.archiveLoaded()) this.loadArchive();
  }

  onTabChange(index: number): void {
    this.activeTab.set(index);
    if (index === 2 && !this.teamCasesLoaded()) this.loadTeamCases();
    if (index === 3 && !this.archiveLoaded()) this.loadArchive();
  }

  private loadAll(): void {
    this.loading.set(true);

    // Load operator's own cases
    this.caseService.getOperatorCases().pipe(
      catchError(() => of({ cases: MOCK_MY_CASES, summary: MOCK_SUMMARY }))
    ).subscribe((res: any) => {
      const cases = res.cases?.length ? res.cases : MOCK_MY_CASES;
      this.myCases.set(cases);
      this.summary.set(res.summary ?? MOCK_SUMMARY);
      this.loading.set(false);
    });

    // Load unassigned queue
    this.caseService.getUnassignedCases().pipe(
      catchError(() => of({ cases: MOCK_UNASSIGNED }))
    ).subscribe((res: any) => {
      const cases = res.cases?.length ? res.cases : MOCK_UNASSIGNED;
      this.unassignedCases.set(cases);
    });
  }

  private loadTeamCases(): void {
    this.teamCasesLoading.set(true);
    this.caseService.getTeamCases().pipe(
      catchError(() => of({ cases: [] }))
    ).subscribe((res: any) => {
      this.teamCases.set(res.cases ?? []);
      this.teamCasesLoaded.set(true);
      this.teamCasesLoading.set(false);
    });
  }

  private loadArchive(): void {
    this.archiveLoading.set(true);
    this.caseService.getClosedCases().pipe(
      catchError(() => of({ cases: [] }))
    ).subscribe((res: any) => {
      this.archiveCases.set(res.cases ?? []);
      this.archiveLoaded.set(true);
      this.archiveLoading.set(false);
    });
  }

  /* --- Actions --- */

  viewCase(caseId: string): void {
    this.router.navigate(['/operator/cases', caseId]);
  }

  requestAssignment(caseId: string): void {
    this.requestingId.set(caseId);
    this.caseService.requestAssignment(caseId).subscribe({
      next: () => {
        this.snackBar.open(
          'Assignment requested — awaiting admin approval',
          'OK',
          { duration: 4000 }
        );
        this.unassignedCases.update(cases =>
          cases.map(c => c.id === caseId ? { ...c, requested: true } : c)
        );
        this.summary.update(s => ({ ...s, pendingApproval: (s.pendingApproval || 0) + 1 }));
        this.requestingId.set(null);
      },
      error: () => {
        this.snackBar.open('Failed to request assignment', 'Close', { duration: 3000 });
        this.requestingId.set(null);
      }
    });
  }

  /* --- Utilities --- */

  getStatusKey(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      critical: 'Critical priority',
      high: 'High priority',
      medium: 'Medium priority',
      low: 'Low priority',
    };
    return labels[priority] ?? 'Unknown priority';
  }

  formatAge(hours: number): string {
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }
}

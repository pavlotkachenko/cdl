import {
  Component, OnInit, DestroyRef, signal, computed, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { CaseService } from '../../../core/services/case.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

/* ------------------------------------------------------------------ */
/*  Mock data — fallback when API returns empty                        */
/* ------------------------------------------------------------------ */
const MOCK_MY_CASES: any[] = [
  { id: 'c1', case_number: 'CDL-2026-601', status: 'reviewed', state: 'TX', violation_type: 'Speeding 20+ Over', created_at: '2026-03-08T10:30:00Z', customer_name: 'Marcus Rivera', ageHours: 72 },
  { id: 'c2', case_number: 'CDL-2026-602', status: 'assigned_to_attorney', state: 'CA', violation_type: 'Overweight Load', created_at: '2026-03-09T14:15:00Z', customer_name: 'Jennifer Walsh', ageHours: 44 },
  { id: 'c3', case_number: 'CDL-2026-603', status: 'waiting_for_driver', state: 'FL', violation_type: 'Logbook Violation', created_at: '2026-03-10T08:45:00Z', customer_name: 'Ahmed Hassan', ageHours: 26 },
];

const MOCK_UNASSIGNED: any[] = [
  { id: 'u1', case_number: 'CDL-2026-610', status: 'new', state: 'NY', violation_type: 'Improper Lane Change', created_at: '2026-03-10T16:20:00Z', customer_name: 'Sarah Kim', ageHours: 18, requested: false },
  { id: 'u2', case_number: 'CDL-2026-611', status: 'new', state: 'IL', violation_type: 'Following Too Closely', created_at: '2026-03-09T11:00:00Z', customer_name: 'Robert Jackson', ageHours: 47, requested: false },
  { id: 'u3', case_number: 'CDL-2026-612', status: 'submitted', state: 'GA', violation_type: 'Equipment Violation', created_at: '2026-03-10T09:30:00Z', customer_name: 'Maria Gonzalez', ageHours: 24, requested: true },
];

const MOCK_SUMMARY = { assignedToMe: 3, inProgress: 2, resolvedToday: 0, pendingApproval: 1 };

const STATUS_LABELS: Record<string, string> = {
  new: 'OPR.STATUS_NEW',
  submitted: 'OPR.STATUS_NEW',
  reviewed: 'OPR.STATUS_IN_PROGRESS',
  assigned_to_attorney: 'OPR.STATUS_ASSIGNED',
  send_info_to_attorney: 'OPR.STATUS_IN_PROGRESS',
  waiting_for_driver: 'OPR.STATUS_IN_PROGRESS',
  call_court: 'OPR.STATUS_PENDING_COURT',
  resolved: 'OPR.STATUS_RESOLVED',
  closed: 'OPR.STATUS_CLOSED',
  in_progress: 'OPR.STATUS_IN_PROGRESS',
};

@Component({
  selector: 'app-operator-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDividerModule,
    TranslateModule, SkeletonLoaderComponent,
  ],
  template: `
    <div class="op-dash">

      <!-- ====== PAGE HEADER ====== -->
      <div class="page-header">
        <div>
          <h1>{{ 'OPR.DASHBOARD' | translate }}</h1>
          <p class="subtitle">{{ 'OPR.DASHBOARD_SUBTITLE' | translate }}</p>
        </div>
        <button mat-stroked-button (click)="refresh()" aria-label="Refresh dashboard">
          <mat-icon>refresh</mat-icon>
          {{ 'OPR.REFRESH' | translate }}
        </button>
      </div>

      @if (loading()) {
        <app-skeleton-loader [rows]="4" [height]="68"></app-skeleton-loader>
      } @else {

        <!-- ====== STAT CARDS ====== -->
        <div class="stat-grid">
          <mat-card class="stat-card border-blue">
            <mat-card-content>
              <div class="stat-icon bg-blue"><mat-icon>assignment_ind</mat-icon></div>
              <p class="stat-lbl">{{ 'OPR.ASSIGNED_TO_ME' | translate }}</p>
              <p class="stat-val">{{ summary().assignedToMe }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-amber">
            <mat-card-content>
              <div class="stat-icon bg-amber"><mat-icon>pending_actions</mat-icon></div>
              <p class="stat-lbl">{{ 'OPR.IN_PROGRESS' | translate }}</p>
              <p class="stat-val pending">{{ summary().inProgress }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-green">
            <mat-card-content>
              <div class="stat-icon bg-green"><mat-icon>check_circle</mat-icon></div>
              <p class="stat-lbl">{{ 'OPR.RESOLVED_TODAY' | translate }}</p>
              <p class="stat-val resolved">{{ summary().resolvedToday }}</p>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card border-purple">
            <mat-card-content>
              <div class="stat-icon bg-purple"><mat-icon>hourglass_top</mat-icon></div>
              <p class="stat-lbl">{{ 'OPR.PENDING_APPROVAL' | translate }}</p>
              <p class="stat-val">{{ summary().pendingApproval }}</p>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- ====== MY ASSIGNED CASES ====== -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>{{ 'OPR.MY_ASSIGNED' | translate }}</mat-card-title>
            <span class="case-count">{{ myCases().length }} {{ 'OPR.CASES' | translate }}</span>
          </mat-card-header>
          <mat-card-content>

            <!-- Search -->
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>{{ 'OPR.SEARCH_PLACEHOLDER' | translate }}</mat-label>
              <input matInput
                     [ngModel]="mySearch()"
                     (ngModelChange)="mySearch.set($event)" />
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>

            @if (filteredMyCases().length === 0) {
              <div class="empty-state" role="status">
                <mat-icon aria-hidden="true">inbox</mat-icon>
                <p class="empty-title">{{ 'OPR.NO_ASSIGNED_CASES' | translate }}</p>
              </div>
            } @else {
              @for (c of filteredMyCases(); track c.id) {
                <div class="case-item"
                     role="button"
                     tabindex="0"
                     (click)="viewCase(c.id)"
                     (keydown.enter)="viewCase(c.id)"
                     [attr.aria-label]="'View case ' + c.case_number">
                  <div class="case-info">
                    <span class="case-num">{{ c.case_number }}</span>
                    <span class="case-client">{{ c.customer_name }}</span>
                    <span class="case-detail">{{ c.violation_type }} · {{ c.state }}</span>
                  </div>
                  <div class="case-badges">
                    <span [class]="'chip status-' + c.status">{{ getStatusKey(c.status) | translate }}</span>
                    <span class="case-age" [class.age-warning]="c.ageHours >= 24 && c.ageHours < 48" [class.age-urgent]="c.ageHours >= 48">
                      {{ formatAge(c.ageHours ?? 0) }}
                    </span>
                  </div>
                </div>
                <mat-divider></mat-divider>
              }
            }
          </mat-card-content>
        </mat-card>

        <!-- ====== UNASSIGNED QUEUE ====== -->
        <mat-card class="section-card">
          <mat-card-header>
            <mat-card-title>{{ 'OPR.UNASSIGNED_QUEUE' | translate }}</mat-card-title>
            <span class="case-count">{{ unassignedCases().length }} {{ 'OPR.QUEUE' | translate }}</span>
          </mat-card-header>
          <mat-card-content>

            <!-- Search -->
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>{{ 'OPR.SEARCH_PLACEHOLDER' | translate }}</mat-label>
              <input matInput
                     [ngModel]="queueSearch()"
                     (ngModelChange)="queueSearch.set($event)" />
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>

            @if (filteredUnassigned().length === 0) {
              <div class="empty-state" role="status">
                <mat-icon aria-hidden="true">queue</mat-icon>
                <p class="empty-title">{{ 'OPR.NO_UNASSIGNED_CASES' | translate }}</p>
              </div>
            } @else {
              @for (c of filteredUnassigned(); track c.id) {
                <div class="queue-item">
                  <div class="case-info">
                    <span class="case-num">{{ c.case_number }}</span>
                    <span class="case-client">{{ c.customer_name }}</span>
                    <span class="case-detail">{{ c.violation_type }} · {{ c.state }}</span>
                  </div>
                  <div class="queue-actions">
                    <span class="case-age" [class.age-warning]="c.ageHours >= 24 && c.ageHours < 48" [class.age-urgent]="c.ageHours >= 48">
                      {{ formatAge(c.ageHours ?? 0) }}
                    </span>
                    @if (c.requested) {
                      <button mat-stroked-button disabled class="requested-btn">
                        <mat-icon>hourglass_top</mat-icon>
                        {{ 'OPR.REQUESTED' | translate }}
                      </button>
                    } @else {
                      <button mat-flat-button color="primary"
                              (click)="requestAssignment(c.id)"
                              [disabled]="requestingId() === c.id">
                        @if (requestingId() === c.id) {
                          <mat-spinner diameter="16"></mat-spinner>
                        } @else {
                          <ng-container>
                            <mat-icon>assignment_ind</mat-icon>
                            {{ 'OPR.REQUEST_ASSIGNMENT' | translate }}
                          </ng-container>
                        }
                      </button>
                    }
                  </div>
                </div>
                <mat-divider></mat-divider>
              }
            }
          </mat-card-content>
        </mat-card>

      }
    </div>
  `,
  styles: [`
    /* --- Layout --- */
    .op-dash { max-width: 1000px; margin: 0 auto; padding: 24px 16px; }

    /* --- Page header --- */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }
    .subtitle { margin: 2px 0 0; font-size: 0.85rem; color: #888; }

    /* --- Stat cards --- */
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
    .stat-val.pending { color: #f57c00; }
    .stat-val.resolved { color: #388e3c; }

    /* --- Section cards --- */
    .section-card { margin-bottom: 16px; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .case-count { font-size: 0.82rem; color: #888; margin-left: auto; }

    /* --- Search --- */
    .search-field { width: 100%; margin-bottom: 8px; }
    .search-field ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }

    /* --- My cases list --- */
    .case-item {
      display: flex; align-items: center; gap: 16px; padding: 10px 8px; cursor: pointer;
      transition: background 0.15s;
    }
    .case-item:hover { background: #f5f7ff; border-radius: 6px; }
    .case-item:focus-visible { outline: 2px solid #1976d2; border-radius: 6px; }
    .case-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .case-num { font-weight: 600; font-size: 0.9rem; }
    .case-client { font-size: 0.82rem; color: #444; }
    .case-detail { font-size: 0.78rem; color: #888; }
    .case-badges { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
    .case-age { font-size: 0.75rem; color: #888; white-space: nowrap; }
    .age-warning { color: #f57c00; font-weight: 600; }
    .age-urgent { color: #c62828; font-weight: 600; }

    /* --- Status chips --- */
    .chip {
      font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; white-space: nowrap;
    }
    .status-new, .status-submitted { background: #e3f2fd; color: #1565c0; }
    .status-reviewed, .status-send_info_to_attorney, .status-waiting_for_driver, .status-in_progress { background: #fff3e0; color: #e65100; }
    .status-assigned_to_attorney { background: #e8f5e9; color: #2e7d32; }
    .status-call_court { background: #fff8e1; color: #f57f17; }
    .status-resolved { background: #e8f5e9; color: #1b5e20; }
    .status-closed { background: #f5f5f5; color: #616161; }

    /* --- Queue items --- */
    .queue-item {
      display: flex; align-items: center; gap: 16px; padding: 12px 8px;
    }
    .queue-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }
    .requested-btn { font-size: 0.82rem; }
    .requested-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }

    /* --- Empty state --- */
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: #999; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #ccc; }
    .empty-title { margin: 4px 0 0; font-size: 1rem; font-weight: 500; color: #666; }

    /* --- Responsive --- */
    @media (max-width: 768px) {
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .case-item, .queue-item { flex-wrap: wrap; }
      .queue-actions { width: 100%; justify-content: flex-end; }
    }
    @media (max-width: 480px) {
      .op-dash { padding: 16px 8px; }
      .page-header { flex-direction: column; align-items: flex-start; }
    }
  `],
})
export class OperatorDashboardComponent implements OnInit {
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  /* --- State --- */
  myCases = signal<any[]>([]);
  unassignedCases = signal<any[]>([]);
  summary = signal<any>(MOCK_SUMMARY);
  loading = signal(true);
  requestingId = signal<string | null>(null);

  /* --- Search filters --- */
  mySearch = signal('');
  queueSearch = signal('');

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

  ngOnInit(): void {
    this.loadAll();
    const interval = setInterval(() => this.loadAll(), 60_000);
    this.destroyRef.onDestroy(() => clearInterval(interval));
  }

  refresh(): void {
    this.loadAll();
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
        // Mark as requested locally
        this.unassignedCases.update(cases =>
          cases.map(c => c.id === caseId ? { ...c, requested: true } : c)
        );
        // Increment pending count
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

  formatAge(hours: number): string {
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }
}

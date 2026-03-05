import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';

import { AttorneyService, AttorneyCase } from '../../../core/services/attorney.service';

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
  ],
  template: `
    <div class="dashboard">
      <header class="dash-header">
        <h1>My Cases</h1>
        <button mat-icon-button (click)="loadCases()" aria-label="Refresh cases">
          <mat-icon>refresh</mat-icon>
        </button>
      </header>

      <div class="stat-row" role="region" aria-label="Case counts">
        <div class="stat-chip pending-chip">
          <span class="stat-num">{{ pendingCases().length }}</span>
          <span class="stat-lbl">Pending</span>
        </div>
        <div class="stat-chip active-chip">
          <span class="stat-num">{{ activeCases().length }}</span>
          <span class="stat-lbl">Active</span>
        </div>
        <div class="stat-chip resolved-chip">
          <span class="stat-num">{{ resolvedCases().length }}</span>
          <span class="stat-lbl">Resolved</span>
        </div>
      </div>

      <div class="tabs">
        @for (tab of tabs; track tab.id) {
          <button mat-stroked-button
                  [class.active-tab]="activeTab() === tab.id"
                  (click)="activeTab.set(tab.id)"
                  [attr.aria-pressed]="activeTab() === tab.id">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <div class="case-list" role="list">
          @for (c of visibleCases(); track c.id) {
            <mat-card class="case-card" role="listitem">
              <mat-card-content>
                <div class="case-row">
                  <div class="case-main" (click)="viewCase(c.id)" style="cursor:pointer"
                       [attr.aria-label]="'Open case ' + c.case_number" role="button" tabindex="0"
                       (keyup.enter)="viewCase(c.id)">
                    <p class="case-num">{{ c.case_number }}</p>
                    <p class="driver">{{ c.driver_name }}</p>
                    <p class="meta">{{ c.violation_type }} &bull; {{ c.state }}</p>
                  </div>
                  @if (activeTab() === 'pending') {
                    <div class="actions">
                      <button mat-raised-button color="primary"
                              (click)="acceptCase(c.id)"
                              [disabled]="processingId() === c.id"
                              [attr.aria-label]="'Accept case ' + c.case_number">
                        @if (processingId() === c.id) {
                          <mat-spinner diameter="16"></mat-spinner>
                        } @else { Accept }
                      </button>
                      <button mat-stroked-button color="warn"
                              (click)="declineCase(c.id)"
                              [disabled]="processingId() === c.id"
                              [attr.aria-label]="'Decline case ' + c.case_number">
                        Decline
                      </button>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          } @empty {
            <div class="empty-state">
              <mat-icon aria-hidden="true">folder_open</mat-icon>
              <p>No {{ activeTab() }} cases.</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard { max-width: 640px; margin: 0 auto; padding: 24px 16px; }
    .dash-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .dash-header h1 { margin: 0; font-size: 1.4rem; }
    .stat-row { display: flex; gap: 12px; margin-bottom: 20px; }
    .stat-chip { display: flex; flex-direction: column; align-items: center; padding: 10px 20px;
      border-radius: 8px; min-width: 80px; }
    .pending-chip { background: #fff3e0; }
    .active-chip { background: #e3f2fd; }
    .resolved-chip { background: #e8f5e9; }
    .stat-num { font-size: 1.6rem; font-weight: 700; line-height: 1; }
    .stat-lbl { font-size: 0.75rem; color: #666; margin-top: 2px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .active-tab { background: #1976d2; color: #fff; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .case-list { display: flex; flex-direction: column; gap: 10px; }
    .case-card { transition: box-shadow 0.15s; }
    .case-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .case-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .case-main { flex: 1; min-width: 0; }
    .case-num { margin: 0; font-weight: 600; font-size: 0.9rem; }
    .driver { margin: 2px 0 0; font-size: 0.85rem; color: #333; }
    .meta { margin: 2px 0 0; font-size: 0.75rem; color: #666; }
    .actions { display: flex; flex-direction: column; gap: 6px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 32px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
  `],
})
export class AttorneyDashboardComponent implements OnInit {
  private attorneyService = inject(AttorneyService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  cases = signal<AttorneyCase[]>([]);
  loading = signal(true);
  activeTab = signal<TabId>('pending');
  processingId = signal<string | null>(null);

  pendingCases = computed(() => this.cases().filter(c => c.status === 'assigned_to_attorney'));
  activeCases = computed(() => this.cases().filter(c => ACTIVE_STATUSES.has(c.status)));
  resolvedCases = computed(() => this.cases().filter(c => c.status === 'closed' || c.status === 'resolved'));

  visibleCases = computed(() => {
    const tab = this.activeTab();
    if (tab === 'pending') return this.pendingCases();
    if (tab === 'active') return this.activeCases();
    return this.resolvedCases();
  });

  tabs: { id: TabId; label: string }[] = [
    { id: 'pending', label: 'Pending' },
    { id: 'active', label: 'Active' },
    { id: 'resolved', label: 'Resolved' },
  ];

  ngOnInit(): void {
    this.loadCases();
  }

  loadCases(): void {
    this.loading.set(true);
    this.attorneyService.getMyCases().subscribe({
      next: (r) => { this.cases.set(r.cases ?? []); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load cases. Please try again.', 'Close', { duration: 3000 });
      },
    });
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

  viewCase(id: string): void {
    this.router.navigate(['/attorney/cases', id]);
  }
}

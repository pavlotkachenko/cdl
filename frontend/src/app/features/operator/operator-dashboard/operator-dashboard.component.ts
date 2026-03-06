import {
  Component, OnInit, OnDestroy, signal, computed, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { CaseService } from '../../../core/services/case.service';

type StatusFilter = 'new' | 'under_review' | 'waiting_for_driver';

@Component({
  selector: 'app-operator-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDividerModule, MatCheckboxModule,
  ],
  template: `
    <div class="op-dash">
      <div class="page-header">
        <h1>Case Queue</h1>
        <button mat-stroked-button (click)="load()" aria-label="Refresh queue">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <div class="summary-row">
        <mat-card class="sum-card">
          <mat-card-content>
            <p class="sum-lbl">New Cases</p>
            <p class="sum-val">{{ summary().newCount }}</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="sum-card">
          <mat-card-content>
            <p class="sum-lbl">Avg Age</p>
            <p class="sum-val">{{ formatAge(summary().avgAgeHours) }}</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="sum-card">
          <mat-card-content>
            <p class="sum-lbl">Assigned Today</p>
            <p class="sum-val">{{ summary().assignedToday }}</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Status filter tabs -->
      <div class="filter-tabs" role="group" aria-label="Filter by status">
        @for (tab of STATUS_TABS; track tab.value) {
          <button mat-flat-button
                  [color]="statusFilter() === tab.value ? 'primary' : undefined"
                  (click)="setStatusFilter(tab.value)">
            {{ tab.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (cases().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">inbox</mat-icon>
          <p>No cases in this queue.</p>
        </div>
      } @else {
        <!-- Select-all bar -->
        <div class="select-bar">
          <mat-checkbox
            [checked]="allSelected()"
            [indeterminate]="someSelected()"
            (change)="toggleAll()"
            aria-label="Select all cases">
            @if (selectedCount() > 0) {
              {{ selectedCount() }} selected
            } @else {
              Select all
            }
          </mat-checkbox>
        </div>

        <!-- Bulk action bar -->
        @if (selectedCount() > 0) {
          <div class="bulk-bar">
            <span class="bulk-label">{{ selectedCount() }} case(s) selected</span>
            <mat-form-field appearance="outline" class="bulk-field">
              <mat-label>Attorney</mat-label>
              <mat-select [value]="bulkAttorneyId()"
                          (selectionChange)="bulkAttorneyId.set($event.value)">
                @for (a of attorneys(); track a.id) {
                  <mat-option [value]="a.id">{{ a.full_name || a.fullName }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="bulk-price-field">
              <mat-label>Fee ($)</mat-label>
              <input matInput type="number" min="0"
                     [value]="bulkPrice()"
                     (input)="bulkPrice.set($any($event.target).value)"
                     aria-label="Bulk attorney fee" />
            </mat-form-field>
            <button mat-raised-button color="accent"
                    (click)="bulkAssign()"
                    [disabled]="bulkAssigning() || !bulkAttorneyId() || !bulkPrice()">
              @if (bulkAssigning()) { Assigning... } @else { Assign All }
            </button>
            <button mat-button (click)="clearSelection()">Clear</button>
          </div>
        }

        @for (c of cases(); track c.id) {
          <mat-card class="case-card">
            <mat-card-content>
              <div class="case-row">
                <mat-checkbox
                  [checked]="selectedCaseIds().has(c.id)"
                  (change)="toggleSelect(c.id)"
                  [attr.aria-label]="'Select case ' + c.case_number">
                </mat-checkbox>
                <div class="case-info">
                  <span class="case-num">{{ c.case_number }}</span>
                  <span class="case-client">{{ c.customer_name }}</span>
                  <span class="case-detail">{{ c.violation_type }} · {{ c.state }}</span>
                  <span class="case-age" [class]="'age-' + getAgePriority(c.age_hours ?? 0)">
                    {{ formatAge(c.age_hours ?? 0) }} old
                    @if (getAgePriority(c.age_hours ?? 0) === 'urgent') {
                      <span class="priority-badge urgent" aria-label="Urgent">Urgent</span>
                    } @else if (getAgePriority(c.age_hours ?? 0) === 'warning') {
                      <span class="priority-badge warning" aria-label="Needs attention">Attention</span>
                    }
                  </span>
                </div>
                <button mat-raised-button color="primary" (click)="openAssign(c.id)">
                  Assign
                </button>
              </div>

              @if (selectedCaseId() === c.id) {
                <div class="assign-panel">
                  <mat-form-field appearance="outline">
                    <mat-label>Attorney</mat-label>
                    <mat-select [value]="selectedAttorneyId()"
                                (selectionChange)="selectedAttorneyId.set($event.value)">
                      @for (a of attorneys(); track a.id) {
                        <mat-option [value]="a.id">{{ a.full_name || a.fullName }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="price-field">
                    <mat-label>Attorney Fee ($)</mat-label>
                    <input matInput type="number" min="0"
                           [value]="attorneyPrice()"
                           (input)="attorneyPrice.set($any($event.target).value)"
                           aria-label="Attorney fee amount" />
                  </mat-form-field>
                  <div class="assign-actions">
                    <button mat-raised-button color="primary"
                            (click)="confirmAssign()"
                            [disabled]="assigning()">
                      @if (assigning()) { Assigning... } @else { Confirm }
                    </button>
                    <button mat-button (click)="cancelAssign()">Cancel</button>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
          <mat-divider></mat-divider>
        }
      }
    </div>
  `,
  styles: [`
    .op-dash { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }
    .summary-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .sum-card { flex: 1; min-width: 100px; }
    .sum-card mat-card-content { padding: 12px 16px; }
    .sum-lbl { margin: 0; font-size: 0.72rem; color: #888; text-transform: uppercase; }
    .sum-val { margin: 4px 0 0; font-size: 1.5rem; font-weight: 700; }
    .filter-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 48px 0; color: #888; gap: 8px; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .select-bar { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #e0e0e0; margin-bottom: 4px; }
    .bulk-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 16px; background: #e3f2fd; border-radius: 4px; margin-bottom: 12px; }
    .bulk-label { font-size: 0.85rem; font-weight: 600; color: #1565c0; white-space: nowrap; }
    .bulk-field { min-width: 160px; }
    .bulk-price-field { width: 120px; }
    .case-card { margin-bottom: 4px; }
    .case-row { display: flex; align-items: center; gap: 12px; }
    .case-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
    .case-num { font-weight: 700; font-size: 0.95rem; }
    .case-client { font-size: 0.85rem; color: #444; }
    .case-detail { font-size: 0.78rem; color: #888; }
    .case-age { font-size: 0.72rem; color: #888; display: flex; align-items: center; gap: 6px; }
    .age-warning { color: #f57c00; }
    .age-urgent { color: #c62828; }
    .priority-badge { font-size: 0.65rem; padding: 1px 6px; border-radius: 8px; font-weight: 700; }
    .priority-badge.urgent { background: #ffebee; color: #c62828; }
    .priority-badge.warning { background: #fff3e0; color: #e65100; }
    .assign-panel { margin-top: 12px; display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; border-top: 1px solid #eee; padding-top: 12px; }
    .price-field { width: 140px; }
    .assign-actions { display: flex; gap: 8px; align-items: center; padding-top: 8px; }
  `],
})
export class OperatorDashboardComponent implements OnInit, OnDestroy {
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  readonly STATUS_TABS: { value: StatusFilter; label: string }[] = [
    { value: 'new', label: 'New' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'waiting_for_driver', label: 'Waiting for Driver' },
  ];

  cases = signal<any[]>([]);
  summary = signal<any>({ newCount: 0, avgAgeHours: 0, assignedToday: 0 });
  attorneys = signal<any[]>([]);
  loading = signal(true);
  assigning = signal(false);

  // Status filter
  statusFilter = signal<StatusFilter>('new');

  // Single assignment form
  selectedCaseId = signal<string | null>(null);
  selectedAttorneyId = signal('');
  attorneyPrice = signal('');

  // Bulk selection
  selectedCaseIds = signal<Set<string>>(new Set());
  selectedCount = computed(() => this.selectedCaseIds().size);
  allSelected = computed(() =>
    this.cases().length > 0 && this.selectedCaseIds().size === this.cases().length
  );
  someSelected = computed(() =>
    this.selectedCaseIds().size > 0 && this.selectedCaseIds().size < this.cases().length
  );

  // Bulk assignment form
  bulkAttorneyId = signal('');
  bulkPrice = signal('');
  bulkAssigning = signal(false);

  readonly COLUMNS = ['case_number', 'customer_name', 'violation_type', 'state', 'age', 'actions'];

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.load();
    this.loadAttorneys();
    this.refreshInterval = setInterval(() => this.load(), 60_000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  load(): void {
    this.loading.set(true);
    this.caseService.getOperatorCases(this.statusFilter()).subscribe({
      next: (response: any) => {
        this.cases.set(response.cases || []);
        this.summary.set(response.summary || { newCount: 0, avgAgeHours: 0, assignedToday: 0 });
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadAttorneys(): void {
    this.caseService.getAvailableAttorneys().subscribe({
      next: (response: any) => this.attorneys.set(response.attorneys || []),
      error: () => {}
    });
  }

  // --- Status filter ---

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.clearSelection();
    this.load();
  }

  // --- Single assignment ---

  openAssign(caseId: string): void {
    this.selectedCaseId.set(caseId);
    this.selectedAttorneyId.set('');
    this.attorneyPrice.set('');
  }

  cancelAssign(): void {
    this.selectedCaseId.set(null);
  }

  confirmAssign(): void {
    const caseId = this.selectedCaseId();
    if (!caseId || !this.selectedAttorneyId() || !this.attorneyPrice()) return;

    const price = parseFloat(this.attorneyPrice());
    if (isNaN(price) || price <= 0) {
      this.snackBar.open('Enter a valid attorney fee', 'Close', { duration: 3000 });
      return;
    }

    this.assigning.set(true);
    this.caseService.assignToAttorney(caseId, this.selectedAttorneyId(), price).subscribe({
      next: () => {
        this.snackBar.open('Attorney assigned successfully', 'Close', { duration: 3000 });
        this.selectedCaseId.set(null);
        this.assigning.set(false);
        this.load();
      },
      error: () => {
        this.snackBar.open('Failed to assign attorney', 'Close', { duration: 3000 });
        this.assigning.set(false);
      }
    });
  }

  // --- Bulk selection ---

  toggleSelect(id: string): void {
    const set = new Set(this.selectedCaseIds());
    if (set.has(id)) { set.delete(id); } else { set.add(id); }
    this.selectedCaseIds.set(set);
  }

  toggleAll(): void {
    if (this.allSelected()) {
      this.selectedCaseIds.set(new Set());
    } else {
      this.selectedCaseIds.set(new Set(this.cases().map((c: any) => c.id)));
    }
  }

  clearSelection(): void {
    this.selectedCaseIds.set(new Set());
  }

  // --- Bulk assign ---

  bulkAssign(): void {
    const ids = Array.from(this.selectedCaseIds());
    if (!ids.length || !this.bulkAttorneyId() || !this.bulkPrice()) return;

    const price = parseFloat(this.bulkPrice());
    if (isNaN(price) || price <= 0) {
      this.snackBar.open('Enter a valid attorney fee', 'Close', { duration: 3000 });
      return;
    }

    this.bulkAssigning.set(true);
    forkJoin(ids.map(id => this.caseService.assignToAttorney(id, this.bulkAttorneyId(), price)))
      .subscribe({
        next: () => {
          this.snackBar.open(`${ids.length} case(s) assigned successfully`, 'Close', { duration: 3000 });
          this.clearSelection();
          this.bulkAttorneyId.set('');
          this.bulkPrice.set('');
          this.bulkAssigning.set(false);
          this.load();
        },
        error: () => {
          this.snackBar.open('Failed to assign some cases', 'Close', { duration: 3000 });
          this.bulkAssigning.set(false);
        }
      });
  }

  // --- Utilities ---

  viewCase(caseId: string): void {
    this.router.navigate(['/operator/cases', caseId]);
  }

  formatAge(hours: number): string {
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  getAgePriority(hours: number): 'urgent' | 'warning' | '' {
    if (hours >= 48) return 'urgent';
    if (hours >= 24) return 'warning';
    return '';
  }
}

import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SlicePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

import { CarrierService, FleetCase } from '../../../core/services/carrier.service';
import { VIOLATION_TYPE_REGISTRY } from '../../../core/constants/violation-type-registry';

type CaseFilter = 'all' | 'active' | 'pending' | 'resolved';

const ACTIVE_STATUSES = new Set([
  'assigned_to_attorney', 'send_info_to_attorney', 'call_court', 'check_with_manager',
]);
const PENDING_STATUSES = new Set(['new', 'reviewed', 'waiting_for_driver', 'pay_attorney']);

@Component({
  selector: 'app-carrier-cases',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SlicePipe, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatCheckboxModule, MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="cases-page">
      <div class="page-header">
        <h1>{{ 'CARRIER.FLEET_CASES' | translate }}</h1>
        <button mat-stroked-button (click)="goToImport()" aria-label="Bulk import cases from CSV">
          <mat-icon aria-hidden="true">upload_file</mat-icon> {{ 'CARRIER.IMPORT_CSV' | translate }}
        </button>
      </div>

      <div class="filter-chips" role="group" aria-label="Filter cases">
        @for (f of filters; track f.value) {
          <button mat-stroked-button [class.active-filter]="activeFilter() === f.value"
                  (click)="setFilter(f.value)">
            {{ f.label | translate }}
          </button>
        }
      </div>

      @if (selectedIds().size > 0) {
        <div class="bulk-bar" role="toolbar" aria-label="Bulk actions">
          <span class="selected-count">{{ selectedIds().size }} {{ 'CARRIER.SELECTED' | translate }}</span>
          <button mat-raised-button color="warn" [disabled]="archiving()"
                  (click)="bulkArchive()" aria-label="Archive selected cases">
            @if (archiving()) {
              <mat-spinner diameter="16" aria-label="Archiving"></mat-spinner>
            } @else {
              {{ 'CARRIER.ARCHIVE_SELECTED' | translate }}
            }
          </button>
          <button mat-stroked-button (click)="clearSelection()">{{ 'CARRIER.CANCEL' | translate }}</button>
        </div>
      }

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (filteredCases().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">folder_open</mat-icon>
          <p>{{ 'CARRIER.NO_CASES_FOUND' | translate }}</p>
        </div>
      } @else {
        <div class="case-list" role="list">
          @for (c of filteredCases(); track c.id) {
            <mat-card class="case-card" role="listitem">
              <mat-card-content>
                <div class="case-row">
                  <mat-checkbox
                    [checked]="selectedIds().has(c.id)"
                    (change)="toggleSelect(c.id)"
                    [attr.aria-label]="'Select case ' + c.case_number">
                  </mat-checkbox>
                  <div class="case-main" (click)="viewCase(c.id)" style="cursor:pointer; flex:1"
                       [attr.aria-label]="'View case ' + c.case_number" role="button" tabindex="0"
                       (keydown.enter)="viewCase(c.id)">
                    <p class="case-number">{{ c.case_number }}</p>
                    <p class="driver-name">{{ c.driver_name }}</p>
                  </div>
                  <div class="case-meta">
                    <span class="violation">{{ getViolationLabel(c.violation_type) }}</span>
                    <span [class]="getSeverityClass(c)" [attr.aria-label]="'Severity: ' + getSeverityLevel(c)">{{ getSeverityLevel(c) }}</span>
                    <span class="state-badge">{{ c.state }}</span>
                    <span class="status-chip status-{{ c.status }}">{{ c.status | slice:0:12 }}</span>
                  </div>
                </div>
                @if (c.attorney_name) {
                  <p class="attorney">{{ 'CARRIER.ATTORNEY' | translate }} {{ c.attorney_name }}</p>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .cases-page { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    h1 { margin: 0; font-size: 1.4rem; }
    .filter-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .active-filter { background: #1976d2; color: #fff; }
    .bulk-bar { display: flex; align-items: center; gap: 10px; padding: 8px 12px;
      background: #e3f2fd; border-radius: 6px; margin-bottom: 12px; }
    .selected-count { font-size: 0.9rem; font-weight: 600; flex: 1; }
    .loading { display: flex; justify-content: center; padding: 32px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 32px; color: #999; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .case-list { display: flex; flex-direction: column; gap: 10px; }
    .case-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .case-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .case-number { margin: 0; font-weight: 600; font-size: 0.9rem; }
    .driver-name { margin: 2px 0 0; font-size: 0.85rem; color: #555; }
    .case-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .violation { font-size: 0.75rem; background: #e3f2fd; color: #1565c0; padding: 2px 6px; border-radius: 4px; }
    .state-badge { font-size: 0.75rem; font-weight: 600; color: #666; }
    .status-chip { font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; background: #e0e0e0; }
    .attorney { margin: 6px 0 0; font-size: 0.8rem; color: #666; }
    .severity-badge { font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; font-weight: 600; }
    .severity-critical { background: #fef2f2; color: #dc2626; }
    .severity-serious { background: #fff7ed; color: #ea580c; }
    .severity-standard { background: #eff6ff; color: #2563eb; }
    .severity-minor { background: #f0fdf4; color: #16a34a; }
  `],
})
export class CarrierCasesComponent implements OnInit {
  private carrierService = inject(CarrierService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  cases = signal<FleetCase[]>([]);
  loading = signal(true);
  archiving = signal(false);
  activeFilter = signal<CaseFilter>('all');
  selectedIds = signal<Set<string>>(new Set());

  filters: { value: CaseFilter; label: string }[] = [
    { value: 'all', label: 'CARRIER.ALL' },
    { value: 'active', label: 'CARRIER.ACTIVE' },
    { value: 'pending', label: 'CARRIER.PENDING' },
    { value: 'resolved', label: 'CARRIER.RESOLVED' },
  ];

  filteredCases = computed(() => {
    const f = this.activeFilter();
    const all = this.cases();
    if (f === 'all') return all;
    if (f === 'active') return all.filter(c => ACTIVE_STATUSES.has(c.status));
    if (f === 'pending') return all.filter(c => PENDING_STATUSES.has(c.status));
    return all.filter(c => c.status === 'closed' || c.status === 'resolved');
  });

  ngOnInit(): void {
    this.carrierService.getCases().subscribe({
      next: (r) => { this.cases.set(r.cases); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setFilter(f: CaseFilter): void {
    this.activeFilter.set(f);
    this.clearSelection();
  }

  toggleSelect(id: string): void {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  clearSelection(): void { this.selectedIds.set(new Set()); }

  bulkArchive(): void {
    const ids = [...this.selectedIds()];
    if (ids.length === 0) return;
    this.archiving.set(true);
    this.carrierService.bulkArchive(ids).subscribe({
      next: ({ archived }) => {
        this.archiving.set(false);
        this.cases.update(list => list.map(c =>
          ids.includes(c.id) ? { ...c, status: 'closed' } : c,
        ));
        this.clearSelection();
        this.snackBar.open(`${archived} case${archived !== 1 ? 's' : ''} archived.`, 'Close', { duration: 3000 });
      },
      error: () => {
        this.archiving.set(false);
        this.snackBar.open('Failed to archive cases.', 'Close', { duration: 3000 });
      },
    });
  }

  goToImport(): void { this.router.navigate(['/carrier/bulk-import']); }

  viewCase(id: string): void { this.router.navigate(['/driver/cases', id]); }

  getViolationLabel(type: string | undefined): string {
    if (!type) return 'Unknown';
    const config = VIOLATION_TYPE_REGISTRY[type];
    return config ? `${config.icon} ${config.label}` : type;
  }

  getSeverityLevel(c: FleetCase): string {
    return (c as any).violation_severity || VIOLATION_TYPE_REGISTRY[c.violation_type]?.severity || 'standard';
  }

  getSeverityClass(c: FleetCase): string {
    return `severity-badge severity-${this.getSeverityLevel(c)}`;
  }
}

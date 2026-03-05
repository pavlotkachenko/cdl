import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { SlicePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CarrierService, FleetCase } from '../../../core/services/carrier.service';

type CaseFilter = 'all' | 'active' | 'pending' | 'resolved';

const ACTIVE_STATUSES = new Set([
  'assigned_to_attorney', 'send_info_to_attorney', 'call_court', 'check_with_manager',
]);
const PENDING_STATUSES = new Set(['new', 'reviewed', 'waiting_for_driver', 'pay_attorney']);

@Component({
  selector: 'app-carrier-cases',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SlicePipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule],
  template: `
    <div class="cases-page">
      <h1>Fleet Cases</h1>

      <div class="filter-chips" role="group" aria-label="Filter cases">
        @for (f of filters; track f.value) {
          <button mat-stroked-button [class.active-filter]="activeFilter() === f.value"
                  (click)="setFilter(f.value)">
            {{ f.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (filteredCases().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">folder_open</mat-icon>
          <p>No {{ activeFilter() === 'all' ? '' : activeFilter() + ' ' }}cases found.</p>
        </div>
      } @else {
        <div class="case-list" role="list">
          @for (c of filteredCases(); track c.id) {
            <mat-card class="case-card" role="listitem" (click)="viewCase(c.id)"
                      style="cursor:pointer" [attr.aria-label]="'View case ' + c.case_number">
              <mat-card-content>
                <div class="case-row">
                  <div class="case-main">
                    <p class="case-number">{{ c.case_number }}</p>
                    <p class="driver-name">{{ c.driver_name }}</p>
                  </div>
                  <div class="case-meta">
                    <span class="violation">{{ c.violation_type }}</span>
                    <span class="state-badge">{{ c.state }}</span>
                    <span class="status-chip status-{{ c.status }}">{{ c.status | slice:0:12 }}</span>
                  </div>
                </div>
                @if (c.attorney_name) {
                  <p class="attorney">Attorney: {{ c.attorney_name }}</p>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .cases-page { max-width: 680px; margin: 0 auto; padding: 24px 16px; }
    h1 { margin: 0 0 16px; font-size: 1.4rem; }
    .filter-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .active-filter { background: #1976d2; color: #fff; }
    .loading { display: flex; justify-content: center; padding: 32px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 32px; color: #999; text-align: center; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }
    .case-list { display: flex; flex-direction: column; gap: 10px; }
    .case-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .case-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .case-number { margin: 0; font-weight: 600; font-size: 0.9rem; }
    .driver-name { margin: 2px 0 0; font-size: 0.85rem; color: #555; }
    .case-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
    .violation { font-size: 0.75rem; background: #e3f2fd; color: #1565c0; padding: 2px 6px; border-radius: 4px; }
    .state-badge { font-size: 0.75rem; font-weight: 600; color: #666; }
    .status-chip { font-size: 0.7rem; padding: 2px 6px; border-radius: 10px; background: #e0e0e0; }
    .attorney { margin: 6px 0 0; font-size: 0.8rem; color: #666; }
  `],
})
export class CarrierCasesComponent implements OnInit {
  private carrierService = inject(CarrierService);
  private router = inject(Router);

  cases = signal<FleetCase[]>([]);
  loading = signal(true);
  activeFilter = signal<CaseFilter>('all');

  filters: { value: CaseFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'resolved', label: 'Resolved' },
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

  setFilter(f: CaseFilter): void { this.activeFilter.set(f); }

  viewCase(id: string): void { this.router.navigate(['/driver/cases', id]); }
}

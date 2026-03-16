import {
  Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CaseService } from '../../../core/services/case.service';
import { CaseTableComponent } from '../../shared/case-table/case-table.component';
import { ColumnToggleComponent } from '../../shared/case-table/column-toggle.component';
import {
  CaseTableRow, TableDensity,
  ALL_COLUMNS, DEFAULT_VISIBLE_COLUMNS,
} from '../../shared/case-table/case-table.models';
import { CASE_STATUSES, US_STATES } from '../../admin/case-table/admin-case-table.component';

interface ActiveFilter {
  type: 'status' | 'state' | 'carrier';
  label: string;
  value: string;
}

@Component({
  selector: 'app-operator-all-cases',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TitleCasePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    TranslateModule,
    CaseTableComponent,
    ColumnToggleComponent,
  ],
  styles: [`
    .case-table-page { padding: 24px; }
    .page-header { display: flex; align-items: baseline; gap: 16px; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 1.5rem; }
    .case-count { color: #757575; font-size: 0.875rem; }

    .toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .search-field { flex: 0 1 300px; }
    .filter-field { flex: 0 1 150px; }
    .toolbar-spacer { flex: 1; }

    .active-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .clear-all { font-size: 0.8rem; }

    @media (max-width: 1023px) {
      .toolbar { flex-direction: column; align-items: stretch; }
      .search-field { flex: 1 1 100%; }
      .filter-field { flex: 1 1 calc(50% - 4px); }
      .toolbar-spacer { display: none; }
    }

    @media (max-width: 768px) {
      .case-table-page { padding: 12px; }
      .filter-field { flex: 1 1 100%; }
    }

    /* Mobile card layout */
    .case-cards { display: flex; flex-direction: column; gap: 8px; }
    .case-card {
      display: flex; flex-direction: column; position: relative;
      padding: 12px 40px 12px 12px;
      border: 1px solid #e0e0e0; border-radius: 8px;
      background: white; cursor: pointer; min-height: 44px;
    }
    .case-card:hover { border-color: #1976d2; background: #fafafa; }
    .case-card:focus-visible { outline: 2px solid #1976d2; outline-offset: 2px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .card-case-number { font-weight: 600; font-size: 0.9rem; }
    .card-status { font-size: 0.7rem; }
    .card-body { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
    .card-label { font-size: 0.7rem; color: #757575; }
    .card-value { font-size: 0.85rem; color: #212121; }
    .card-arrow {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%); color: #bdbdbd;
    }
    .mobile-paginator {
      display: flex; align-items: center; justify-content: center; gap: 16px; padding: 12px;
    }
    .page-info { font-size: 0.85rem; color: #616161; }
    .empty-cards, .loading-cards {
      display: flex; flex-direction: column; align-items: center; padding: 48px; color: #757575;
    }
  `],
  template: `
    <div class="case-table-page">
      <div class="page-header">
        <h1>{{ 'OPR.ALL_CASES_TITLE' | translate }}</h1>
        <span class="case-count">
          {{ totalCount() }} {{ 'TABLE.TOTAL_CASES' | translate }}
        </span>
      </div>

      <div class="toolbar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput
                 [placeholder]="'TABLE.SEARCH_PLACEHOLDER' | translate"
                 [value]="searchTerm()"
                 (input)="onSearchInput($event)">
          @if (searchTerm()) {
            <button matSuffix mat-icon-button (click)="clearSearch()"
                    [attr.aria-label]="'TABLE.CLEAR_SEARCH' | translate">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>{{ 'TABLE.FILTER_STATUS' | translate }}</mat-label>
          <mat-select multiple [value]="statusFilter()"
                      (selectionChange)="onStatusFilterChange($event.value)">
            @for (s of statusOptions; track s) {
              <mat-option [value]="s">{{ s | titlecase }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>{{ 'TABLE.FILTER_STATE' | translate }}</mat-label>
          <mat-select multiple [value]="stateFilter()"
                      (selectionChange)="onStateFilterChange($event.value)">
            @for (s of usStates; track s) {
              <mat-option [value]="s">{{ s }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>{{ 'TABLE.FILTER_CARRIER' | translate }}</mat-label>
          <input matInput [value]="carrierFilter()"
                 (input)="onCarrierInput($event)">
        </mat-form-field>

        <div class="toolbar-spacer"></div>

        @if (!isMobile()) {
          <app-column-toggle
            [allColumns]="allColumns"
            [visibleKeys]="visibleColumns()"
            (columnsChange)="onColumnsChange($event)">
          </app-column-toggle>

          <mat-button-toggle-group [value]="density()"
                                   (change)="onDensityChange($event.value)"
                                   [attr.aria-label]="'TABLE.DENSITY' | translate">
            <mat-button-toggle value="compact">
              <mat-icon>density_small</mat-icon>
            </mat-button-toggle>
            <mat-button-toggle value="default">
              <mat-icon>density_medium</mat-icon>
            </mat-button-toggle>
            <mat-button-toggle value="comfortable">
              <mat-icon>density_large</mat-icon>
            </mat-button-toggle>
          </mat-button-toggle-group>
        }
      </div>

      @if (activeFilters().length > 0) {
        <div class="active-filters" role="region" [attr.aria-label]="'TABLE.ACTIVE_FILTERS' | translate">
          @for (f of activeFilters(); track f.type + f.value) {
            <mat-chip-row (removed)="removeFilter(f)">
              {{ f.label | titlecase }}
              <button matChipRemove [attr.aria-label]="'TABLE.REMOVE_FILTER' | translate">
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip-row>
          }
          <button mat-button (click)="clearAllFilters()" class="clear-all">
            {{ 'TABLE.CLEAR_ALL_FILTERS' | translate }}
          </button>
        </div>
      }

      @if (isMobile()) {
        <div class="case-cards" role="list">
          @for (c of cases(); track c.id) {
            <div class="case-card" role="listitem" tabindex="0"
                 (click)="onRowClick(c)" (keydown.enter)="onRowClick(c)"
                 [attr.aria-label]="('TABLE.CASE_ROW' | translate) + ' ' + c.case_number">
              <div class="card-header">
                <span class="card-case-number">{{ c.case_number }}</span>
                <mat-chip [class]="'status-chip status-' + c.status" class="card-status">
                  {{ c.status | titlecase }}
                </mat-chip>
              </div>
              <div class="card-body">
                <div class="card-field">
                  <span class="card-label">{{ 'TABLE.COL_CUSTOMER_NAME' | translate }}</span>
                  <span class="card-value">{{ c.customer_name }}</span>
                </div>
                <div class="card-field">
                  <span class="card-label">{{ 'TABLE.COL_STATE' | translate }}</span>
                  <span class="card-value">{{ c.state }}</span>
                </div>
                <div class="card-field">
                  <span class="card-label">{{ 'TABLE.COL_VIOLATION_TYPE' | translate }}</span>
                  <span class="card-value">{{ c.violation_type | titlecase }}</span>
                </div>
                @if (c.court_date) {
                  <div class="card-field">
                    <span class="card-label">{{ 'TABLE.COL_COURT_DATE' | translate }}</span>
                    <span class="card-value">{{ formatDate(c.court_date) }}</span>
                  </div>
                }
                @if (c.attorney_name) {
                  <div class="card-field">
                    <span class="card-label">{{ 'TABLE.COL_ATTORNEY_NAME' | translate }}</span>
                    <span class="card-value">{{ c.attorney_name }}</span>
                  </div>
                }
              </div>
              <mat-icon class="card-arrow">chevron_right</mat-icon>
            </div>
          }
          @if (cases().length === 0 && !loading()) {
            <div class="empty-cards" role="status">
              <mat-icon>search_off</mat-icon>
              <p>{{ 'TABLE.NO_RESULTS' | translate }}</p>
            </div>
          }
          @if (loading()) {
            <div class="loading-cards" role="status" aria-busy="true">
              <mat-spinner diameter="40"></mat-spinner>
            </div>
          }
          <div class="mobile-paginator">
            <button mat-icon-button [disabled]="pageIndex() === 0"
                    (click)="onPageChange({ pageIndex: pageIndex() - 1, pageSize: pageSize() })"
                    [attr.aria-label]="'TABLE.PREV_PAGE' | translate">
              <mat-icon>chevron_left</mat-icon>
            </button>
            <span class="page-info">
              {{ pageIndex() * pageSize() + 1 }}–{{ pageIndex() * pageSize() + cases().length }}
              {{ 'TABLE.OF' | translate }} {{ totalCount() }}
            </span>
            <button mat-icon-button
                    [disabled]="(pageIndex() + 1) * pageSize() >= totalCount()"
                    (click)="onPageChange({ pageIndex: pageIndex() + 1, pageSize: pageSize() })"
                    [attr.aria-label]="'TABLE.NEXT_PAGE' | translate">
              <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        </div>
      } @else {
        <app-case-table
          [cases]="cases()"
          [totalCount]="totalCount()"
          [loading]="loading()"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [visibleColumns]="visibleColumns()"
          [density]="density()"
          [role]="'operator'"
          (sortChange)="onSortChange($event)"
          (pageChange)="onPageChange($event)"
          (rowClick)="onRowClick($event)"
          (viewDetail)="onViewDetail($event)">
        </app-case-table>
      }
    </div>
  `,
})
export class OperatorAllCasesComponent implements OnInit, OnDestroy {
  private readonly caseService = inject(CaseService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroy$ = new Subject<void>();

  isMobile = signal(false);

  private static readonly STORAGE_KEY_COLUMNS = 'operator_case_table_columns';
  private static readonly STORAGE_KEY_DENSITY = 'operator_case_table_density';

  // Data
  cases = signal<CaseTableRow[]>([]);
  totalCount = signal(0);
  loading = signal(false);

  // Pagination
  pageSize = signal(25);
  pageIndex = signal(0);

  // Sort
  sortActive = signal('created_at');
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Search & filters
  searchTerm = signal('');
  statusFilter = signal<string[]>([]);
  stateFilter = signal<string[]>([]);
  carrierFilter = signal('');

  // Column visibility & density
  visibleColumns = signal<string[]>([...DEFAULT_VISIBLE_COLUMNS]);
  density = signal<TableDensity>('default');

  // Reference data
  readonly allColumns = ALL_COLUMNS;
  readonly statusOptions = CASE_STATUSES;
  readonly usStates = US_STATES;

  // Debounced inputs
  private readonly searchSubject = new Subject<string>();
  private readonly carrierSubject = new Subject<string>();

  activeFilters = computed<ActiveFilter[]>(() => {
    const filters: ActiveFilter[] = [];
    for (const s of this.statusFilter()) {
      filters.push({ type: 'status', label: s, value: s });
    }
    for (const s of this.stateFilter()) {
      filters.push({ type: 'state', label: s, value: s });
    }
    if (this.carrierFilter()) {
      filters.push({ type: 'carrier', label: this.carrierFilter(), value: this.carrierFilter() });
    }
    return filters;
  });

  ngOnInit(): void {
    this.loadPreferences();
    this.setupDebounce();
    this.setupBreakpoints();
    this.loadCases();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCases(): void {
    this.loading.set(true);
    const params = this.buildParams();
    this.caseService.getOperatorAllCases(params).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (response) => {
        this.cases.set(response.cases);
        this.totalCount.set(response.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open(this.translate.instant('TABLE.LOAD_FAILED'), 'OK', { duration: 5000 });
      },
    });
  }

  onSortChange(sort: { active: string; direction: 'asc' | 'desc' | '' }): void {
    this.sortActive.set(sort.active);
    this.sortDirection.set(sort.direction === 'asc' ? 'asc' : 'desc');
    this.loadCases();
  }

  onPageChange(page: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(page.pageIndex);
    this.pageSize.set(page.pageSize);
    this.loadCases();
  }

  onRowClick(row: CaseTableRow): void {
    this.router.navigate(['/operator/cases', row.id]);
  }

  onViewDetail(row: CaseTableRow): void {
    this.router.navigate(['/operator/cases', row.id]);
  }

  onSearchInput(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement).value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.pageIndex.set(0);
    this.loadCases();
  }

  onStatusFilterChange(values: string[]): void {
    this.statusFilter.set(values);
    this.pageIndex.set(0);
    this.loadCases();
  }

  onStateFilterChange(values: string[]): void {
    this.stateFilter.set(values);
    this.pageIndex.set(0);
    this.loadCases();
  }

  onCarrierInput(event: Event): void {
    this.carrierSubject.next((event.target as HTMLInputElement).value);
  }

  removeFilter(filter: ActiveFilter): void {
    switch (filter.type) {
      case 'status':
        this.statusFilter.update(arr => arr.filter(s => s !== filter.value));
        break;
      case 'state':
        this.stateFilter.update(arr => arr.filter(s => s !== filter.value));
        break;
      case 'carrier':
        this.carrierFilter.set('');
        break;
    }
    this.pageIndex.set(0);
    this.loadCases();
  }

  clearAllFilters(): void {
    this.searchTerm.set('');
    this.statusFilter.set([]);
    this.stateFilter.set([]);
    this.carrierFilter.set('');
    this.pageIndex.set(0);
    this.loadCases();
  }

  onColumnsChange(columns: string[]): void {
    const coreKeys = ALL_COLUMNS.filter(c => c.group === 'core').map(c => c.key);
    const merged = [...new Set([...coreKeys, ...columns])];
    this.visibleColumns.set(merged);
    localStorage.setItem(OperatorAllCasesComponent.STORAGE_KEY_COLUMNS, JSON.stringify(merged));
  }

  onDensityChange(value: TableDensity): void {
    this.density.set(value);
    localStorage.setItem(OperatorAllCasesComponent.STORAGE_KEY_DENSITY, value);
  }

  private buildParams(): Record<string, string | number> {
    const params: Record<string, string | number> = {
      limit: this.pageSize(),
      offset: this.pageIndex() * this.pageSize(),
      sort_by: this.sortActive(),
      sort_dir: this.sortDirection(),
    };
    if (this.searchTerm()) params['search'] = this.searchTerm();
    if (this.statusFilter().length) params['status'] = this.statusFilter().join(',');
    if (this.stateFilter().length) params['state'] = this.stateFilter().join(',');
    if (this.carrierFilter()) params['carrier'] = this.carrierFilter();
    return params;
  }

  private loadPreferences(): void {
    try {
      const savedCols = localStorage.getItem(OperatorAllCasesComponent.STORAGE_KEY_COLUMNS);
      if (savedCols) {
        const parsed = JSON.parse(savedCols);
        if (Array.isArray(parsed) && parsed.every(k => typeof k === 'string')) {
          this.visibleColumns.set(parsed);
        }
      }
    } catch { /* fallback to defaults */ }

    const savedDensity = localStorage.getItem(OperatorAllCasesComponent.STORAGE_KEY_DENSITY);
    if (savedDensity && ['compact', 'default', 'comfortable'].includes(savedDensity)) {
      this.density.set(savedDensity as TableDensity);
    }
  }

  private setupBreakpoints(): void {
    this.breakpointObserver.observe(['(max-width: 767px)']).pipe(
      takeUntil(this.destroy$),
    ).subscribe(result => {
      this.isMobile.set(result.breakpoints['(max-width: 767px)'] || false);
    });
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }

  private setupDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(term => {
      this.searchTerm.set(term);
      this.pageIndex.set(0);
      this.loadCases();
    });

    this.carrierSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(carrier => {
      this.carrierFilter.set(carrier);
      this.pageIndex.set(0);
      this.loadCases();
    });
  }
}

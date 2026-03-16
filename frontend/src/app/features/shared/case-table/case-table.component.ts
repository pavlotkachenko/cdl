import {
  Component, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit,
  computed, effect, input, output, signal,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import {
  CaseTableRow, ColumnDef, TableDensity,
  ALL_COLUMNS, DEFAULT_VISIBLE_COLUMNS,
} from './case-table.models';

@Component({
  selector: 'app-case-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    TitleCasePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule,
  ],
  styles: [`
    :host { display: block; }

    .case-table-container { position: relative; }

    /* Density variants */
    .density-compact .mat-mdc-row { height: 36px; }
    .density-compact .mat-mdc-cell { font-size: 0.8rem; padding: 2px 8px; }
    .density-default .mat-mdc-row { height: 48px; }
    .density-default .mat-mdc-cell { padding: 4px 12px; }
    .density-comfortable .mat-mdc-row { height: 56px; }
    .density-comfortable .mat-mdc-cell { padding: 8px 16px; font-size: 0.95rem; }

    /* Horizontal scroll */
    .table-scroll-wrapper {
      position: relative;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* Scroll hint */
    .scroll-hint {
      position: absolute; right: 16px; top: 50%;
      transform: translateY(-50%);
      display: flex; align-items: center; gap: 4px;
      background: rgba(25, 118, 210, 0.9); color: white;
      padding: 6px 12px; border-radius: 16px;
      font-size: 0.75rem; pointer-events: none; z-index: 5;
      animation: fadeInOut 3s ease-in-out forwards;
    }
    @keyframes fadeInOut {
      0% { opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }

    /* Sticky columns background */
    .mat-mdc-header-cell[style*="sticky"],
    .mat-mdc-cell[style*="sticky"] {
      background: white;
      z-index: 1;
    }

    /* Clickable rows */
    .case-row { cursor: pointer; }
    .case-row:hover { background-color: rgba(0, 0, 0, 0.04); }
    .case-row:focus-visible { outline: 2px solid #1976d2; outline-offset: -2px; }

    /* Status chips */
    .status-chip { font-size: 0.75rem; }
    .status-new { background-color: #e3f2fd !important; color: #1565c0 !important; }
    .status-reviewed { background-color: #fff3e0 !important; color: #e65100 !important; }
    .status-assigned_to_attorney { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-waiting_for_driver { background-color: #fff8e1 !important; color: #f57f17 !important; }
    .status-closed { background-color: #f5f5f5 !important; color: #616161 !important; }
    .status-resolved { background-color: #e8f5e9 !important; color: #1b5e20 !important; }

    /* Boolean icons */
    .bool-yes { color: #2e7d32; }
    .bool-no { color: #9e9e9e; }

    /* File count */
    .file-count { display: flex; align-items: center; gap: 4px; }
    .file-icon { font-size: 16px; width: 16px; height: 16px; color: #757575; }

    /* No data */
    .no-data { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #757575; }
    .no-data mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; }
    .no-data-cell { text-align: center; }

    /* Loading overlay */
    .loading-overlay {
      position: absolute; inset: 0; display: flex; align-items: center;
      justify-content: center; background: rgba(255,255,255,0.7); z-index: 10;
    }

    /* Screen reader only */
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); border: 0;
    }

    /* Expandable row detail */
    .expand-cell { width: 40px; padding: 0 4px !important; }
    .detail-row { height: 0; }
    .detail-row td { padding: 0 !important; border-bottom: none; }
    .detail-row.expanded td { padding: 0 !important; border-bottom: 1px solid #e0e0e0; }
    .expanded-detail { padding: 16px 24px; background: #fafafa; }
    .detail-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 8px 24px; margin-bottom: 12px;
    }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-label { font-size: 0.75rem; color: #757575; font-weight: 500; }
    .detail-value { font-size: 0.875rem; color: #212121; }
  `],
  template: `
    <div class="case-table-container" [class]="'density-' + density()">
      @if (loading()) {
        <div class="loading-overlay" role="status" aria-busy="true">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      }

      <div class="table-scroll-wrapper" #scrollWrapper (scroll)="onScroll()">
        @if (hasOverflow() && !hasScrolled()) {
          <div class="scroll-hint" aria-hidden="true">
            <mat-icon>arrow_forward</mat-icon>
            <span>{{ 'TABLE.SCROLL_HINT' | translate }}</span>
          </div>
        }
        <table mat-table [dataSource]="dataSource" multiTemplateDataRows
               matSort (matSortChange)="onSortChange($event)"
               class="case-table">

          <!-- Expand toggle column -->
          <ng-container matColumnDef="expand" sticky>
            <th mat-header-cell *matHeaderCellDef class="expand-cell"></th>
            <td mat-cell *matCellDef="let row" class="expand-cell">
              <button mat-icon-button (click)="toggleExpand(row, $event)"
                      [attr.aria-label]="(expandedRowId() === row.id ? ('TABLE.COLLAPSE' | translate) : ('TABLE.EXPAND' | translate))"
                      [attr.aria-expanded]="expandedRowId() === row.id">
                <mat-icon>{{ expandedRowId() === row.id ? 'expand_less' : 'expand_more' }}</mat-icon>
              </button>
            </td>
          </ng-container>

          @for (col of displayedColumns(); track col) {
            <ng-container [matColumnDef]="col"
                          [sticky]="getColumnDef(col)?.sticky || false">
              <th mat-header-cell *matHeaderCellDef
                  [mat-sort-header]="getColumnDef(col)?.sortable ? col : ''"
                  [disabled]="!getColumnDef(col)?.sortable"
                  [style.min-width]="getColumnDef(col)?.width">
                {{ getColumnDef(col)?.header | translate }}
              </th>
              <td mat-cell *matCellDef="let row" [style.min-width]="getColumnDef(col)?.width">
                @switch (getColumnDef(col)?.type) {
                  @case ('status') {
                    <mat-chip [class]="'status-chip status-' + row[col]">
                      {{ row[col] | titlecase }}
                    </mat-chip>
                  }
                  @case ('date') {
                    {{ formatDate(row[col]) }}
                  }
                  @case ('currency') {
                    {{ formatCurrency(row[col]) }}
                  }
                  @case ('boolean') {
                    <mat-icon [class]="row[col] ? 'bool-yes' : 'bool-no'">
                      {{ row[col] ? 'check_circle' : 'cancel' }}
                    </mat-icon>
                    <span class="sr-only">{{ row[col] ? ('TABLE.YES' | translate) : ('TABLE.NO' | translate) }}</span>
                  }
                  @case ('count') {
                    <span class="file-count">
                      <mat-icon class="file-icon">attach_file</mat-icon>
                      {{ row[col] }}
                    </span>
                  }
                  @case ('phone') {
                    {{ row[col] || '—' }}
                  }
                  @default {
                    {{ row[col] || '—' }}
                  }
                }
              </td>
            </ng-container>
          }

          <!-- Expanded detail row column -->
          <ng-container matColumnDef="expandedDetail">
            <td mat-cell *matCellDef="let row" [attr.colspan]="allDisplayedColumns().length">
              @if (expandedRowId() === row.id) {
                <div class="expanded-detail">
                  <div class="detail-grid">
                    @for (col of allColumnDefs; track col.key) {
                      <div class="detail-item">
                        <span class="detail-label">{{ col.header | translate }}</span>
                        <span class="detail-value">
                          @switch (col.type) {
                            @case ('currency') { {{ formatCurrency(row[col.key]) }} }
                            @case ('date') { {{ formatDate(row[col.key]) }} }
                            @case ('boolean') { {{ row[col.key] === true ? ('TABLE.YES' | translate) : row[col.key] === false ? ('TABLE.NO' | translate) : '—' }} }
                            @default { {{ row[col.key] || '—' }} }
                          }
                        </span>
                      </div>
                    }
                  </div>
                  <button mat-button color="primary" (click)="onViewDetail(row)">
                    {{ 'TABLE.VIEW_FULL_DETAIL' | translate }}
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="allDisplayedColumns(); sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: allDisplayedColumns();"
              class="case-row"
              (click)="onRowClicked(row)"
              (keydown.enter)="onRowClicked(row)"
              tabindex="0"
              [attr.aria-label]="('TABLE.CASE_ROW' | translate) + ' ' + row.case_number">
          </tr>
          <tr mat-row *matRowDef="let row; columns: ['expandedDetail']"
              class="detail-row"
              [class.expanded]="expandedRowId() === row.id">
          </tr>

          <tr class="mat-mdc-row" *matNoDataRow>
            <td [attr.colspan]="allDisplayedColumns().length" class="no-data-cell">
              @if (!loading()) {
                <div class="no-data" role="status">
                  <mat-icon>search_off</mat-icon>
                  <p>{{ 'TABLE.NO_RESULTS' | translate }}</p>
                </div>
              }
            </td>
          </tr>
        </table>
      </div>

      <mat-paginator
        [length]="totalCount()"
        [pageSize]="pageSize()"
        [pageIndex]="pageIndex()"
        [pageSizeOptions]="[10, 25, 50, 100]"
        (page)="onPageChange($event)"
        showFirstLastButtons
        [attr.aria-label]="'TABLE.PAGINATOR' | translate">
      </mat-paginator>
    </div>
  `,
})
export class CaseTableComponent implements AfterViewInit {
  // Inputs
  cases = input.required<CaseTableRow[]>();
  totalCount = input.required<number>();
  loading = input<boolean>(false);
  pageSize = input<number>(25);
  pageIndex = input<number>(0);
  visibleColumns = input<string[]>(DEFAULT_VISIBLE_COLUMNS);
  density = input<TableDensity>('default');
  role = input<'admin' | 'operator'>('admin');

  // Outputs
  sortChange = output<{ active: string; direction: 'asc' | 'desc' | '' }>();
  pageChange = output<{ pageIndex: number; pageSize: number }>();
  rowClick = output<CaseTableRow>();
  viewDetail = output<CaseTableRow>();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('scrollWrapper') scrollWrapper!: ElementRef<HTMLDivElement>;

  dataSource = new MatTableDataSource<CaseTableRow>([]);
  expandedRowId = signal<string | null>(null);
  hasOverflow = signal(false);
  hasScrolled = signal(false);

  readonly allColumnDefs = ALL_COLUMNS;
  private readonly columnMap = new Map<string, ColumnDef>();

  displayedColumns = computed(() => {
    return this.visibleColumns().filter(key => this.columnMap.has(key));
  });

  /** Columns including the expand toggle prepended. */
  allDisplayedColumns = computed(() => {
    return ['expand', ...this.displayedColumns()];
  });

  constructor() {
    ALL_COLUMNS.forEach(c => this.columnMap.set(c.key, c));

    effect(() => {
      this.dataSource.data = this.cases();
    });
  }

  ngAfterViewInit(): void {
    this.checkOverflow();
  }

  checkOverflow(): void {
    const el = this.scrollWrapper?.nativeElement;
    if (el) {
      this.hasOverflow.set(el.scrollWidth > el.clientWidth);
    }
  }

  onScroll(): void {
    if (!this.hasScrolled()) this.hasScrolled.set(true);
  }

  getColumnDef(key: string): ColumnDef | undefined {
    return this.columnMap.get(key);
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit({ active: sort.active, direction: sort.direction as 'asc' | 'desc' | '' });
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  onRowClicked(row: CaseTableRow): void {
    this.rowClick.emit(row);
  }

  toggleExpand(row: CaseTableRow, event: Event): void {
    event.stopPropagation();
    this.expandedRowId.update(id => id === row.id ? null : row.id);
  }

  onViewDetail(row: CaseTableRow): void {
    this.viewDetail.emit(row);
  }

  formatCurrency(value: number | null): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }
}

# Story CT-2: Shared CaseTableComponent — Core MatTable with 19 Columns, Sort & Paginate

## Status: DONE

## Priority: P0

## Depends On: CT-1 (data contract — but can develop against mock data)

## Description
Build the core `CaseTableComponent` as a **shared, stateless presentation component** that
renders a Material Design table with all 19 business columns, integrated `MatSort` for
column header sorting, `MatPaginator` for page navigation, and sticky first two columns for
horizontal scroll scenarios. This component is the foundation that CT-3 through CT-7 enhance.

## Architecture

### Component Contract
```typescript
// Inputs
cases        = input.required<CaseTableRow[]>();  // Page of case data
totalCount   = input.required<number>();           // Total filtered count (for paginator)
loading      = input<boolean>(false);              // Show loading overlay
pageSize     = input<number>(25);                  // Initial page size
pageIndex    = input<number>(0);                   // Current page index
visibleColumns = input<string[]>(DEFAULT_VISIBLE); // Which columns to display
density      = input<TableDensity>('default');     // Row density
role         = input<'admin' | 'operator'>('admin'); // Controls click navigation

// Outputs
sortChange   = output<{ active: string; direction: 'asc' | 'desc' | '' }>();
pageChange   = output<{ pageIndex: number; pageSize: number }>();
rowClick     = output<CaseTableRow>();             // Navigate to case detail
```

### CaseTableRow Interface
Defined in `case-table.models.ts`:
```typescript
export interface CaseTableRow {
  id: string;
  case_number: string;
  customer_name: string;
  status: string;
  state: string;
  violation_type: string;
  violation_date: string | null;
  court_date: string | null;
  next_action_date: string | null;
  driver_phone: string | null;
  customer_type: string | null;
  who_sent: string | null;
  carrier: string | null;
  attorney_name: string | null;
  attorney_price: number | null;
  price_cdl: number | null;
  subscriber_paid: boolean | null;
  court_fee: number | null;
  court_fee_paid_by: string | null;
  operator_name: string | null;
  file_count: number;
  // Computed / extra
  ageHours: number;
  assigned_operator_id: string | null;
  assigned_attorney_id: string | null;
}
```

### Column Definitions
Defined in `case-table.models.ts`:
```typescript
export interface ColumnDef {
  key: string;           // matColumnDef identifier
  header: string;        // i18n key for column header
  group: ColumnGroup;    // Which visibility group this belongs to
  sticky?: boolean;      // CSS sticky column
  sortable?: boolean;    // Show sort header
  type: 'text' | 'date' | 'currency' | 'boolean' | 'status' | 'count' | 'phone';
  width?: string;        // CSS min-width
}

export type ColumnGroup = 'core' | 'case_info' | 'assignment' | 'contact' | 'financial' | 'meta';
export type TableDensity = 'compact' | 'default' | 'comfortable';

export const ALL_COLUMNS: ColumnDef[] = [
  // Core (always visible, sticky)
  { key: 'customer_name',    header: 'TABLE.COL_CUSTOMER_NAME',    group: 'core',       sticky: true,  sortable: true, type: 'text',     width: '160px' },
  { key: 'case_number',      header: 'TABLE.COL_CASE_NUMBER',      group: 'core',       sticky: true,  sortable: true, type: 'text',     width: '140px' },
  { key: 'status',           header: 'TABLE.COL_STATUS',           group: 'core',       sortable: true, type: 'status', width: '130px' },

  // Case Info
  { key: 'state',            header: 'TABLE.COL_STATE',            group: 'case_info',  sortable: true, type: 'text',     width: '60px' },
  { key: 'violation_type',   header: 'TABLE.COL_VIOLATION_TYPE',   group: 'case_info',  sortable: true, type: 'text',     width: '130px' },
  { key: 'violation_date',   header: 'TABLE.COL_VIOLATION_DATE',   group: 'case_info',  sortable: true, type: 'date',     width: '110px' },
  { key: 'court_date',       header: 'TABLE.COL_COURT_DATE',       group: 'case_info',  sortable: true, type: 'date',     width: '110px' },

  // Assignment
  { key: 'attorney_name',    header: 'TABLE.COL_ATTORNEY_NAME',    group: 'assignment', sortable: true, type: 'text',     width: '140px' },
  { key: 'carrier',          header: 'TABLE.COL_CARRIER',          group: 'assignment', sortable: true, type: 'text',     width: '130px' },
  { key: 'who_sent',         header: 'TABLE.COL_WHO_SENT',         group: 'assignment', sortable: true, type: 'text',     width: '100px' },

  // Contact
  { key: 'driver_phone',     header: 'TABLE.COL_DRIVER_PHONE',     group: 'contact',    type: 'phone',    width: '120px' },
  { key: 'customer_type',    header: 'TABLE.COL_CUSTOMER_TYPE',     group: 'contact',    sortable: true, type: 'text',     width: '140px' },

  // Financial
  { key: 'attorney_price',   header: 'TABLE.COL_ATTORNEY_PRICE',   group: 'financial',  sortable: true, type: 'currency', width: '110px' },
  { key: 'price_cdl',        header: 'TABLE.COL_PRICE_CDL',        group: 'financial',  sortable: true, type: 'currency', width: '100px' },
  { key: 'subscriber_paid',  header: 'TABLE.COL_SUBSCRIBER_PAID',  group: 'financial',  type: 'boolean',  width: '120px' },
  { key: 'court_fee',        header: 'TABLE.COL_COURT_FEE',        group: 'financial',  sortable: true, type: 'currency', width: '100px' },
  { key: 'court_fee_paid_by',header: 'TABLE.COL_COURT_FEE_PAID_BY',group: 'financial',  type: 'text',     width: '130px' },

  // Meta
  { key: 'next_action_date', header: 'TABLE.COL_NEXT_ACTION_DATE', group: 'meta',       sortable: true, type: 'date',     width: '120px' },
  { key: 'file_count',       header: 'TABLE.COL_FILES',            group: 'meta',       type: 'count',    width: '70px' },
];

export const DEFAULT_VISIBLE_COLUMNS = ALL_COLUMNS
  .filter(c => ['core', 'case_info', 'assignment'].includes(c.group))
  .map(c => c.key);
// = ['customer_name', 'case_number', 'status', 'state', 'violation_type',
//    'violation_date', 'court_date', 'attorney_name', 'carrier', 'who_sent']
```

## Implementation

### File: `features/shared/case-table/case-table.component.ts`

```
@Component({
  selector: 'app-case-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
  ],
  template: `...`,  // see Template section below
  styles: [`...`],  // see Styles section below
})
export class CaseTableComponent implements AfterViewInit {
  // Inputs & outputs as defined above

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Internal signals
  dataSource = new MatTableDataSource<CaseTableRow>([]);

  // Computed: which columns to actually render
  displayedColumns = computed(() => {
    return this.visibleColumns().filter(key =>
      ALL_COLUMNS.some(c => c.key === key)
    );
  });

  // Column lookup for template
  columnDef = computed(() => {
    const map = new Map<string, ColumnDef>();
    ALL_COLUMNS.forEach(c => map.set(c.key, c));
    return map;
  });

  constructor() {
    // Sync input data → MatTableDataSource
    effect(() => {
      this.dataSource.data = this.cases();
    });
  }

  ngAfterViewInit(): void {
    // Don't wire MatSort/MatPaginator to dataSource — we do server-side
    // Instead, listen to their events and emit to parent
  }

  onSortChange(sort: Sort): void {
    this.sortChange.emit({ active: sort.active, direction: sort.direction });
  }

  onPageChange(event: PageEvent): void {
    this.pageChange.emit({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  onRowClicked(row: CaseTableRow): void {
    this.rowClick.emit(row);
  }

  // ── Cell formatters ──
  formatCurrency(value: number | null): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }

  formatBoolean(value: boolean | null): string {
    if (value === null || value === undefined) return '—';
    return value ? '...' : '...';  // Uses translate pipe in template
  }

  formatPhone(value: string | null): string {
    return value || '—';
  }
}
```

### Template Structure

```html
<div class="case-table-container" [class]="'density-' + density()">
  <!-- Loading overlay -->
  @if (loading()) {
    <div class="loading-overlay" role="status" aria-busy="true">
      <mat-spinner diameter="40"></mat-spinner>
    </div>
  }

  <!-- Table wrapper with horizontal scroll -->
  <div class="table-scroll-wrapper">
    <table mat-table [dataSource]="dataSource"
           matSort (matSortChange)="onSortChange($event)"
           class="case-table">

      <!-- Dynamic column definitions -->
      @for (col of displayedColumns(); track col) {
        <ng-container [matColumnDef]="col"
                      [sticky]="columnDef().get(col)?.sticky || false">
          <th mat-header-cell *matHeaderCellDef
              [mat-sort-header]="columnDef().get(col)?.sortable ? col : ''"
              [disabled]="!columnDef().get(col)?.sortable"
              [style.min-width]="columnDef().get(col)?.width">
            {{ columnDef().get(col)?.header | translate }}
          </th>
          <td mat-cell *matCellDef="let row" [style.min-width]="columnDef().get(col)?.width">
            <!-- Cell rendering based on type -->
            @switch (columnDef().get(col)?.type) {
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
                {{ formatPhone(row[col]) }}
              }
              @default {
                {{ row[col] || '—' }}
              }
            }
          </td>
        </ng-container>
      }

      <!-- Header and data rows -->
      <tr mat-header-row *matHeaderRowDef="displayedColumns(); sticky: true"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns();"
          class="case-row"
          (click)="onRowClicked(row)"
          (keydown.enter)="onRowClicked(row)"
          tabindex="0"
          [attr.aria-label]="('TABLE.CASE_ROW' | translate) + ' ' + row.case_number">
      </tr>

      <!-- No data row -->
      <tr class="mat-mdc-row" *matNoDataRow>
        <td [attr.colspan]="displayedColumns().length" class="no-data-cell">
          @if (!loading()) {
            <div class="no-data">
              <mat-icon>search_off</mat-icon>
              <p>{{ 'TABLE.NO_RESULTS' | translate }}</p>
            </div>
          }
        </td>
      </tr>
    </table>
  </div>

  <!-- Paginator -->
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
```

### Styles

```css
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
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Sticky columns background (prevent see-through on scroll) */
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
.status-closed { background-color: #f5f5f5 !important; color: #616161 !important; }

/* Boolean icons */
.bool-yes { color: #2e7d32; }
.bool-no { color: #9e9e9e; }

/* File count */
.file-count { display: flex; align-items: center; gap: 4px; }
.file-icon { font-size: 16px; width: 16px; height: 16px; color: #757575; }

/* No data */
.no-data { display: flex; flex-direction: column; align-items: center; padding: 48px; color: #757575; }
.no-data mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 8px; }

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
```

## Files Changed

### Frontend (New)
- `features/shared/case-table/case-table.models.ts` — CaseTableRow, ColumnDef, ALL_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS, ColumnGroup, TableDensity
- `features/shared/case-table/case-table.component.ts` + `.spec.ts` — core table component

### Frontend Tests
- `case-table.component.spec.ts` (min 20 tests):
  - Renders correct number of rows from input data
  - Renders only columns listed in visibleColumns input
  - Sticky columns (customer_name, case_number) have sticky attribute
  - Sort header click emits sortChange output
  - Paginator page change emits pageChange output
  - Row click emits rowClick output
  - Row keyboard Enter emits rowClick output
  - Currency columns format as $X.XX
  - Date columns format correctly
  - Boolean columns show check/cancel icons
  - Status column shows colored chip
  - File count column shows icon + number
  - No data message shown when cases is empty
  - Loading overlay shown when loading=true
  - Density class applied to container
  - Header cells show translated column names
  - Phone column shows formatted value or dash
  - Null/undefined values render as em-dash
  - displayedColumns computed filters invalid keys
  - Paginator shows correct total count

## Acceptance Criteria
- [ ] Component renders a Material table with all 19 column definitions available
- [ ] Only columns listed in `visibleColumns` input are displayed
- [ ] Sticky columns (customer_name, case_number) remain visible during horizontal scroll
- [ ] Sortable column headers show sort indicator and emit `sortChange` on click
- [ ] Non-sortable columns (phone, boolean, count) do not show sort affordance
- [ ] Paginator reflects `totalCount`, `pageSize`, `pageIndex` inputs
- [ ] Page change emits `pageChange` event (parent handles API call)
- [ ] Row click emits `rowClick` with full row data
- [ ] Rows are keyboard-navigable (Tab to focus, Enter to activate)
- [ ] Loading overlay appears when `loading()` is true
- [ ] Empty state message appears when `cases()` is empty and not loading
- [ ] Currency values formatted as $X,XXX.XX with Intl.NumberFormat
- [ ] Dates formatted as "Mar 15, 2026" with Intl.DateTimeFormat
- [ ] Boolean values show check_circle/cancel icons with screen reader text
- [ ] Density input changes row height and font size
- [ ] Component builds and passes AOT compilation
- [ ] All 20+ unit tests pass

# Story CT-5: Admin & Operator New Routes + Sidebar Integration with Role-Based Column Defaults

## Status: DONE

## Priority: P1

## Depends On: CT-1 (backend APIs), CT-2 (CaseTableComponent)

## Description
Create **new, additive** pages for both admin and operator that host the shared
`CaseTableComponent`. The admin gets a new "Case Table" page at `/admin/case-table`. The
operator gets a new "All Cases" page at `/operator/all-cases`. Both are accessible via new
sidebar navigation links.

**Important:** This does NOT replace or modify any existing views. The admin dashboard,
admin case-management (card-based), operator dashboard (My Cases / Queue), and operator
Kanban board all remain fully intact. The new table pages are additional views that offer a
dense, spreadsheet-like alternative for power users who need to scan many cases at once.

Each role has its own default column set, navigation targets, and available filters — all
driven by configuration, not component forking.

## Architecture

### Additive-Only Strategy
No existing components are modified. Each role gets a **new wrapper component** (new file,
new route) that:
1. Owns the data signals (cases, totalCount, loading)
2. Calls the appropriate API service (adminService vs caseService)
3. Builds query params from search/filter/sort/page signals
4. Passes data down to `<app-case-table>` via inputs
5. Handles outputs (sortChange, pageChange, rowClick → navigate to detail)

Existing views remain untouched:
- `/admin/cases` → CaseManagementComponent (card-based, no changes)
- `/admin/dashboard` → AdminDashboardComponent (KPIs, charts, no changes)
- `/admin/operator-kanban` → AdminOperatorKanbanComponent (no changes)
- `/operator/dashboard` → OperatorDashboardComponent (My Cases, Queue, no changes)

### Navigation Flow
| Event | Admin | Operator |
|-------|-------|----------|
| Row click | Navigate to `/admin/cases/:id` | Navigate to `/operator/cases/:id` |
| "View Full Detail" in expand | Same as row click | Same as row click |
| Back from detail | Browser back or breadcrumb | Browser back or breadcrumb |

## Implementation

### 1. New Admin Case Table Component

**File:** `features/admin/case-table/admin-case-table.component.ts` (NEW file)

A brand-new component at a new route. The existing `case-management.component.ts` is NOT
modified.

```typescript
@Component({
  selector: 'app-admin-case-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatButtonToggleModule, MatTooltipModule,
    TranslateModule,
    CaseTableComponent,
    ColumnToggleComponent,
  ],
  template: `
    <div class="case-table-page">
      <div class="page-header">
        <h1>{{ 'ADMIN.CASE_TABLE_TITLE' | translate }}</h1>
        <span class="case-count">
          {{ totalCount() }} {{ 'TABLE.TOTAL_CASES' | translate }}
        </span>
      </div>

      <!-- Toolbar: search, filters, column toggle, density -->
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
      </div>

      <!-- Active filter chips -->
      @if (activeFilters().length > 0) {
        <div class="active-filters">
          @for (f of activeFilters(); track f.type + f.value) {
            <mat-chip-row (removed)="removeFilter(f)">
              {{ f.label | titlecase }}
              <button matChipRemove><mat-icon>cancel</mat-icon></button>
            </mat-chip-row>
          }
          <button mat-button (click)="clearAllFilters()" class="clear-all">
            {{ 'TABLE.CLEAR_ALL_FILTERS' | translate }}
          </button>
        </div>
      }

      <!-- Case Table -->
      <app-case-table
        [cases]="cases()"
        [totalCount]="totalCount()"
        [loading]="loading()"
        [pageSize]="pageSize()"
        [pageIndex]="pageIndex()"
        [visibleColumns]="visibleColumns()"
        [density]="density()"
        [role]="'admin'"
        (sortChange)="onSortChange($event)"
        (pageChange)="onPageChange($event)"
        (rowClick)="onRowClick($event)"
        (viewDetail)="onViewDetail($event)">
      </app-case-table>
    </div>
  `,
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

    @media (max-width: 768px) {
      .case-table-page { padding: 12px; }
      .toolbar { flex-direction: column; align-items: stretch; }
      .search-field, .filter-field { flex: 1 1 100%; }
    }
  `],
})
export class AdminCaseTableComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  // Data signals
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

  // Column visibility & density (persisted)
  visibleColumns = signal<string[]>([...DEFAULT_VISIBLE_COLUMNS]);
  density = signal<TableDensity>('default');

  // Reference data
  allColumns = ALL_COLUMNS;
  statusOptions = ['new', 'reviewed', 'assigned_to_attorney', ...]; // all CaseStatus values
  usStates = ['AL', 'AK', 'AZ', ...]; // all 50 US state codes

  ngOnInit(): void {
    this.loadPreferences();
    this.loadCases();
  }

  loadCases(): void {
    this.loading.set(true);
    const params = this.buildParams();
    this.adminService.getAllCases(params).subscribe({
      next: ({ cases, total }) => {
        this.cases.set(cases);
        this.totalCount.set(total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        // snackbar error
      },
    });
  }

  onSortChange(sort: { active: string; direction: string }): void {
    this.sortActive.set(sort.active);
    this.sortDirection.set(sort.direction as 'asc' | 'desc');
    this.loadCases();
  }

  onPageChange(page: { pageIndex: number; pageSize: number }): void {
    this.pageIndex.set(page.pageIndex);
    this.pageSize.set(page.pageSize);
    this.loadCases();
  }

  onRowClick(row: CaseTableRow): void {
    this.router.navigate(['/admin/cases', row.id]);
  }

  onViewDetail(row: CaseTableRow): void {
    this.router.navigate(['/admin/cases', row.id]);
  }

  // ... filter handlers, search debounce, preference load/save ...
}
```

### 2. New Operator All-Cases Component

**File:** `features/operator/all-cases/operator-all-cases.component.ts`

Structurally identical to the admin wrapper but:
- Calls `caseService.getOperatorAllCases(params)` instead of `adminService.getAllCases(params)`
- Default visible columns: Core + Case Info + Assignment (same as admin default)
- Navigates to `/operator/cases/:id` on row click
- No operator_id filter (implicit — backend scopes to operator's visibility)
- Status filter excludes terminal states by default

```typescript
@Component({
  selector: 'app-operator-all-cases',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Same imports as admin wrapper
  template: `...`,  // Same structure, different page title i18n key
})
export class OperatorAllCasesComponent implements OnInit {
  private caseService = inject(CaseService);
  private router = inject(Router);

  // Same signal structure as admin

  onRowClick(row: CaseTableRow): void {
    this.router.navigate(['/operator/cases', row.id]);
  }

  loadCases(): void {
    this.loading.set(true);
    this.caseService.getOperatorAllCases(this.buildParams()).subscribe({ ... });
  }
}
```

### 3. Add Routes to Both Routing Modules

**File:** `features/admin/admin-routing.module.ts` — add new route (existing routes untouched):
```typescript
{
  path: 'case-table',
  loadComponent: () => import('./case-table/admin-case-table.component')
    .then(m => m.AdminCaseTableComponent),
},
```

**File:** `features/operator/operator-routing.module.ts` — add new route (existing routes untouched):
```typescript
{
  path: 'all-cases',
  loadComponent: () => import('./all-cases/operator-all-cases.component')
    .then(m => m.OperatorAllCasesComponent),
},
```

### 4. Update Frontend Services

**AdminService** — add NEW method (do not modify existing `getAllCases`):
```typescript
getAllCasesTable(params?: Record<string, string | number>): Observable<{ cases: CaseTableRow[]; total: number }> {
  return this.http.get<{ cases: CaseTableRow[]; total: number }>(
    `${this.apiUrl}/admin/cases`,
    { params: params as any },
  );
}
```

**CaseService** — add new method:
```typescript
getOperatorAllCases(params?: Record<string, string | number>): Observable<{ cases: CaseTableRow[]; total: number }> {
  return this.http.get<{ cases: CaseTableRow[]; total: number }>(
    `${this.apiUrl}/operator/all-cases`,
    { params: params as any },
  );
}
```

### 5. Navigation Entry Points

**All existing sidebar links remain unchanged.** New links are added alongside them.

**Admin sidebar/nav:** Add a new "Case Table" link below the existing "Cases" link:
```typescript
// In the admin nav items array, add:
{ label: 'NAV.CASE_TABLE', icon: 'table_view', route: '/admin/case-table' }
```
The existing "Cases" link at `/admin/cases` continues to show the card-based
CaseManagementComponent as before.

**Operator sidebar/nav:** Add a new "All Cases" link:
```typescript
// In the operator nav items array, add:
{ label: 'NAV.ALL_CASES', icon: 'table_view', route: '/operator/all-cases' }
```
The existing "Dashboard" link continues to show the card-based My Cases / Queue view.

### 6. Role-Based Default Column Overrides

Column defaults differ by role:

| Column Group | Admin Default | Operator Default |
|-------------|---------------|------------------|
| Core | Visible (locked) | Visible (locked) |
| Case Info | Visible | Visible |
| Assignment | Visible | Visible |
| Contact | Hidden | Hidden |
| Financial | Hidden | Hidden |
| Meta | Hidden | Hidden |

Currently identical defaults. The localStorage key is role-scoped:
- Admin: `admin_case_table_columns` / `admin_case_table_density`
- Operator: `operator_case_table_columns` / `operator_case_table_density`

This allows each role to have independent saved preferences.

## Files Changed

### Frontend (New)
- `features/admin/case-table/admin-case-table.component.ts` + `.spec.ts` — new admin table page
- `features/operator/all-cases/operator-all-cases.component.ts` + `.spec.ts` — new operator table page

### Frontend (Modified — additive only, no existing behavior changed)
- `features/admin/admin-routing.module.ts` — add `case-table` route (existing routes untouched)
- `features/operator/operator-routing.module.ts` — add `all-cases` route (existing routes untouched)
- `core/services/admin.service.ts` — add `getAllCasesTable` method (existing methods untouched)
- `core/services/case.service.ts` — add `getOperatorAllCases` method (existing methods untouched)
- `core/layout/layout.component.ts` — add new sidebar nav items for both roles (existing links untouched)

### Frontend (NOT Modified — preserved as-is)
- `features/admin/case-management/case-management.component.ts` — NO CHANGES
- `features/admin/dashboard/admin-dashboard.component.ts` — NO CHANGES
- `features/admin/operator-kanban/admin-operator-kanban.component.ts` — NO CHANGES
- `features/operator/operator-dashboard/operator-dashboard.component.ts` — NO CHANGES

### Frontend Tests
- `admin-case-table.component.spec.ts` (min 15 tests):
  - Loads cases on init via adminService.getAllCasesTable
  - Passes cases data to CaseTableComponent
  - Sort change triggers reload with new sort params
  - Page change triggers reload with new offset
  - Row click navigates to /admin/cases/:id
  - Search input triggers debounced reload
  - Filter change triggers reload
  - Loads column preferences from localStorage
  - Saves column preferences to localStorage on change
  - Density change saves to localStorage
  - Loading state passed to table component
  - Error handling shows snackbar
  - Column toggle updates visibleColumns signal
  - Density toggle updates density signal
  - Page title shows translated ADMIN.CASE_TABLE_TITLE

- `operator-all-cases.component.spec.ts` (min 12 tests):
  - Loads cases on init via caseService.getOperatorAllCases
  - Passes cases data to CaseTableComponent
  - Sort change triggers reload with new sort params
  - Page change triggers reload with new offset
  - Row click navigates to /operator/cases/:id
  - Search input triggers debounced reload
  - Filter change triggers reload
  - Loads column preferences from localStorage
  - Saves column preferences to localStorage on change
  - Density change saves to localStorage
  - Loading state passed to table component
  - Error handling shows snackbar

## Acceptance Criteria
- [ ] New admin route `/admin/case-table` exists and loads AdminCaseTableComponent
- [ ] New operator route `/operator/all-cases` exists and loads OperatorAllCasesComponent
- [ ] Admin sidebar shows new "Case Table" link with table_view icon
- [ ] Operator sidebar shows new "All Cases" link with table_view icon
- [ ] **Existing views untouched:** `/admin/cases` still shows card-based CaseManagementComponent
- [ ] **Existing views untouched:** `/admin/dashboard` still shows AdminDashboardComponent
- [ ] **Existing views untouched:** `/admin/operator-kanban` still shows Kanban
- [ ] **Existing views untouched:** `/operator/dashboard` still shows My Cases / Queue
- [ ] Admin table calls `GET /api/admin/cases` with all params
- [ ] Operator table calls `GET /api/operator/all-cases` with all params
- [ ] Admin row click navigates to `/admin/cases/:id` (existing detail page)
- [ ] Operator row click navigates to `/operator/cases/:id` (existing detail page)
- [ ] Column preferences stored separately per role (different localStorage keys)
- [ ] Search, filter, sort, paginate all work end-to-end for both roles
- [ ] AdminService has new `getAllCasesTable` method (existing methods untouched)
- [ ] CaseService has new `getOperatorAllCases` method (existing methods untouched)
- [ ] All tests pass (27+ new tests, zero regressions on existing tests)

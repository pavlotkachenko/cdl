# Story CT-4: Global Search, Filter Chips & Expandable Row Detail Panel

## Status: DONE

## Priority: P1

## Depends On: CT-2 (CaseTableComponent)

## Description
Add a **search bar** for full-text search across multiple fields, **filter dropdowns** for
Status, State, and Carrier with visible filter chips, and an **expandable row detail** panel
that reveals all 19 fields (including hidden columns) in a structured key-value layout when a
row is clicked. The search and filters trigger server-side queries via output events; the
expandable row is purely client-side using the data already loaded.

## UX Design

### Toolbar Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ [🔍 Search cases..._______________]  [Status ▼] [State ▼] [Carrier ▼] │
│                                                                    │
│ Active filters: [● Reviewed ×] [TX ×] [Swift Transport ×]  Clear all │
└────────────────────────────────────────────────────────────────────┘
```

- **Search bar:** 300px wide text input with search icon and clear button. Debounced at 300ms.
  Searches across: case_number, customer_name, carrier, attorney_name (server-side).
- **Filter dropdowns:** MatSelect with multiple selection for Status and State; text-input
  autocomplete for Carrier (since carrier values are freeform, not enum).
- **Filter chips:** Below the toolbar, active filters shown as removable chips. "Clear all"
  link removes all filters and resets search.

### Expandable Row Detail
Clicking a row arrow icon (▶) expands an inline detail panel below the row. Clicking again
collapses it. Only one row can be expanded at a time.

```
┌──────────┬──────────┬──────────┬───────┬─────────────────────────────┐
│ Santos   │ CDL-042  │ Reviewed │ TX    │ ...                         │
├──────────┴──────────┴──────────┴───────┴─────────────────────────────┤
│  ▼ Case Details                                                      │
│  ┌─────────────────────────┬─────────────────────────┐               │
│  │ Customer Name           │ Miguel Santos            │               │
│  │ Case Number             │ CDL-2026-042             │               │
│  │ Status                  │ Reviewed                 │               │
│  │ State                   │ TX                       │               │
│  │ Violation Type          │ Speeding                 │               │
│  │ Violation Date          │ Jan 15, 2026             │               │
│  │ Court Date              │ Apr 1, 2026              │               │
│  │ Next Action Date        │ Mar 20, 2026             │               │
│  │ Driver Phone            │ 555-1234                 │               │
│  │ Customer Type           │ Subscriber (Driver)      │               │
│  │ Who Sent                │ Driver                   │               │
│  │ Carrier                 │ Swift Transport          │               │
│  │ Attorney                │ James H.                 │               │
│  │ Attorney Price          │ $350.00                  │               │
│  │ Price CDL               │ $150.00                  │               │
│  │ Subscriber Paid         │ Yes                      │               │
│  │ Court Fee               │ $75.00                   │               │
│  │ Court Fee Paid By       │ Driver                   │               │
│  │ Files                   │ 3 files                  │               │
│  └─────────────────────────┴─────────────────────────┘               │
│  [View Full Detail →]                                                │
├──────────┬──────────┬──────────┬───────┬─────────────────────────────┤
│ Kim J.   │ CDL-043  │ New      │ CA    │ ...                         │
```

The "View Full Detail →" button navigates to the full case detail page (admin or operator).

## Implementation

### 1. Search & Filters in Parent Component

The search bar, filter dropdowns, and filter chips live in the **parent component** (admin
case-table or operator all-cases — both are new pages), not in CaseTableComponent. This keeps
the table stateless and the parent as the data orchestrator.

**Signals in parent:**
```typescript
searchTerm = signal('');
statusFilter = signal<string[]>([]);
stateFilter = signal<string[]>([]);
carrierFilter = signal('');

// Derived: active filters for chip display
activeFilters = computed(() => {
  const filters: { type: string; label: string; value: string }[] = [];
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

// Debounced search (use rxjs Subject + debounceTime)
private searchSubject = new Subject<string>();
constructor() {
  this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
  ).subscribe(term => {
    this.searchTerm.set(term);
    this.loadCases();
  });
}

onSearchInput(event: Event): void {
  this.searchSubject.next((event.target as HTMLInputElement).value);
}
```

**Building API params:**
```typescript
private buildParams(): Record<string, string | number> {
  const params: Record<string, string | number> = {
    limit: this.pageSize(),
    offset: this.pageIndex() * this.pageSize(),
    sort_by: this.sortActive(),
    sort_dir: this.sortDirection(),
  };
  if (this.searchTerm()) params['search'] = this.searchTerm();
  if (this.statusFilter().length === 1) params['status'] = this.statusFilter()[0];
  if (this.stateFilter().length === 1) params['state'] = this.stateFilter()[0];
  if (this.carrierFilter()) params['carrier'] = this.carrierFilter();
  return params;
}
```

**Note on multi-value filters:** The backend currently supports single-value `status` and
`state` filters. For multi-select, either:
- (a) Send comma-separated values and parse on backend: `?status=new,reviewed`
- (b) Send multiple requests and merge client-side (not recommended)
- (c) Limit the UI to single-select for now

**Recommended approach:** Extend backend to accept comma-separated values:
```javascript
// In admin.controller.js getAllCases
if (status) {
  const statuses = status.split(',').filter(Boolean);
  if (statuses.length === 1) query = query.eq('status', statuses[0]);
  else if (statuses.length > 1) query = query.in('status', statuses);
}
```

Same for `state`.

### 2. Filter Chips Template (in parent)
```html
@if (activeFilters().length > 0) {
  <div class="active-filters" role="region" [attr.aria-label]="'TABLE.ACTIVE_FILTERS' | translate">
    @for (filter of activeFilters(); track filter.type + filter.value) {
      <mat-chip-row (removed)="removeFilter(filter)">
        {{ filter.label | titlecase }}
        <button matChipRemove [attr.aria-label]="'TABLE.REMOVE_FILTER' | translate">
          <mat-icon>cancel</mat-icon>
        </button>
      </mat-chip-row>
    }
    <button mat-button class="clear-all" (click)="clearAllFilters()">
      {{ 'TABLE.CLEAR_ALL_FILTERS' | translate }}
    </button>
  </div>
}
```

### 3. Status & State Dropdown Data

**Status options:** Derived from `CaseStatus` type — all 10 values.
**State options:** Fetched once from a distinct query or hardcoded US state list (50 states).
**Carrier autocomplete:** Debounced text input that filters cases client-side or queries
backend for distinct carrier values.

### 4. Expandable Row Detail

Add to `CaseTableComponent`:

**New input/output:**
```typescript
expandedRowId = signal<string | null>(null);
viewDetail = output<CaseTableRow>();  // Navigate to full detail page
```

**Toggle logic:**
```typescript
toggleExpand(row: CaseTableRow, event: Event): void {
  event.stopPropagation();  // Don't trigger rowClick
  this.expandedRowId.update(id => id === row.id ? null : row.id);
}
```

**Template addition — expand column + detail row:**
```html
<!-- Expand toggle column (prepended) -->
<ng-container matColumnDef="expand" sticky>
  <th mat-header-cell *matHeaderCellDef style="width: 40px"></th>
  <td mat-cell *matCellDef="let row" style="width: 40px">
    <button mat-icon-button (click)="toggleExpand(row, $event)"
            [attr.aria-label]="(expandedRowId() === row.id ? 'TABLE.COLLAPSE' : 'TABLE.EXPAND') | translate"
            [attr.aria-expanded]="expandedRowId() === row.id">
      <mat-icon>{{ expandedRowId() === row.id ? 'expand_less' : 'expand_more' }}</mat-icon>
    </button>
  </td>
</ng-container>

<!-- Expanded detail row -->
<ng-container matColumnDef="expandedDetail">
  <td mat-cell *matCellDef="let row" [attr.colspan]="displayedColumns().length + 1">
    @if (expandedRowId() === row.id) {
      <div class="expanded-detail" [@detailExpand]>
        <div class="detail-grid">
          @for (col of allColumns; track col.key) {
            <div class="detail-item">
              <span class="detail-label">{{ col.header | translate }}</span>
              <span class="detail-value">
                @switch (col.type) {
                  @case ('currency') { {{ formatCurrency(row[col.key]) }} }
                  @case ('date') { {{ formatDate(row[col.key]) }} }
                  @case ('boolean') { {{ row[col.key] ? ('TABLE.YES' | translate) : ('TABLE.NO' | translate) }} }
                  @default { {{ row[col.key] || '—' }} }
                }
              </span>
            </div>
          }
        </div>
        <button mat-button color="primary" (click)="viewDetail.emit(row)">
          {{ 'TABLE.VIEW_FULL_DETAIL' | translate }}
          <mat-icon>arrow_forward</mat-icon>
        </button>
      </div>
    }
  </td>
</ng-container>

<!-- Multi-row definition -->
<tr mat-row *matRowDef="let row; columns: ['expandedDetail']"
    class="detail-row"
    [class.expanded]="expandedRowId() === row.id">
</tr>
```

**Detail panel styles:**
```css
.expanded-detail { padding: 16px 24px; background: #fafafa; }
.detail-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 8px 24px; margin-bottom: 12px;
}
.detail-item { display: flex; flex-direction: column; gap: 2px; }
.detail-label { font-size: 0.75rem; color: #757575; font-weight: 500; }
.detail-value { font-size: 0.875rem; color: #212121; }
.detail-row { height: 0; }
.detail-row.expanded { height: auto; }
```

### 5. Backend Extension for Multi-Value Filters

Modify `admin.controller.js` and `operator.controller.js` to accept comma-separated
status and state values:

```javascript
if (status) {
  const statuses = status.split(',').filter(Boolean);
  if (statuses.length === 1) query = query.eq('status', statuses[0]);
  else query = query.in('status', statuses);
}
if (state) {
  const states = state.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
  if (states.length === 1) query = query.eq('state', states[0]);
  else query = query.in('state', states);
}
```

## Files Changed

### Frontend (New)
- `features/shared/case-table/expanded-row-detail.component.ts` + `.spec.ts` (if extracted
  as separate component) — OR inline in case-table.component.ts

### Frontend (Modified)
- `features/shared/case-table/case-table.component.ts` — add expand column, detail row,
  expandedRowId signal, toggleExpand method, viewDetail output
- `features/shared/case-table/case-table.component.spec.ts` — new tests for expand behavior

### Backend (Modified)
- `controllers/admin.controller.js` — multi-value status/state parsing
- `controllers/operator.controller.js` — same multi-value parsing in getAllCasesTable

### Backend Tests
- `__tests__/admin.controller.test.js` — tests for `?status=new,reviewed` returning both
- `__tests__/operator.controller.test.js` — same

### Frontend Tests
- Case table expand tests (8 additional):
  - Expand icon column rendered
  - Click expand shows detail panel
  - Click again collapses panel
  - Only one row expanded at a time
  - Detail panel shows all 19 fields
  - "View Full Detail" button emits viewDetail
  - Expand button has aria-expanded attribute
  - Keyboard accessible (Enter toggles expand)

- Parent search/filter tests (10 tests, in admin-case-table spec):
  - Search input debounces at 300ms
  - Search term passed to API call
  - Status filter dropdown renders all status options
  - Selecting status filter triggers reload
  - State filter dropdown renders state options
  - Filter chips displayed for active filters
  - Removing a filter chip updates the filter signal
  - "Clear all" removes all filters and search
  - Carrier filter triggers search with carrier param
  - Empty search clears the search param

## Acceptance Criteria
- [ ] Search bar is visible above the table with placeholder text
- [ ] Typing in search triggers debounced (300ms) server-side search
- [ ] Search matches against case_number, customer_name, carrier, email
- [ ] Clear button in search bar resets search
- [ ] Status filter dropdown shows all case statuses with multi-select
- [ ] State filter dropdown shows US state codes with multi-select
- [ ] Carrier filter is a text input (freeform partial match)
- [ ] Active filters shown as removable chips below toolbar
- [ ] "Clear all" removes all active filters and search term
- [ ] Removing a chip removes only that filter
- [ ] Backend accepts comma-separated status and state values
- [ ] Expand icon (▶) visible on each row
- [ ] Clicking expand shows inline detail with all 19 fields in grid layout
- [ ] Only one row can be expanded at a time
- [ ] Detail panel includes "View Full Detail →" navigation button
- [ ] Expand/collapse is keyboard accessible (Enter on expand button)
- [ ] `aria-expanded` attribute updates on expand/collapse
- [ ] All filter/search changes reset pagination to page 0
- [ ] All tests pass (18+ new tests across frontend and backend)

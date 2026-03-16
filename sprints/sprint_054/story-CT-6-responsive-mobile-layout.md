# Story CT-6: Responsive Design — Mobile Card Layout, Scroll Indicators & Breakpoint Handling

## Status: DONE

## Priority: P2

## Depends On: CT-2 (CaseTableComponent), CT-5 (route integration)

## Description
Make the case table fully usable across all viewport sizes. On desktop (≥1024px), the table
renders normally with horizontal scroll when columns overflow. On tablets (768–1023px), fewer
default columns are shown and the toolbar stacks vertically. On mobile (<768px), the table is
replaced entirely with a **card-based layout** where each case is a compact card showing key
fields, tappable to expand or navigate. Horizontal scroll indicators (gradient fade + hint
text) guide desktop users when columns overflow the viewport.

## Breakpoint Strategy

| Breakpoint | Layout | Default Columns | Behavior |
|------------|--------|-----------------|----------|
| ≥1440px | Full table | Core + Case Info + Assignment (10 cols) | All fit without scroll |
| 1024–1439px | Table with scroll | Core + Case Info (7 cols) | Assignment group hidden by default, scroll hint shown |
| 768–1023px | Compact table | Core only (3 cols) | Stacked toolbar, reduced paginator |
| <768px | Card layout | N/A (all key fields on card) | Cards replace table entirely |

## Implementation

### 1. Breakpoint Detection Service

Use Angular CDK `BreakpointObserver` (already available via `@angular/cdk/layout`):

```typescript
// In parent components (case-management, operator-all-cases)
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

private breakpointObserver = inject(BreakpointObserver);

isMobile = signal(false);
isTablet = signal(false);

constructor() {
  this.breakpointObserver.observe([
    '(max-width: 767px)',    // mobile
    '(min-width: 768px) and (max-width: 1023px)',  // tablet
  ]).subscribe(result => {
    this.isMobile.set(result.breakpoints['(max-width: 767px)'] || false);
    this.isTablet.set(result.breakpoints['(min-width: 768px) and (max-width: 1023px)'] || false);
  });
}

// Adjust default columns based on breakpoint (only if user hasn't customized)
responsiveColumns = computed(() => {
  if (this.userHasCustomColumns()) return this.visibleColumns();
  if (this.isMobile()) return []; // cards, not table
  if (this.isTablet()) return CORE_COLUMNS;
  return this.visibleColumns();
});
```

### 2. Mobile Card Layout

When `isMobile()` is true, the parent template renders a card list instead of
`<app-case-table>`:

```html
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

    <!-- Empty state -->
    @if (cases().length === 0 && !loading()) {
      <div class="empty-cards" role="status">
        <mat-icon>search_off</mat-icon>
        <p>{{ 'TABLE.NO_RESULTS' | translate }}</p>
      </div>
    }

    <!-- Loading -->
    @if (loading()) {
      <div class="loading-cards" role="status" aria-busy="true">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    }

    <!-- Simplified paginator for mobile -->
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
  <!-- Desktop/tablet table view -->
  <app-case-table ...></app-case-table>
}
```

### 3. Mobile Card Styles

```css
.case-cards { display: flex; flex-direction: column; gap: 8px; }

.case-card {
  display: flex; flex-direction: column; position: relative;
  padding: 12px 40px 12px 12px;
  border: 1px solid #e0e0e0; border-radius: 8px;
  background: white; cursor: pointer;
  min-height: 44px; /* touch target */
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
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  color: #bdbdbd;
}

.mobile-paginator {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  padding: 12px;
}
.page-info { font-size: 0.85rem; color: #616161; }
```

### 4. Horizontal Scroll Indicators (Desktop)

When the table content overflows horizontally, show a subtle gradient fade on the right edge
and a floating "scroll →" hint that disappears after the first scroll.

**Implementation in CaseTableComponent:**

```typescript
// In case-table.component.ts
@ViewChild('scrollWrapper') scrollWrapper!: ElementRef<HTMLDivElement>;

hasOverflow = signal(false);
hasScrolled = signal(false);

ngAfterViewInit(): void {
  this.checkOverflow();
}

private checkOverflow(): void {
  const el = this.scrollWrapper?.nativeElement;
  if (el) {
    this.hasOverflow.set(el.scrollWidth > el.clientWidth);
  }
}

onScroll(): void {
  if (!this.hasScrolled()) this.hasScrolled.set(true);
}
```

**Template addition:**
```html
<div class="table-scroll-wrapper" #scrollWrapper (scroll)="onScroll()">
  <!-- ... table ... -->
</div>

@if (hasOverflow() && !hasScrolled()) {
  <div class="scroll-hint" aria-hidden="true">
    <mat-icon>arrow_forward</mat-icon>
    <span>{{ 'TABLE.SCROLL_HINT' | translate }}</span>
  </div>
}
```

**Styles:**
```css
.table-scroll-wrapper {
  position: relative;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Right fade gradient when overflow exists */
:host[data-overflow="true"] .table-scroll-wrapper::after {
  content: '';
  position: absolute; right: 0; top: 0; bottom: 0;
  width: 40px;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.9));
  pointer-events: none;
}

.scroll-hint {
  position: absolute; right: 16px; top: 50%;
  transform: translateY(-50%);
  display: flex; align-items: center; gap: 4px;
  background: rgba(25, 118, 210, 0.9); color: white;
  padding: 6px 12px; border-radius: 16px;
  font-size: 0.75rem; pointer-events: none;
  animation: fadeInOut 3s ease-in-out forwards;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
```

### 5. Toolbar Responsive Behavior

At tablet/mobile breakpoints, the toolbar stacks:

```css
@media (max-width: 1023px) {
  .toolbar { flex-direction: column; align-items: stretch; }
  .search-field { flex: 1 1 100%; }
  .filter-field { flex: 1 1 calc(50% - 4px); }
  .toolbar-spacer { display: none; }
}

@media (max-width: 767px) {
  .filter-field { flex: 1 1 100%; }
}
```

### 6. Column Toggle Responsive

On mobile, the column toggle button is hidden (cards don't use column visibility).
The density selector is also hidden on mobile.

```html
@if (!isMobile()) {
  <app-column-toggle ...></app-column-toggle>
  <mat-button-toggle-group ...></mat-button-toggle-group>
}
```

## Files Changed

### Frontend (Modified)
- `features/shared/case-table/case-table.component.ts` — add scroll detection, overflow
  signal, scroll hint template/styles
- `features/admin/case-table/admin-case-table.component.ts` — add breakpoint detection,
  mobile card template, responsive column defaults
- `features/operator/all-cases/operator-all-cases.component.ts` — same responsive additions

### Frontend (NOT Modified)
- `features/admin/case-management/case-management.component.ts` — NO CHANGES (existing view)
- `features/operator/operator-dashboard/operator-dashboard.component.ts` — NO CHANGES

### Frontend Tests (15+ tests across files)
- `case-table.component.spec.ts` — 5 new:
  - hasOverflow signal set when content exceeds viewport
  - Scroll hint visible when hasOverflow and not scrolled
  - Scroll hint hidden after first scroll event
  - Scroll hint hidden when no overflow
  - checkOverflow called on init

- `admin-case-table.component.spec.ts` — 5 new:
  - Mobile breakpoint renders card layout instead of table
  - Cards show case_number, customer_name, status, state
  - Card click navigates to case detail
  - Mobile paginator shows page info and prev/next buttons
  - Column toggle hidden on mobile

- `operator-all-cases.component.spec.ts` — 5 new:
  - Same mobile tests as admin wrapper

## Acceptance Criteria
- [ ] Desktop (≥1024px): table renders normally with horizontal scroll when needed
- [ ] Horizontal scroll gradient fade visible when columns overflow
- [ ] "Scroll →" hint appears on first load, disappears after user scrolls
- [ ] Tablet (768–1023px): toolbar stacks vertically, fewer default columns shown
- [ ] Mobile (<768px): card layout replaces table entirely
- [ ] Each card shows: case_number, status chip, customer_name, state, violation_type
- [ ] Cards show court_date and attorney_name if available
- [ ] Card tap navigates to case detail page
- [ ] Cards are keyboard navigable (Tab + Enter)
- [ ] Mobile paginator shows simplified prev/next with page info
- [ ] Column toggle and density selector hidden on mobile
- [ ] Search and filters still functional on mobile (stacked layout)
- [ ] Touch targets ≥ 44x44px on all interactive elements (cards, buttons)
- [ ] No horizontal scroll on mobile (cards are full-width)
- [ ] Empty state and loading state work on both layouts
- [ ] All 15+ tests pass

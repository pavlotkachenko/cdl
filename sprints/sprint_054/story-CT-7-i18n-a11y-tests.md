# Story CT-7: i18n, Accessibility & Comprehensive Test Coverage

## Status: DONE

## Priority: P2

## Depends On: CT-1 through CT-6 (all feature stories)

## Description
Add translation keys for all new sprint 054 UI elements across en/es/fr, audit accessibility
across all new and modified components, fix any violations, and ensure every source file has
comprehensive test coverage per the Sprint Testing Mandate.

## i18n Changes

### New Translation Keys (~55 keys)

**Table Column Headers (TABLE.COL_*):**
- `COL_CUSTOMER_NAME`, `COL_CASE_NUMBER`, `COL_STATUS`, `COL_STATE`,
  `COL_VIOLATION_TYPE`, `COL_VIOLATION_DATE`, `COL_COURT_DATE`,
  `COL_NEXT_ACTION_DATE`, `COL_DRIVER_PHONE`, `COL_CUSTOMER_TYPE`,
  `COL_WHO_SENT`, `COL_CARRIER`, `COL_ATTORNEY_NAME`,
  `COL_ATTORNEY_PRICE`, `COL_PRICE_CDL`, `COL_SUBSCRIBER_PAID`,
  `COL_COURT_FEE`, `COL_COURT_FEE_PAID_BY`, `COL_FILES`
  (19 keys)

**Column Group Labels (TABLE.GROUP_*):**
- `GROUP_CORE`, `GROUP_CASE_INFO`, `GROUP_ASSIGNMENT`, `GROUP_CONTACT`,
  `GROUP_FINANCIAL`, `GROUP_META`
  (6 keys)

**Table Controls (TABLE.*):**
- `TOGGLE_COLUMNS`, `RESET_COLUMNS`, `DENSITY`, `DENSITY_COMPACT`,
  `DENSITY_DEFAULT`, `DENSITY_COMFORTABLE`
  (6 keys)

**Search & Filters (TABLE.*):**
- `SEARCH_PLACEHOLDER`, `CLEAR_SEARCH`, `FILTER_STATUS`, `FILTER_STATE`,
  `FILTER_CARRIER`, `ACTIVE_FILTERS`, `REMOVE_FILTER`, `CLEAR_ALL_FILTERS`
  (8 keys)

**Table Content (TABLE.*):**
- `NO_RESULTS`, `TOTAL_CASES`, `CASE_ROW`, `PAGINATOR`,
  `YES`, `NO`, `EXPAND`, `COLLAPSE`, `VIEW_FULL_DETAIL`,
  `SCROLL_HINT`, `PREV_PAGE`, `NEXT_PAGE`, `OF`
  (13 keys)

**Page Titles & Navigation:**
- `ADMIN.CASE_TABLE_TITLE`
- `OPR.ALL_CASES_TITLE`
- `NAV.CASE_TABLE` (admin sidebar)
- `NAV.ALL_CASES` (operator sidebar)
  (4 keys)

### Translation File Updates
Add all keys to:
- `frontend/src/assets/i18n/en.json` — English (primary)
- `frontend/src/assets/i18n/es.json` — Spanish
- `frontend/src/assets/i18n/fr.json` — French

### English Values (examples)
```json
{
  "TABLE": {
    "COL_CUSTOMER_NAME": "Customer Name",
    "COL_CASE_NUMBER": "Case Number",
    "COL_STATUS": "Status",
    "COL_STATE": "State",
    "COL_VIOLATION_TYPE": "Violation Type",
    "COL_VIOLATION_DATE": "Violation Date",
    "COL_COURT_DATE": "Court Date",
    "COL_NEXT_ACTION_DATE": "Next Action Date",
    "COL_DRIVER_PHONE": "Driver Phone",
    "COL_CUSTOMER_TYPE": "Customer Type",
    "COL_WHO_SENT": "Who Sent",
    "COL_CARRIER": "Carrier",
    "COL_ATTORNEY_NAME": "Attorney",
    "COL_ATTORNEY_PRICE": "Attorney Price",
    "COL_PRICE_CDL": "Price CDL",
    "COL_SUBSCRIBER_PAID": "Subscriber Paid",
    "COL_COURT_FEE": "Court Fee",
    "COL_COURT_FEE_PAID_BY": "Court Fee Paid By",
    "COL_FILES": "Files",
    "GROUP_CORE": "Core",
    "GROUP_CASE_INFO": "Case Info",
    "GROUP_ASSIGNMENT": "Assignment",
    "GROUP_CONTACT": "Contact",
    "GROUP_FINANCIAL": "Financial",
    "GROUP_META": "Meta",
    "TOGGLE_COLUMNS": "Toggle columns",
    "RESET_COLUMNS": "Reset to defaults",
    "DENSITY": "Table density",
    "DENSITY_COMPACT": "Compact density",
    "DENSITY_DEFAULT": "Default density",
    "DENSITY_COMFORTABLE": "Comfortable density",
    "SEARCH_PLACEHOLDER": "Search cases...",
    "CLEAR_SEARCH": "Clear search",
    "FILTER_STATUS": "Status",
    "FILTER_STATE": "State",
    "FILTER_CARRIER": "Carrier",
    "ACTIVE_FILTERS": "Active filters",
    "REMOVE_FILTER": "Remove filter",
    "CLEAR_ALL_FILTERS": "Clear all filters",
    "NO_RESULTS": "No cases match your search or filters.",
    "TOTAL_CASES": "total cases",
    "CASE_ROW": "Case",
    "PAGINATOR": "Case table pagination",
    "YES": "Yes",
    "NO": "No",
    "EXPAND": "Expand row details",
    "COLLAPSE": "Collapse row details",
    "VIEW_FULL_DETAIL": "View Full Detail",
    "SCROLL_HINT": "Scroll for more columns",
    "PREV_PAGE": "Previous page",
    "NEXT_PAGE": "Next page",
    "OF": "of"
  }
}
```

### Audit: Hardcoded Strings
After CT-1 through CT-6 are complete, scan all modified/new files for any remaining hardcoded
user-facing strings in:
- `snackBar.open()` calls — must use `translate.instant()`
- Template literals in error messages — must use `translate` pipe or `translate.instant()`
- Button labels, placeholders, tooltips — must use `translate` pipe
- `aria-label` attributes — must use `translate` pipe where text is user-visible
- Column header text — must use `translate` pipe via i18n key in ColumnDef

## Accessibility Audit

### All New/Modified Components Must Pass

| Component | Key A11y Concerns |
|-----------|-------------------|
| CaseTableComponent | Sortable headers announced (`aria-sort`), row focus management, sticky column contrast, no-data announced |
| ColumnToggleComponent | Menu keyboard navigation, checkbox labeling, group header semantics, lock icon has text alternative |
| Expanded Row Detail | `aria-expanded` on toggle, detail region labeled, focus management on expand/collapse |
| Mobile Card Layout | Cards as list items (`role="list"`/`role="listitem"`), card aria-label with case info, touch targets |
| AdminCaseTableComponent (new page) | Filter dropdowns labeled, chip removal announced, search input labeled, loading state announced |
| OperatorAllCasesComponent (new page) | Same as admin wrapper |

### Specific A11y Fixes to Verify
- [ ] Table sort headers: `mat-sort-header` automatically adds `aria-sort` — verify
- [ ] Table rows: `tabindex="0"` on `<tr>` elements, `aria-label` with case number
- [ ] Expand button: `aria-expanded="true|false"`, `aria-label` changes with state
- [ ] Column toggle menu: `role="menu"`, checkboxes have labels, keyboard navigable
- [ ] Density toggle: `aria-label` on group, individual labels on each option
- [ ] Filter chips: removal button has `aria-label`, chip set announced
- [ ] No-data state: `role="status"` so screen readers announce it
- [ ] Loading state: `aria-busy="true"` on table container, spinner has `role="status"`
- [ ] Mobile cards: `role="listitem"`, focus ring visible on `:focus-visible`
- [ ] Mobile paginator: prev/next buttons have `aria-label`, disabled state announced
- [ ] Scroll hint: `aria-hidden="true"` (decorative, not actionable)
- [ ] Boolean icons (check/cancel): `sr-only` text alternative ("Yes"/"No")
- [ ] Currency values: raw number accessible to screen readers (not just formatted string)
- [ ] All color indicators paired with text (status chip = color + text label)
- [ ] Touch targets ≥ 44x44px on all interactive elements
- [ ] Color contrast ≥ 4.5:1 on all text elements
- [ ] Keyboard navigation: all actions reachable via Tab/Enter/Space/Escape

## Test Coverage Matrix

Every file created or modified in sprint 054 must have a corresponding test:

### Backend Tests Required

| Source File | Test File | Tests |
|-------------|-----------|-------|
| `controllers/admin.controller.js` (modified) | `__tests__/admin.controller.test.js` | Extended getAllCases: state filter, carrier filter, sort_by/sort_dir, multi-value status, file_count, all 19 fields (~12 new tests) |
| `controllers/operator.controller.js` (modified) | `__tests__/operator.controller.test.js` | New getAllCasesTable: scoped visibility, filters, sorting, pagination (~10 new tests) |

### Frontend Tests Required

| Source File | Test File | Min Tests |
|-------------|-----------|-----------|
| `case-table.component.ts` (new) | `case-table.component.spec.ts` | 20 |
| `column-toggle.component.ts` (new) | `column-toggle.component.spec.ts` | 15 |
| `admin-case-table.component.ts` (new) | `admin-case-table.component.spec.ts` | 15 |
| `operator-all-cases.component.ts` (new) | `operator-all-cases.component.spec.ts` | 12 |
| `case.service.ts` (modified) | `case.service.spec.ts` | +3 (new method) |
| `admin.service.ts` (modified) | `admin.service.spec.ts` | +3 (updated params) |

### Total Test Budget
- **Backend:** ~22 new tests
- **Frontend:** ~68 new/updated tests
- **Grand total:** ~90 tests

### Test Commands
```bash
# Backend
cd backend && npm test --no-coverage

# Frontend (all unit tests)
cd frontend && npx ng test --no-watch

# Verify no regressions
cd frontend && npx ng test --no-watch 2>&1 | tail -5
```

## Acceptance Criteria
- [ ] All ~55 translation keys added to en.json, es.json, fr.json
- [ ] Language switch correctly reflects new translations on all sprint 054 screens
- [ ] Zero hardcoded user-facing strings in new/modified components
- [ ] AXE audit on CaseTable, ColumnToggle, CaseManagement, OperatorAllCases: zero critical/serious violations
- [ ] Keyboard navigation works for: table rows, sort headers, expand/collapse, column toggle, filters, mobile cards
- [ ] Focus management correct for: expand/collapse detail, column menu open/close, filter chip removal
- [ ] All interactive elements ≥ 44x44px touch targets
- [ ] Color contrast ≥ 4.5:1 on all text elements
- [ ] All color-only indicators paired with text (status chips, boolean icons)
- [ ] Screen reader announces: sort direction, expanded state, loading state, no-data state, page info
- [ ] Every new source file has a co-located test file
- [ ] Backend tests pass: `npm test` from `backend/`
- [ ] Frontend tests pass: `npx ng test --no-watch` from `frontend/`
- [ ] Zero test regressions (existing tests still pass)
- [ ] Build succeeds with no errors: `npx ng build` from `frontend/`

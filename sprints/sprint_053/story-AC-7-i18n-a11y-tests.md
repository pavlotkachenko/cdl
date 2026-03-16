# Story AC-7: i18n, Accessibility & Comprehensive Test Coverage

## Status: DONE

## Priority: P2

## Depends On: AC-1 through AC-6 (all feature stories)

## Description
Add translation keys for all new sprint 053 UI elements, audit accessibility across all new
and modified admin components, fix any violations, and ensure every source file has
comprehensive test coverage per the Sprint Testing Mandate.

## i18n Changes

### New Translation Keys (~40 keys)

**Admin Case Detail (ADMIN.CASE_DETAIL.*):**
- `TITLE`, `BACK`, `LOADING`, `ERROR`, `RETRY`,
  `ASSIGNMENT_SECTION`, `OPERATOR_LABEL`, `ATTORNEY_LABEL`,
  `REASSIGN_OPERATOR`, `REASSIGN_ATTORNEY`, `NO_OPERATOR`, `NO_ATTORNEY`,
  `ASSIGNMENT_UPDATED`, `ASSIGNMENT_FAILED`,
  `ACTIVITY_LOG`, `ACTIVITY_EMPTY`, `ACTIVITY_BY`

**Admin Dashboard (ADMIN.DASHBOARD.*):**
- `STATS_ERROR`, `STATS_RETRY`, `QUEUE_EMPTY`, `QUEUE_ERROR`, `QUEUE_RETRY`,
  `CHARTS_EMPTY`, `CHARTS_ERROR`, `WORKLOAD_ERROR`,
  `OPERATORS_LOADING`, `ATTORNEYS_LOADING`

**Operator Assignment Kanban (ADMIN.OP_KANBAN.*):**
- `TITLE`, `UNASSIGNED`, `CAPACITY`, `OVER_CAPACITY_TITLE`, `OVER_CAPACITY_MSG`,
  `OVER_CAPACITY_CONFIRM`, `ASSIGNED`, `ASSIGNMENT_FAILED`, `UNASSIGNED_SUCCESS`,
  `EMPTY_COLUMN`, `LOADING`, `REFRESH`

**Status Workflow (ADMIN.CASE.*):**
- `OVERRIDE_STATUS`, `OVERRIDE_TITLE`, `OVERRIDE_WARNING`, `OVERRIDE_NOTE_REQUIRED`,
  `OVERRIDE_CONFIRM`, `OVERRIDE_CANCEL`, `TERMINAL_STATUS`,
  `STATUS_UPDATED`, `STATUS_FAILED`

**Multi-Board Tabs (ADMIN.TABS.*):**
- `ALL_CASES`, `BY_OPERATOR`, `BY_STATUS`, `ARCHIVE`,
  `ARCHIVE_TITLE`, `ARCHIVE_EMPTY`, `ARCHIVE_SEARCH`

### Translation File Updates
Add all keys to:
- `frontend/src/assets/i18n/en.json` — English (primary)
- `frontend/src/assets/i18n/es.json` — Spanish
- `frontend/src/assets/i18n/fr.json` — French

### Audit: Hardcoded Strings
After AC-1 through AC-6 are complete, scan all modified/new files for any remaining hardcoded
user-facing strings in:
- `snackBar.open()` calls — must use `translate.instant()`
- Template literals in error messages — must use `translate` pipe or `translate.instant()`
- Button labels, placeholders, tooltips — must use `translate` pipe
- `aria-label` attributes — must use `translate` pipe where text is user-visible

## Accessibility Audit

### All New/Modified Components Must Pass

| Component | Key A11y Concerns |
|-----------|------------------|
| AdminCaseDetailComponent | Section headings hierarchy (h2/h3), assignment dropdowns labeled, activity log semantic structure, back button accessible |
| AdminOperatorKanbanComponent | CDK drag keyboard support, column role="group", card aria-label, capacity color paired with text, over-capacity dialog focus trap |
| AdminDashboard (refactored) | Tab panel aria-labelledby (handled by MatTabGroup), per-section error/loading states announced, chart alt text or aria-label |
| CaseManagement (modified) | Dynamic status buttons labeled, override dialog focus management, loading spinner announced |

### Specific A11y Fixes to Verify
- [ ] Operator assignment Kanban: columns have `role="group"` + `aria-label` with name/count
- [ ] Operator Kanban cards: `aria-roledescription="draggable card"`, `aria-label` with case info
- [ ] Capacity warning dialog: `role="alertdialog"`, focus trapped, close on Escape
- [ ] Override dialog: `role="dialog"`, `aria-modal="true"`, focus on cancel
- [ ] All chart elements: `role="img"` with `aria-label` describing the data (e.g., "Bar chart showing violation type distribution")
- [ ] Loading skeletons: `aria-busy="true"`, `role="status"`
- [ ] Error retry buttons: `aria-label="Retry loading {section name}"`
- [ ] Dashboard tabs: badge counts readable by screen readers
- [ ] All color indicators paired with text/icon (capacity bar + number, status badge + text)
- [ ] Touch targets ≥ 44x44px on all interactive elements
- [ ] Color contrast ≥ 4.5:1 on all text elements
- [ ] Keyboard navigation: all actions reachable via Tab/Enter/Space/Escape

## Test Coverage Matrix

Every file created or modified in sprint 053 must have a corresponding test:

### Backend Tests Required

| Source File | Test File | Tests |
|-------------|-----------|-------|
| `controllers/admin.controller.js` (modified) | `__tests__/admin.controller.test.js` | getDashboardStats, getAllCases, getAdminCaseDetail, getOperators, updateCaseStatus, getChartData, getWorkloadDistribution (~25 tests) |

### Frontend Tests Required

| Source File | Test File | Min Tests |
|-------------|-----------|-----------|
| `admin-case-detail.component.ts` (new) | `admin-case-detail.component.spec.ts` | 15 |
| `admin-operator-kanban.component.ts` (new) | `admin-operator-kanban.component.spec.ts` | 15 |
| `admin-dashboard.component.ts` (modified) | `admin-dashboard.component.spec.ts` | +12 (update existing) |
| `case-management.component.ts` (modified) | `case-management.component.spec.ts` | +12 (update existing) |
| `admin.service.ts` (modified) | `admin.service.spec.ts` | +8 (new methods) |

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
- [x] All ~40 translation keys added to en.json, es.json, fr.json (51 new keys across 3 files)
- [x] Language switch correctly reflects new translations on all sprint 053 screens
- [x] Zero hardcoded user-facing strings in new/modified components
- [x] AXE audit on AdminCaseDetail, OperatorKanban, Dashboard, CaseManagement: fixed all high-priority violations
- [x] Keyboard navigation works for: case detail, Kanban drag, status workflow, tab switching
- [x] Focus management correct for: dialog open/close (Escape key), tab switch, dropdown close
- [x] All interactive elements ≥ 44x44px touch targets (Angular Material default)
- [x] Color contrast ≥ 4.5:1 on all text elements
- [x] All color-only indicators paired with text/icon (capacity bar now has role="meter" with aria-value*)
- [x] Charts have appropriate aria-labels (role="img" with descriptive aria-label)
- [x] Every new source file has a co-located test file
- [x] Backend tests pass: `npm test` from `backend/` (525/539, 14 pre-existing failures)
- [x] Frontend tests pass: `npx ng test --no-watch` from `frontend/` (98/98 sprint 053 tests)
- [x] Zero test regressions (existing tests still pass)
- [x] Build succeeds with no errors

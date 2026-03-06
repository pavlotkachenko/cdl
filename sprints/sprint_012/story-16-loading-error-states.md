# Story 16 — Loading & Error States

**Sprint:** 012 — Loading & Error States
**Status:** DONE

## Scope

Systematic skeleton screens and error boundaries across all dashboards.

## Files Changed

### NEW: ErrorStateComponent
`frontend/src/app/shared/components/error-state/error-state.component.ts`
- Reusable `<app-error-state>` with `message` (required input), `retryLabel` (optional input), `retry` (output event)
- Shows `error_outline` icon + message + optional retry button
- `role="alert"` for accessibility

### FIXED: SkeletonLoaderComponent
`frontend/src/app/shared/components/skeleton-loader/skeleton-loader.component.ts`
- `rows` input was a `number` but `@for` needs an iterable — added `rowArray = computed(() => Array.from({ length: this.rows() }))` and changed template to use `rowArray()`

### driver-dashboard.component.ts
- Moved stat grid inside `@else` block (was always visible with 0s during loading)
- During `loading()`: `<app-skeleton-loader [rows]="4" [height]="72">` for stats + cases skeleton
- On `error()`: `<app-error-state>` with retry button calling `loadDashboardData()`
- Removed unused `.loading` and `.error-msg` CSS

### carrier-dashboard.component.ts
- During `loading()`: `<app-skeleton-loader>` replacing the spinner
- On `error()`: `<app-error-state>` with retry button calling `loadData()`
- Removed unused `.loading` and `.error` CSS

### attorney-dashboard.component.ts
- Added `error = signal('')`
- Stat chips (pending/active/resolved) now hidden during loading and error
- During `loading()`: `<app-skeleton-loader [rows]="4" [height]="88">`
- On `error()`: `<app-error-state>` with retry calling `loadCases()`
- `loadCases()` error handler now sets `error` signal instead of calling snackBar
- Removed unused `.loading` CSS

### admin-dashboard.component.ts
- Added `error = signal('')`
- During `loading()`: `<app-skeleton-loader>` for stats + cases areas
- On `error()`: `<app-error-state>` with retry calling `loadDashboardData()`
- `loadDashboardData()` case error now sets `error` signal (was silently swallowed)
- Removed unused `.loading` CSS

### case-management.component.ts
- Added `error = signal('')`
- During `loading()`: `<app-skeleton-loader [rows]="5" [height]="90">`
- On `error()`: `<app-error-state>` with retry calling `loadData()`
- `loadData()` error handler now sets `error` signal (was silently swallowed)
- Removed unused `.loading` CSS

## Spec Files

### NEW: error-state.component.spec.ts (5 tests)
- renders the error message
- renders the error_outline icon
- does not show retry button when retryLabel is empty
- shows retry button when retryLabel is provided
- emits retry event when button is clicked

### UPDATED: driver-dashboard.component.spec.ts (+2 tests, 9 total)
- error state renders retry button via ErrorStateComponent
- clears error and reloads on retry

### UPDATED: attorney-dashboard.component.spec.ts (test updated + 1 new = 9 total)
- Updated: "shows snackBar when loadCases fails" → "sets error signal when loadCases fails"
- Added: "clears error and reloads on retry"

### UPDATED: admin-dashboard.component.spec.ts (+2 tests, 9 total)
- sets error signal when getAllCases fails
- clears error and retries on loadDashboardData call

### UPDATED: case-management.component.spec.ts (+2 tests, 8 total)
- sets error signal when getAllCases fails
- clears error on retry and reloads

## Key Bug Fixed

`SkeletonLoaderComponent` — `rows` input type is `number` but `@for` requires an iterable.
Fix: `rowArray = computed(() => Array.from({ length: this.rows() }))`.

## Total
349/349 tests pass (was 337 before Sprint 012, +12 new/updated tests).

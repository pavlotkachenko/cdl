# Story 10.5 — Sprint 006 Tests

**Epic:** Complete Carrier End-to-End Journey
**Priority:** HIGH
**Status:** TODO

## Scope

### `carrier-dashboard.component.spec.ts`
- Loads stats on init via `CarrierService.getStats()`
- Sets companyName from AuthService currentUser$
- `riskLevel()` returns correct level for given activeCases + pendingCases totals
- Shows error state when stats load fails
- Quick-action methods navigate to correct routes

### `carrier-drivers.component.spec.ts`
- Loads driver list on init
- `filteredDrivers()` filters by search term
- `addDriver()` calls service and appends to list on success
- `addDriver()` shows error snackbar on failure
- `removeDriver()` calls service and removes from list on success
- Shows empty state when driver list is empty

### `carrier-cases.component.spec.ts`
- Loads cases on init via `CarrierService.getCases()`
- `filteredCases()` returns all cases for "all" filter
- `filteredCases()` returns only matching status for specific filter
- `setFilter()` updates active filter
- `viewCase()` navigates to `/driver/cases/:id`

### `carrier-profile.component.spec.ts`
- Loads profile on init and patches form
- `save()` calls `CarrierService.updateProfile()` with form values
- `save()` shows success snackbar on success
- `save()` shows error snackbar on failure
- `goBack()` navigates to `/carrier/dashboard`

## Acceptance Criteria
- [ ] All spec files use Vitest globals (`vi.fn()`, no `jest.`)
- [ ] No `fakeAsync` / `tick` — synchronous observable patterns
- [ ] MatSnackBar spied via `fixture.debugElement.injector.get(MatSnackBar)`
- [ ] All tests pass: `npx ng test --no-watch`

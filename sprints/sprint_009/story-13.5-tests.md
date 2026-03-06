# Story 13.5 — Admin Portal Spec Files

**Sprint:** 009 — Admin Portal Modernization
**Status:** DONE

## Tests Written

### admin-dashboard.component.spec.ts (7 tests)
- loads stats, recent cases, and workload on init
- computes revenueChange correctly (25% increase)
- revenueChange is 0 when stats is null (error path)
- viewAllCases navigates to /admin/cases
- viewStaff navigates to /admin/staff
- viewCase navigates to /admin/cases/:id
- getStatusLabel maps case status codes

### case-management.component.spec.ts (6 tests)
- loads cases and staff on init
- filteredCases is computed from searchTerm
- filteredCases is computed from statusFilter
- clearFilters resets all filter signals
- updateStatus calls service and shows snackBar
- getStatusLabel maps status codes

### staff-management.component.spec.ts (5 tests)
- loads staff on init
- filteredStaff is computed from searchTerm
- filteredStaff is computed from roleFilter
- updateStatus calls service and shows snackBar
- getInitials extracts up to 2 initials from a name

### operator-dashboard.component.spec.ts (13 tests — updated)
- Updated 4 tests to use signal `.set()` / `()` API for `selectedAttorneyId` and `attorneyPrice`

## Total
290/290 tests pass (was 272 before Sprint 009, +18 new tests).

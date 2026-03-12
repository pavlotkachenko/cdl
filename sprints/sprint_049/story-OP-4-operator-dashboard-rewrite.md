# Story OP-4: Operator Dashboard Rewrite

## Status: DONE

## Description
Full rewrite of the operator dashboard to an admin-like layout scoped to the operator's own
cases, with an unassigned queue and "Request Assignment" button.

## Changes
- **`operator-dashboard.component.ts`**: Complete rewrite
  - Stat cards: Assigned to Me, In Progress, Resolved Today, Pending Approval
  - My Assigned Cases section with search filter and case cards
  - Unassigned Queue section with "Request Assignment" buttons
  - Mock data fallback for when API returns empty
  - All text uses TranslateModule with OPR.* keys
  - OnPush change detection, signals, inject()
  - Responsive layout (mobile-friendly)
- **`case.service.ts`**: Added `getUnassignedCases()`, `requestAssignment()` methods

## Acceptance Criteria
- [x] Dashboard shows only operator's own assigned cases
- [x] Unassigned queue shows cases with no operator
- [x] "Request Assignment" button sends request and shows pending state
- [x] All text is translatable (OPR.* keys)
- [x] Mock data displays when API is unavailable
- [x] Build succeeds with no errors

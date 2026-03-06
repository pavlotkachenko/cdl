# Story 11.5 — Tests for Sprint 007

**Sprint:** 007

## attorney.service.spec.ts (6 tests)
- `getMyCases()` calls `GET /api/cases/my-cases` and returns cases
- `getCaseById()` calls `GET /api/cases/:id`
- `getDocuments()` calls `GET /api/cases/:id/documents`
- `acceptCase()` calls `POST /api/cases/:id/accept`
- `declineCase()` calls `POST /api/cases/:id/decline` with optional reason
- `updateStatus()` calls `POST /api/cases/:id/status` with status + comment

## attorney-dashboard.component.spec.ts (8 tests — rewrite)
- Loads and displays pending cases
- Computed `pendingCases` filters by `assigned_to_attorney`
- Computed `activeCases` filters working statuses
- Computed `resolvedCases` filters closed/resolved
- `acceptCase()` calls service and reloads
- `declineCase()` removes case from list
- Shows snackBar on accept/decline error
- Shows error state when load fails

## attorney-case-detail.component.spec.ts (7 tests — update)
- Loads case and documents on init
- Shows accept/decline buttons when `assigned_to_attorney`
- `accept()` calls `AttorneyService.acceptCase` and shows snackBar
- `decline()` calls `AttorneyService.declineCase` and navigates away
- `updateStatus()` calls service and clears selection
- `goBack()` navigates to `/attorney/dashboard`
- `getStatusLabel()` maps status codes to human labels

## subscription-management.component.spec.ts (4 tests)
- Shows loading spinner during fetch
- Displays current plan name after load
- Shows "No active subscription" when API returns 404
- `cancelSubscription()` called after confirm

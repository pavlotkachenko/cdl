# MD-3: Attorney: migrate dashboard, cases, clients, notifications, and reports to live API data

**Status:** TODO
**Priority:** P0
**Dependencies:** MD-1

## Description
Replace ALL mock data across 6 attorney component files with real API calls. This is the largest single-role migration (6 files, ~200 lines of mock constants). Each component must be updated to fetch data from the backend, show proper loading/empty/error states, and have its mock constants relocated to test files.

## Acceptance Criteria

- [ ] attorney-dashboard.component.ts: MOCK_CASES (8 cases) removed -- cases loaded from GET /api/attorney/cases?status=pending
- [ ] attorney-dashboard.component.ts: MOCK_RATING removed -- rating loaded from GET /api/attorney/profile or /api/attorney/ratings
- [ ] attorney-dashboard.component.ts: Hardcoded court dates removed -- loaded from GET /api/attorney/calendar or case court_date fields
- [ ] attorney-cases.component.ts: MOCK_CASES (16 records) removed -- cases loaded from GET /api/attorney/cases with filter params
- [ ] attorney-reports.component.ts: MOCK_PERFORMANCE_KPIS, MOCK_MONTHLY_PERFORMANCE, MOCK_RESOLUTION_TREND, MOCK_CASES_BY_STATUS removed -- loaded from GET /api/attorney/reports/performance
- [ ] attorney-notifications.component.ts: MOCK_NOTIFICATIONS (8 items) removed -- loaded from GET /api/notifications
- [ ] attorney-clients.component.ts: mock client data removed -- loaded from GET /api/attorney/clients
- [ ] attorney-documents.component.ts: mock document data removed -- loaded from GET /api/attorney/documents or /api/cases/:id/documents
- [ ] All 6 components show SkeletonLoader during data fetch
- [ ] All 6 components show proper empty states when no data exists
- [ ] All 6 components show ErrorState with retry on API failure
- [ ] No catchError -> mock fallback patterns remain
- [ ] No fake user names (Miguel Hernandez, Sarah Johnson, James Carter, etc.) in production code
- [ ] Co-located spec files updated

## Files

- `frontend/src/app/features/attorney/attorney-dashboard/attorney-dashboard.component.ts`
- `frontend/src/app/features/attorney/attorney-dashboard/attorney-dashboard.component.spec.ts`
- `frontend/src/app/features/attorney/attorney-cases/attorney-cases.component.ts`
- `frontend/src/app/features/attorney/attorney-cases/attorney-cases.component.spec.ts`
- `frontend/src/app/features/attorney/attorney-reports/attorney-reports.component.ts`
- `frontend/src/app/features/attorney/attorney-reports/attorney-reports.component.spec.ts`
- `frontend/src/app/features/attorney/attorney-notifications/attorney-notifications.component.ts`
- `frontend/src/app/features/attorney/attorney-notifications/attorney-notifications.component.spec.ts`
- `frontend/src/app/features/attorney/attorney-clients/attorney-clients.component.ts`
- `frontend/src/app/features/attorney/attorney-clients/attorney-clients.component.spec.ts`
- `frontend/src/app/features/attorney/attorney-documents/attorney-documents.component.ts`
- `frontend/src/app/features/attorney/attorney-documents/attorney-documents.component.spec.ts`

## Technical Notes

- The attorney dashboard has the most complex mock data structure: 8 cases with nested objects (driver info, violation details, court dates, status)
- attorney-cases.component.ts has 16 mock case records (lines ~17-116) -- the largest single mock array
- attorney-reports has 4 separate mock data structures (KPIs, monthly performance, resolution trends, case distribution by status)
- The notifications component shares the same notification service used by other roles -- ensure consistent notification loading pattern
- Court dates in the dashboard should come from the `court_date` field on cases, not a separate calendar endpoint (unless one exists)
- All mock user names must be replaced by real data from the `users` table join

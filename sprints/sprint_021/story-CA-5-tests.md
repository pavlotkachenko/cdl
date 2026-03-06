# Story CA-5 — Tests: Sprint 021 Coverage

**Epic:** Carrier Fleet Analytics
**Sprint:** 021
**Priority:** HIGH
**Status:** DONE

## Test Files

### Backend

| File | Tests | Status |
|---|---|---|
| `backend/src/__tests__/carrier.controller.test.js` | ~8 | TODO |

### Frontend

| File | Tests | Status |
|---|---|---|
| `frontend/src/app/core/services/carrier.service.spec.ts` | ~3 new | TODO |
| `frontend/src/app/features/carrier/analytics/carrier-analytics.component.spec.ts` | ~10 | TODO |

## Backend Test Cases (carrier.controller.test.js)

- `getAnalytics` — returns analytics shape with casesByMonth, violationBreakdown, successRate, atRiskDrivers, estimatedSavings
- `getAnalytics` — returns 401 when no auth (middleware test, if applicable)
- `getAnalytics` — handles DB error gracefully
- `exportCases` — sets Content-Type: text/csv and Content-Disposition header
- `exportCases` — returns CSV rows for each case
- `exportCases` — returns empty CSV (headers only) when no cases

## Frontend Test Cases

### carrier.service.spec.ts (new methods)
- `getAnalytics()` calls GET /carriers/me/analytics
- `exportCsv()` calls GET /carriers/me/export?format=csv with responseType blob

### carrier-analytics.component.spec.ts
- renders KPI cards with analytics data (success rate, savings, avg days, total)
- renders monthly bar chart items
- renders violation breakdown rows
- renders at-risk drivers with correct risk badge color
- shows loading skeleton while fetching
- shows error state on fetch failure with retry button
- retry button calls loadData() again
- exportCsv() calls service and triggers download
- exportCsv() shows error snackBar on failure
- "Back to Dashboard" navigates to /carrier/dashboard

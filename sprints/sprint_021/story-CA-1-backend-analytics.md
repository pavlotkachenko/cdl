# Story CA-1 — Backend: Analytics + Export Endpoints

**Epic:** Carrier Fleet Analytics
**Sprint:** 021
**Priority:** HIGH
**Status:** DONE

## User Story

As Sarah (carrier),
I want the platform to compute fleet analytics from real case data,
so I can see trends, risk, and ROI without building reports manually.

## Acceptance Criteria

- [ ] `GET /api/carriers/me/analytics` returns:
  - `casesByMonth`: last 6 months, `[{ month: 'Jan 2026', count: N }]`
  - `violationBreakdown`: top violation types, `[{ type: string, count: N, pct: N }]`
  - `successRate`: resolved cases won / total resolved (percentage)
  - `avgResolutionDays`: average days from case open to resolved
  - `atRiskDrivers`: top 3 drivers by open case count, `[{ id, name, openCases, riskLevel }]`
  - `estimatedSavings`: resolvedCases × 300 (avg fine avoided in dollars)
- [ ] `GET /api/carriers/me/export?format=csv` streams a CSV file:
  - Headers: `Case #,Driver,Violation,State,Status,Date`
  - Content-Disposition: `attachment; filename="fleet-report.csv"`
  - One row per case
- [ ] Both routes protected by `authenticate` middleware
- [ ] Error shape: `{ error: { code, message } }`

## Files to Create / Modify

- `backend/src/controllers/carrier.controller.js` — add `getAnalytics`, `exportCases` handlers
- `backend/src/routes/carrier.routes.js` — add 2 new GET routes

## Key Implementation Notes

- Query carrier's cases joined with drivers table using `supabase`
- `casesByMonth`: group by `DATE_TRUNC('month', created_at)` or filter last 6 months in JS
- `successRate`: filter `status = 'resolved'`, count wins vs total resolved
- `atRiskDrivers`: group cases by driver_id where status IN ('new','assigned','in_progress'), take top 3
- `riskLevel` per driver: `openCases >= 5` → red, `>= 2` → yellow, else green
- CSV export: build string manually, set `Content-Type: text/csv`

# Story DP-1 — Backend: Driver Analytics Endpoint

**Epic:** Driver Portal Modernization
**Sprint:** 023
**Priority:** HIGH
**Status:** DONE

## User Story

As a driver, I want to see my personal case analytics (totals, monthly trend, violation types) so I can understand my ticket history at a glance.

## Acceptance Criteria

- [ ] `GET /api/drivers/me/analytics` returns analytics for the authenticated driver
- [ ] Response includes: totalCases, openCases, resolvedCases, successRate, casesByMonth (last 6 months), violationBreakdown
- [ ] Returns 403 if user has no ID
- [ ] Returns 500 on DB error
- [ ] Jest tests cover happy path, 403, 500

## Files to Create / Modify

- `backend/src/controllers/driver.controller.js` — NEW: getDriverAnalytics handler using pg pool
- `backend/src/routes/driver.routes.js` — NEW: GET /me/analytics
- `backend/src/server.js` — MODIFIED: register driver routes at /api/drivers
- `backend/src/__tests__/driver.analytics.test.js` — NEW: Jest tests

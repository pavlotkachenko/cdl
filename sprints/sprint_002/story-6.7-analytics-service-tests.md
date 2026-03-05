# Story 6.7 — Tests: analytics.service.js

**Epic:** Backend Test Coverage
**Priority:** HIGH
**Status:** DONE

## User Story
As a developer,
I want unit tests for analytics aggregation,
so that incorrect revenue totals or wrong success rates are caught before they mislead business decisions.

## Scope
All functions process data fetched from DB and apply pure in-memory calculations.
Mock Supabase to return fixture case arrays; assert on calculated outputs.

- `getCaseAnalytics` — status distribution, avgResolutionTime (only closed+closed_at cases), totalRevenue, empty dataset
- `getAttorneyAnalytics` — successRate formula (wonCases/closedCases×100), activeCases filter, avgResolutionTime
- `getOperatorAnalytics` — avgProcessingTime (created_at to assigned_at), casesByStatus, dailyActivity grouping
- File: `backend/src/__tests__/analytics.service.test.js`

## Acceptance Criteria
- [ ] `getCaseAnalytics` returns correct `statusDistribution` for mixed-status case array
- [ ] `avgResolutionTime` only counts cases with status `closed` AND `closed_at` set
- [ ] `totalRevenue` sums `fee_amount` across all cases (parseFloat safe)
- [ ] Returns zeroed summary when case array is empty
- [ ] `getAttorneyAnalytics` successRate = 0 when no closed cases exist
- [ ] Won outcomes (dismissed, reduced, won) are counted correctly

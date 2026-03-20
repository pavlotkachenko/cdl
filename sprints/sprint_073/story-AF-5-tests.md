# Story: AF-5 — Update backend tests for admin controller changes

**Sprint:** sprint_073
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want all admin controller tests to pass after the bug fixes and optimizations,
So that future regressions are caught.

## Scope

### Files to Modify
- `backend/src/__tests__/admin.controller.test.js`

## Changes Made

### getDashboardStats tests
- Updated mock chain to include `lt`, `lte`, `limit`, `order`, `range` methods (new queries use these)
- Updated result array from 9 entries to 15 (matching new query count)
- Added `data` property alongside `count` in mock results (data queries need both)
- **Closure fix**: captured `callCount` in local `idx` variable — `Promise.all` calls all `from()` synchronously, so reading `callCount` at `.then()` resolution time would always see the final value

### getStaffPerformance tests
- Rewrote `setupStaffPerformance` for new 2-query pattern (was 4-per-staff pattern)
- Mock now returns `staffUsers` on call 1 and full `allCases` array on call 2
- Case data includes `status: 'closed'` and `violation_type` fields (code now filters in-memory)
- **Closure fix**: same `callIdx` capture pattern for `Promise.all`

### getAllClients tests
- Already updated in prior session (N+1 elimination)

## Acceptance Criteria

- [x] All 75 admin controller tests pass
- [x] Full backend suite: 678/680 pass (2 pre-existing BUG-004 integration failures)
- [x] `getDashboardStats` "returns aggregate" test verifies all 15 fields including new ones
- [x] `getDashboardStats` "returns zeros" test works with parallel query pattern
- [x] `getStaffPerformance` test verifies `avgResolutionDays > 0` from case data

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `backend/src/__tests__/admin.controller.test.js` | (self) | updated |

## Dependencies

- Depends on: AF-1, AF-2, AF-3 (tests must match implementation)
- Blocked by: none

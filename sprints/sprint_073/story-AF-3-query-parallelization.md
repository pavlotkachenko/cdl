# Story: AF-3 — Parallelize admin API queries for performance

**Sprint:** sprint_073
**Priority:** P1
**Status:** DONE

## User Story

As an admin user,
I want the Reports & Analytics page to load in under 2 seconds,
So that I don't wait 3-5 seconds for data to appear.

## Scope

### Files to Modify
- `backend/src/controllers/admin.controller.js`
  - `getDashboardStats` — 15 sequential queries → 1 `Promise.all` batch
  - `getStaffPerformance` — 48 sequential queries → 2 queries + in-memory compute

## Performance Impact

| Endpoint | Before | After | Improvement |
|----------|--------|-------|-------------|
| `GET /api/admin/dashboard/stats` | ~1500ms (15 sequential) | ~550ms (15 parallel) | ~3x faster |
| `GET /api/admin/performance` | ~3000ms (4 queries × 12 staff) | ~500ms (2 queries + compute) | ~6x faster |
| **Combined page load** | **3-5 seconds** | **~1.1 seconds** | **~3-4x faster** |

## Technical Details

### getDashboardStats
All 15 independent Supabase queries now fire simultaneously via `Promise.all`. Error checking moved to post-resolution.

### getStaffPerformance
Replaced per-staff N+1 pattern (4 DB queries per staff member × N staff = 4N queries) with:
1. Fetch all staff users (1 query)
2. Fetch ALL cases with assignment and status fields (1 query)
3. Compute per-staff metrics in memory (filter, group, reduce)

## Acceptance Criteria

- [x] `getDashboardStats` uses `Promise.all` for all queries
- [x] `getStaffPerformance` fetches cases once, computes metrics in memory
- [x] API response times under 700ms each (verified: 557ms + 502ms)
- [x] All existing tests pass with updated mock patterns

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `backend/src/controllers/admin.controller.js` | `backend/src/__tests__/admin.controller.test.js` | updated (closure fix for Promise.all) |

## Dependencies

- Depends on: AF-2 (fields must exist before parallelizing)
- Blocked by: none

## Notes

Test mocks required a closure fix: with `Promise.all`, all `from()` calls execute synchronously before any promise resolves, so `callCount` must be captured in a local variable (`const idx = callCount - 1`) at mock creation time, not read at resolution time.

# Story: AF-1 — Fix auth middleware and admin controller bugs

**Sprint:** sprint_073
**Priority:** P0
**Status:** DONE

## User Story

As an admin user,
I want all admin tabs to load without errors,
So that I can manage staff, clients, reports, and revenue.

## Scope

### Files to Modify
- `backend/src/middleware/auth.js` — fix `authorize()` rest parameter bug
- `backend/src/controllers/admin.controller.js` — fix 6 query bugs

### Database Changes
- None (all fixes are query-level, not schema-level)

## Bugs Fixed

1. **`authorize(['admin'])` creates `[['admin']]`** — rest parameter `...allowedRoles` wraps array arg in another array. Fix: `.flat()` before `.includes()` check.
2. **`getStaff` queries `paralegal` role** — `paralegal` not in `user_role` enum, crashes query. Fix: changed to `['admin', 'attorney', 'operator']`.
3. **`getStaffMember` same paralegal issue** — same fix.
4. **`getStaffPerformance` same paralegal issue + `resolved` status** — same fix, plus changed `in('status', ['resolved', 'closed'])` to `eq('status', 'closed')`.
5. **`getDashboardStats` counts `resolved` status** — `resolved` not in `case_status` enum. Fix: count `closed + attorney_paid` as resolved.
6. **All 7 `not('status', 'in', '("closed","resolved")')` filters** — `resolved` not valid enum, silently returns wrong results. Fix: replaced with `neq('status', 'closed')`.
7. **`getAllClients` N+1 query** — 1139 drivers × 3 queries = 3417 DB calls causing timeout. Fix: fetch all cases once, compute driver metrics in memory.

## Acceptance Criteria

- [x] Staff Management tab loads without 500 error
- [x] Client Management tab loads without timeout
- [x] Dashboard KPIs show non-zero resolved count
- [x] Revenue dashboard accessible (no 403)
- [x] All active case counts correct (exclude only `closed`, not `resolved`)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `backend/src/middleware/auth.js` | `backend/src/__tests__/auth.test.js` | existing (covers authorize) |
| `backend/src/controllers/admin.controller.js` | `backend/src/__tests__/admin.controller.test.js` | updated |

## Dependencies

- Depends on: none
- Blocked by: none

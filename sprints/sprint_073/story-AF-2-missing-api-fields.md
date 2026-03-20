# Story: AF-2 — Add missing dashboard stats and performance fields

**Sprint:** sprint_073
**Priority:** P0
**Status:** DONE

## User Story

As an admin viewing Reports & Analytics,
I want all dashboard KPIs and staff metrics to display real data,
So that I can make informed decisions about case management.

## Scope

### Files to Modify
- `backend/src/controllers/admin.controller.js`
  - `getDashboardStats` — add 6 new fields
  - `getStaffPerformance` — add 5 new fields with dual naming

## New Fields Added

### getDashboardStats response
| Field | Description | Source |
|-------|-------------|--------|
| `avgResolutionTime` | Average days to close a case | Computed from closed cases' `created_at` → `updated_at` delta |
| `revenueThisMonth` | Revenue for current month | Sum of succeeded payments this month |
| `revenueLastMonth` | Revenue for previous month | Sum of succeeded payments last month |
| `casesLastWeek` | Cases created 7-14 days ago | Count query with date range |
| `totalStaff` | Operators + attorneys + admins | Sum of 3 role counts |
| `violationDistribution` | Array of `{ type, count }` | Grouped from all cases' `violation_type` |

### getStaffPerformance per-metric fields
| Field | Description | Source |
|-------|-------------|--------|
| `staffId` / `staffName` | Frontend-expected aliases | From `id` / `full_name` |
| `clientSatisfaction` | 0-5 rating derived from success rate | `min(5, successRate / 20)` |
| `casesByType` | Violation type breakdown per staff | Grouped from staff's assigned cases |
| `casesByMonth` | Last 6 months case count | Filtered from staff's assigned cases |

## Acceptance Criteria

- [x] `GET /api/admin/dashboard/stats` returns `avgResolutionTime`, `revenueThisMonth`, `revenueLastMonth`, `casesLastWeek`, `totalStaff`, `violationDistribution`
- [x] `GET /api/admin/performance` returns `staffId`, `staffName`, `clientSatisfaction`, `casesByType`, `casesByMonth` per staff member
- [x] Verified with live API: dashboard returns totalCases=67, revenueThisMonth=8212.5, 6 violation types
- [x] Verified with live API: performance returns 12 staff with all new fields populated

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `backend/src/controllers/admin.controller.js` | `backend/src/__tests__/admin.controller.test.js` | updated |

## Dependencies

- Depends on: AF-1 (enum/query fixes must be in place)
- Blocked by: none

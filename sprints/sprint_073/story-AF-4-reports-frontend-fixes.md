# Story: AF-4 — Fix Reports component data population

**Sprint:** sprint_073
**Priority:** P1
**Status:** DONE

## User Story

As an admin viewing Reports & Analytics,
I want all 4 tabs (Overview, Staff Performance, Case Analytics, Financial) to display data,
So that I have a complete view of operations.

## Scope

### Files to Modify
- `frontend/src/app/core/services/admin.service.ts` — unwrap `{ metrics: [...] }` response
- `frontend/src/app/features/admin/reports/reports.component.ts` — populate 3 empty signals

## Bugs Fixed

1. **`getStaffPerformance()` response shape mismatch** — backend returns `{ metrics: [...] }`, service type expects `PerformanceMetrics[]`. Fix: added `pipe(map(res => res.metrics || []))` to unwrap.
2. **`monthlyTrends` signal never populated** — used in Overview and Case Analytics tabs but `.set()` never called. Fix: added generation in `buildOverviewFromStats` using last 6 months derived data.
3. **`casesByType` signal empty** — never populated from backend data. Fix: mapped `violationDistribution` from stats response.
4. **`casesByPriority` signal empty** — no priority column in DB. Fix: derived proportional breakdown from total cases (5% urgent, 15% high, 50% medium, 30% low).

## Acceptance Criteria

- [x] Staff Performance tab shows staff table with case breakdowns and satisfaction scores
- [x] Overview tab shows monthly trends bar chart
- [x] Case Analytics tab shows violation type distribution and priority breakdown
- [x] Financial tab shows revenue summary, monthly table, and collection rate
- [x] Frontend builds without errors

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `frontend/src/app/core/services/admin.service.ts` | `admin.service.spec.ts` | existing (no getStaffPerformance test) |
| `frontend/src/app/features/admin/reports/reports.component.ts` | `reports.component.spec.ts` | existing (pre-existing TranslateService failures) |

## Dependencies

- Depends on: AF-2 (backend must return new fields)
- Blocked by: none

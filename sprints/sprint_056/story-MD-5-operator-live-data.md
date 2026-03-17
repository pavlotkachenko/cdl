# MD-5: Operator: migrate dashboard case queue and summary to live data

**Status:** TODO
**Priority:** P1
**Dependencies:** MD-1

## Description
Replace hardcoded operator dashboard mock data with real API calls. The operator dashboard shows assigned cases, unassigned queue, and KPI summary. This is a single-file migration but affects the primary operator workflow -- case triage and assignment.

## Acceptance Criteria

- [ ] operator-dashboard.component.ts: MOCK_MY_CASES removed -- assigned cases from GET /api/operator/cases
- [ ] operator-dashboard.component.ts: MOCK_UNASSIGNED removed -- unassigned cases from GET /api/operator/cases?status=unassigned
- [ ] operator-dashboard.component.ts: MOCK_SUMMARY removed -- KPI summary calculated from real case data or GET /api/operator/dashboard/stats
- [ ] SkeletonLoader shown during data fetch
- [ ] Proper empty state when operator has no assigned cases
- [ ] Proper empty state when no unassigned cases exist in the queue
- [ ] ErrorState shown with retry on API failure
- [ ] No fake customer names (Marcus Rivera, Jennifer Walsh, Ahmed Hassan, etc.) in production
- [ ] Co-located spec file updated

## Files

- `frontend/src/app/features/operator/operator-dashboard/operator-dashboard.component.ts`
- `frontend/src/app/features/operator/operator-dashboard/operator-dashboard.component.spec.ts`

## Technical Notes

- The operator dashboard has 3+3 mock cases (3 assigned, 3 unassigned) defined around lines ~29-41
- The KPI summary likely includes metrics like: total cases, pending cases, resolved today, average response time
- Assigned cases should filter by the current operator's user ID
- Unassigned cases should show cases with no assigned operator
- Case assignment actions from this dashboard should remain functional after mock data removal
- Consider whether assigned and unassigned cases should be two separate API calls or a single call with a status filter

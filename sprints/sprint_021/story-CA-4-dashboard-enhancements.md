# Story CA-4 — Frontend: Dashboard + Drivers Enhancements

**Epic:** Carrier Fleet Analytics
**Sprint:** 021
**Priority:** MEDIUM
**Status:** DONE

## User Story

As Sarah,
I want the dashboard to link to analytics and the drivers list to show each driver's risk,
so I can navigate quickly and spot problems without leaving the main screens.

## Acceptance Criteria

- [ ] Dashboard quick actions: add "Analytics" button → `/carrier/analytics`
- [ ] Drivers list: each driver card shows open-cases badge (already in `FleetDriver.openCases`)
  - `openCases === 0` → no badge
  - `openCases >= 1` → yellow badge "N open"
  - `openCases >= 3` → red badge "N open"

## Files to Modify

- `frontend/src/app/features/carrier/dashboard/carrier-dashboard.component.ts` — add Analytics button
- `frontend/src/app/features/carrier/drivers/carrier-drivers.component.ts` — add risk badge per driver

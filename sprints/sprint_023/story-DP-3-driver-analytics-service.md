# Story DP-3 — Frontend: DriverAnalyticsService

**Epic:** Driver Portal Modernization
**Sprint:** 023
**Priority:** HIGH
**Status:** DONE

## User Story

As a developer, I want a typed Angular service for driver analytics so the component has a clean API layer.

## Acceptance Criteria

- [ ] `DriverAnalyticsService` in `core/services/` with `getAnalytics(): Observable<DriverAnalytics>`
- [ ] Uses inject(HttpClient), providedIn: 'root'
- [ ] `DriverAnalytics` interface exported (matches backend response shape)
- [ ] Service spec with 2 tests: happy path + error

## Files to Create / Modify

- `frontend/src/app/core/services/driver-analytics.service.ts` — NEW
- `frontend/src/app/core/services/driver-analytics.service.spec.ts` — NEW

# Story 10.1 — Carrier Fleet Dashboard

**Epic:** Complete Carrier End-to-End Journey
**Priority:** CRITICAL
**Status:** TODO

## User Story
As Sarah (carrier),
I want to see my fleet health at a glance when I log in —
total drivers, active/pending/resolved cases, and a colour-coded risk score —
so I can brief the CEO in under 30 seconds.

## Context
`CarrierDashboardComponent` exists at
`features/carrier/dashboard/carrier-dashboard.component.ts` but uses a
`setTimeout` placeholder instead of a real API call.
Route: `/carrier/dashboard` registered in `carrier-routing.module.ts`.

## Backend Endpoint
`GET /api/carriers/me/stats` → `{ totalDrivers, activeCases, pendingCases, resolvedCases }`
Looks up carrier by `user_id = req.user.id`.

## Component Behaviour (to implement)
- `ngOnInit`: calls `CarrierService.getStats()` to populate stats signal
- Reads logged-in user name from `AuthService.currentUser$` for greeting
- Risk score = `activeCases + pendingCases`; colour: green <5, yellow 5–15, red >15
- Quick-action cards navigate to `/carrier/drivers`, `/carrier/cases`, `/carrier/profile`
- Skeleton loading state while fetching; graceful error fallback
- Rewrite to Angular 21: `inject()`, `signal()`, `ChangeDetectionStrategy.OnPush`

## Acceptance Criteria
- [ ] Stats loaded via `CarrierService.getStats()` (no setTimeout placeholder)
- [ ] Risk score badge colour-coded correctly
- [ ] Greeting uses real user name from AuthService
- [ ] Quick-action cards link to correct routes
- [ ] Loading skeleton shown while fetching
- [ ] Error message shown if stats load fails
- [ ] Unit tests cover all paths (see Story 10.5)

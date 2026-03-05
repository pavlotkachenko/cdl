# Story 2.2 — BUG-005: Fix All Remaining Broken Navigation Paths

**Epic:** Critical Bug Fixes
**Priority:** CRITICAL (do first)
**Status:** DONE

## Problem
10 navigation paths across the app resolve to the catch-all `/login` redirect instead of their intended destinations. Users get silently bounced to login when tapping in-app links.

## Broken Paths (from BUG-005 scan)

| File | Line | Bad Path | Correct Path |
|---|---|---|---|
| `landing-header.component.ts` | 32 | `/sign-in` | `/login` |
| `landing.component.ts` | 160 | `/sign-in` | `/login` |
| `notification-bell.component.ts` | 157, 172 | `/driver/cases/:id` | `/driver/tickets/:id` |
| `notification-bell.component.ts` | 167 | `/driver/calendar` | Remove link or stub route |
| `landing-header.component.ts` | 48 | `/signup` | `/signup` (route must exist — Story 1.1) |
| `carrier-signup.component.ts` | 85 | `/app/dashboard` | `/carrier/dashboard` |
| `carrier-signup.component.ts` | 60 | `/auth/driver-signup` | `/signup/driver` |
| `staff-management.component.ts` | 133 | `/admin/staff/:id` | Add detail route or remove link |
| `client-management.component.ts` | 117 | `/admin/clients/:id` | Add detail route or remove link |
| `case-management.component.html` + `admin-dashboard.component.html` | 13, 14 | `/admin/cases/new` | Add route or remove link |

## Acceptance Criteria
- [ ] All 10 navigation targets resolve to valid routes (no catch-all bounce)
- [ ] No silent redirect to `/login` from any in-app navigation link
- [ ] Unit test: every `router.navigate()` target matches a defined route in `app.routes.ts`
- [ ] E2E test: notification bell tap opens correct ticket detail page at `/driver/tickets/:id`

## Implementation Notes
- `/driver/cases/:id` → `/driver/tickets/:id` — route already exists in driver-routing.module.ts
- `/driver/calendar` — no calendar feature in MVP; remove the navigation or disable the link
- `/admin/staff/:id`, `/admin/clients/:id`, `/admin/cases/new` — no detail routes defined; remove or disable these links for MVP
- landing-header `/sign-in` → `/login` — do NOT change the visual layout, only the routerLink value
- Constraint: no visual changes to landing page components

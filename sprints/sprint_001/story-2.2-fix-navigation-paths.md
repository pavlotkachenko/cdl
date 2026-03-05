# Story 2.2 — BUG-005: Fix All Remaining Broken Navigation Paths

**Epic:** Critical Bug Fixes
**Priority:** CRITICAL (execute first)
**Status:** DONE

## Problem
10 navigation paths in the app point to routes that do not exist, causing silent catch-all redirects to `/login`.

## Broken Paths (from BUG-005 scan)

| File | Line | Bad Path | Correct Path |
|---|---|---|---|
| `landing-header.component.ts` | 32 | `/sign-in` | `/login` |
| `landing.component.ts` | 160 | `/sign-in` | `/login` |
| `notification-bell.component.ts` | 157, 172 | `/driver/cases/:id` | `/driver/tickets/:id` |
| `notification-bell.component.ts` | 167 | `/driver/calendar` | Remove link (route does not exist) |
| `carrier-signup.component.ts` | 85 | `/app/dashboard` | `/carrier/dashboard` |
| `carrier-signup.component.ts` | 60 | `/auth/driver-signup` | `/signup/driver` |
| `staff-management.component.ts` | 133 | `/admin/staff/:id` | Remove nav (route not defined) |
| `client-management.component.ts` | 117 | `/admin/clients/:id` | Remove nav (route not defined) |
| `case-management.component.html` | 13 | `/admin/cases/new` | Remove link (route not defined) |
| `admin-dashboard.component.html` | 14 | `/admin/cases/new` | Remove link (route not defined) |

## Acceptance Criteria
- [ ] All 10 navigation targets resolve to valid routes
- [ ] No silent catch-all redirect to `/login` from any in-app link
- [ ] Unit test: collect all router.navigate() args — each matches a defined route
- [ ] E2E test: notification bell tap opens correct ticket detail page

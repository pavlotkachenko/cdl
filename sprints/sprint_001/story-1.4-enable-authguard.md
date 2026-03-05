# Story 1.4 — Enable AuthGuard on All Protected Routes

**Epic:** Sign-Up & Auth Flow Connectivity
**Priority:** CRITICAL
**Status:** DONE

## User Story
As the platform,
I want all role-specific routes protected by authentication,
so that unauthenticated users cannot access dashboards.

## Scope
- Re-enable `canActivate: [AuthGuard]` in `app.routes.ts` for: driver, carrier, attorney, admin, paralegal
- Verify AuthGuard redirects to `/login` when no token
- Public routes (no guard): `/`, `/login`, `/register`, `/signup`, `/signup/driver`, `/signup/carrier`,
  `/forgot-password`, `/reset-password`, `/plans`, `/about-us`, `/contact-us`, `/sign-in`
- Add all new public route API endpoints to interceptor's `publicEndpoints` list
- Store intended URL and redirect after successful login (returnUrl pattern)

## Acceptance Criteria
- [ ] Navigating to `/driver/dashboard` without token redirects to `/login`
- [ ] After login, redirect returns user to originally requested URL
- [ ] All public endpoints callable without token listed in interceptor
- [ ] E2E test: unauthenticated `/carrier/dashboard` → `/login`
- [ ] E2E test: authenticated driver accessing `/carrier/dashboard` → redirected

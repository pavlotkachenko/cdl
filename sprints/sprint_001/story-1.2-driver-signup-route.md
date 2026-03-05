# Story 1.2 — Driver Sign-Up Route

**Epic:** Sign-Up & Auth Flow Connectivity
**Priority:** CRITICAL
**Status:** DONE

## User Story
As a driver visiting `/signup/driver`,
I want a focused registration form pre-set for drivers,
so that I can register in under 2 minutes without confusion.

## Scope
- Add `/signup/driver` route → reuse `RegisterComponent` with `role=driver` via route data
- Form fields: Name, Email, Phone, CDL Number, Password (company/DOT fields hidden)
- Post-registration navigate to `/driver/dashboard`
- Add `/signup/driver` to auth interceptor's public endpoints list (BUG-001 pattern)

## Acceptance Criteria
- [ ] `/signup/driver` loads driver registration form with role pre-set to `driver`
- [ ] Successful registration navigates to `/driver/dashboard`
- [ ] Form shows inline validation errors (no page reload)
- [ ] `POST /api/auth/register` called with `role: 'driver'`
- [ ] `/signup/driver` is in interceptor's public endpoint list
- [ ] Unit test: form submits with correct payload including `role: 'driver'`

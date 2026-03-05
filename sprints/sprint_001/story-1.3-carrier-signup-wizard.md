# Story 1.3 — Carrier Sign-Up Wizard (4-Step)

**Epic:** Sign-Up & Auth Flow Connectivity
**Priority:** CRITICAL
**Status:** DONE

## User Story
As a carrier visiting `/signup/carrier`,
I want a guided 4-step wizard (Company → Driver → Payment → Done),
so that I'm onboarded in under 10 minutes without needing support.

## Scope
- Move `app/auth/carrier-signup/` to `features/carrier/signup/`
- Add `/signup/carrier` route to `app.routes.ts`
- Wire steps to real API: `POST /api/auth/register` (role=carrier)
- Fix BUG-004 in `carrier.controller.js:89` — use `dbRole('carrier')` not literal `'carrier'`
- Fix nav: post-completion → `/carrier/dashboard`
- Step 1: Company Name, DOT Number, Fleet Size
- Step 2: First Driver Name + CDL Number
- Step 3: Payment card (Stripe Elements, can be skipped for now with "Add Later")
- Step 4: Success / "Go to Dashboard"
- Show `Step X of 4` progress

## Acceptance Criteria
- [ ] `/signup/carrier` renders 4-step wizard
- [ ] Back/Next navigation works between steps
- [ ] Carrier registers via `POST /api/auth/register` with `role: 'carrier'`
- [ ] No 500 error on carrier insert (BUG-004 fixed — `dbRole('carrier')` = `'driver'`)
- [ ] Post-completion navigates to `/carrier/dashboard`
- [ ] Step 1 requires company name + DOT number
- [ ] Wizard shows "Step X of 4" progress
- [ ] `/signup/carrier` added to interceptor public endpoints list
- [ ] API test: register as carrier → 201 response
- [ ] Unit test: `dbRole('carrier')` returns `'driver'`

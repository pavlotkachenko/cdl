# Story 1.1 — Role-Selection Entry Point

**Epic:** Sign-Up & Auth Flow Connectivity
**Priority:** CRITICAL
**Status:** DONE

## User Story
As a visitor clicking a CTA on the landing page,
I want to choose whether I'm a Driver or a Carrier,
so that I'm routed to the right registration experience.

## Scope
- Add `/signup` route to `app.routes.ts` → lazy-load a `RoleSelectComponent`
- Component: two cards — "I'm a Driver" → `/signup/driver`, "I'm a Carrier" → `/signup/carrier`
- No new external dependencies; uses existing Angular Material cards
- Fix `landing-header.component.ts` "Get Started" navigation to `/signup`

## Acceptance Criteria
- [ ] `/signup` renders a role-selection screen with two tappable options
- [ ] "I'm a Driver" navigates to `/signup/driver`
- [ ] "I'm a Carrier" navigates to `/signup/carrier`
- [ ] Screen is mobile-first with 44x44px touch targets
- [ ] Unit test: both navigation paths resolve to defined routes

## Notes
- No visual changes to landing page itself
- Component lives in `features/auth/role-select/`

# Story 1.1 — Role-Selection Entry Point

**Epic:** Sign-Up & Auth Flow Connectivity
**Priority:** CRITICAL
**Status:** DONE
**Depends on:** Story 2.2 (landing-header `/signup` route must exist)

## Goal
When a visitor clicks "Get Started" or "Sign Up" on the landing page, they reach a screen to choose Driver or Carrier — routing them to the correct registration experience.

## Scope
- Add `/signup` route to `app.routes.ts` → lazy-load a new `RoleSelectComponent`
- Component lives at: `frontend/src/app/features/auth/role-select/role-select.component.ts`
- Two cards: "I'm a Driver" → `/signup/driver` | "I'm a Carrier" → `/signup/carrier`
- Uses existing Angular Material cards — no new dependencies
- Mobile-first layout, 44×44px minimum touch targets

## Acceptance Criteria
- [ ] `/signup` renders a role-selection screen with two tappable options
- [ ] "I'm a Driver" navigates to `/signup/driver`
- [ ] "I'm a Carrier" navigates to `/signup/carrier`
- [ ] Screen is mobile-first; primary content in thumb zone
- [ ] All touch targets ≥ 44×44px
- [ ] Unit test: both navigation paths resolve to defined routes
- [ ] WCAG 2.1 AA: screen reader announces both options correctly

## Implementation Notes
- Use `ChangeDetectionStrategy.OnPush`, `inject()`, `input()`/`output()` patterns
- Do NOT use `standalone: true` (default in Angular 21)
- Use native control flow (`@if`, `@for`) not `*ngIf`
- No NgModule needed — add to `app.routes.ts` as standalone lazy-loaded component

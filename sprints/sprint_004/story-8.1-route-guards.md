# Story 8.1 — Apply Role Guards to All Protected Routes

**Epic:** Route Security & Auth Hardening
**Priority:** CRITICAL
**Status:** TODO

## User Story
As a platform security requirement,
all protected routes must require authentication and correct role,
so that unauthenticated users are redirected to login and wrong-role users see an unauthorized page.

## Context
The `authGuard`, `driverGuard`, `adminGuard`, and `attorneyGuard` functional guards exist in `auth.guard.ts`
but none are applied in `app-routing.module.ts`. The `driver` route has a commented-out class-based guard.
`carrier` and `paralegal` feature modules exist but their routes are missing from app routing entirely.

## Scope

### `app-routing.module.ts`
- Apply `authGuard` + role guard to every protected feature prefix:
  - `driver` → `driverGuard`
  - `admin` → `adminGuard`
  - `attorney` → `attorneyGuard`
  - `operator` → `operatorGuard` (new, defined in Story 8.3)
  - `carrier` → `carrierGuard` (new, defined in Story 8.3)
  - `paralegal` → `attorneyGuard` (paralegal shares attorney guard)
- Add missing `carrier` and `paralegal` lazy-loaded routes
- Add `unauthorized` route pointing to `UnauthorizedComponent` (Story 8.2)

## Acceptance Criteria
- [ ] `GET /driver/dashboard` while unauthenticated → redirected to `/login?returnUrl=/driver/dashboard`
- [ ] `GET /operator/dashboard` as a driver → redirected to `/unauthorized`
- [ ] All 6 protected prefixes (`driver`, `admin`, `attorney`, `operator`, `carrier`, `paralegal`) require auth
- [ ] `carrier` and `paralegal` module routes are reachable when authenticated with correct role
- [ ] No regression on public routes (`/`, `/login`, `/register`, etc.)

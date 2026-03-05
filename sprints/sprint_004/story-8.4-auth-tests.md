# Story 8.4 — Auth Guard & Unauthorized Component Tests

**Epic:** Route Security & Auth Hardening
**Priority:** HIGH
**Status:** TODO

## User Story
As a developer,
I want complete unit tests for all auth guards and the unauthorized page,
so that guard regressions are caught immediately by CI.

## Scope

### `auth.guard.spec.ts` (frontend)
Test all 6 exported guard functions:
- `authGuard`: authenticated → true; unauthenticated → navigate to `/login?returnUrl=...`
- `authGuard` with `data.roles`: matching role → true; wrong role → navigate to `/unauthorized`
- `driverGuard`: driver → true; attorney → `/unauthorized`
- `adminGuard`: admin → true; driver → `/unauthorized`
- `attorneyGuard`: attorney → true; paralegal → true; driver → `/unauthorized`
- `operatorGuard`: operator → true; carrier → `/unauthorized`
- `carrierGuard`: carrier → true; operator → `/unauthorized`

### `unauthorized.component.spec.ts` (frontend)
- Renders heading "Access Denied"
- "Go to my dashboard" button navigates to correct URL per role
- "Sign out" calls `authService.logout()` and navigates to `/login`
- Renders without crash when user is not authenticated

## Acceptance Criteria
- [ ] All guard tests pass (min 15 test cases)
- [ ] Unauthorized component tests pass (min 4 test cases)
- [ ] Tests use Angular TestBed with mocked `AuthService` and `Router`
- [ ] No real navigation happens in tests (Router is a spy)

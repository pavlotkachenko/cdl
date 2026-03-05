# Story 8.3 — Missing Guards & Post-Login Role Redirects

**Epic:** Route Security & Auth Hardening
**Priority:** HIGH
**Status:** TODO

## User Story
As an operator or carrier,
I want to be redirected to my dashboard after login,
and as a developer, I need role guards for operator and carrier roles to protect their routes.

## Context
`auth.guard.ts` defines guards for `driver`, `admin`, and `attorney/paralegal` roles,
but `operatorGuard` and `carrierGuard` are missing.
`LoginComponent.redirectBasedOnRole()` has no `case 'carrier'` or `case 'operator'` branch —
both would fall through to the default (`/driver/dashboard`), which is wrong.

## Scope

### `auth.guard.ts`
- Add `operatorGuard: CanActivateFn = roleGuard(['operator'])`
- Add `carrierGuard: CanActivateFn = roleGuard(['carrier'])`

### `login.component.ts`
- Add `case 'carrier': router.navigate(['/carrier/dashboard'])`
- Add `case 'operator': router.navigate(['/operator/dashboard'])`
- Remove `standalone: true` from `@Component` decorator (redundant in Angular 21)
- Convert constructor injection to `inject()` calls (Angular 21 convention)

## Acceptance Criteria
- [ ] Operator logs in → redirected to `/operator/dashboard`
- [ ] Carrier logs in → redirected to `/carrier/dashboard`
- [ ] Operator navigating to `/attorney/dashboard` → `/unauthorized`
- [ ] Carrier navigating to `/driver/dashboard` → `/unauthorized`
- [ ] No regression for existing driver/attorney/admin login redirects

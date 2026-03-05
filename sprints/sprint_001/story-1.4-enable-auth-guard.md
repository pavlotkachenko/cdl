# Story 1.4 — Enable AuthGuard on All Protected Routes

**Epic:** Sign-Up & Auth Flow Connectivity
**Priority:** CRITICAL
**Status:** DONE
**Depends on:** Stories 1.1, 1.2, 1.3 (sign-up flows must work before guarding routes)

## Goal
All role-specific dashboards and features are protected. Unauthenticated users are redirected to `/login`. Authenticated users are redirected to the originally requested URL after login.

## Protected routes (re-enable canActivate):
- `/driver/**`
- `/carrier/**`
- `/attorney/**`
- `/admin/**`
- `/paralegal/**`

## Public routes (must NOT be guarded):
- `/` (landing)
- `/login`
- `/register`
- `/signup`, `/signup/driver`, `/signup/carrier`
- `/forgot-password`, `/reset-password`
- `/plans`, `/about-us`, `/contact-us`, `/sign-in`

## Auth interceptor public endpoints — ensure all are listed:
- `POST /api/auth/signin`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`

## Acceptance Criteria
- [ ] `canActivate: [AuthGuard]` re-enabled on all 5 feature route groups in `app.routes.ts`
- [ ] Navigating to `/driver/dashboard` without token → redirect to `/login`
- [ ] After login, Angular Router returns user to originally requested URL (use `returnUrl` query param pattern)
- [ ] All public endpoints in `auth.interceptor.ts` allowlist verified (no BUG-001 repeat)
- [ ] E2E test: unauthenticated visit to `/carrier/dashboard` → `/login`
- [ ] E2E test: authenticated driver visits `/carrier/dashboard` → redirected (wrong role)
- [ ] Unit test: `isPublicEndpoint()` returns `true` for all 5 auth endpoints

## Implementation Notes
- `AuthGuard` already exists — just un-comment `canActivate` in `app.routes.ts`
- Verify `AuthGuard` uses `returnUrl` pattern:
  ```typescript
  this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  ```
- `LoginComponent` should read `returnUrl` and redirect after success
- Role guard (redirecting wrong-role users): nice-to-have but not blocking for MVP — can add in post-MVP

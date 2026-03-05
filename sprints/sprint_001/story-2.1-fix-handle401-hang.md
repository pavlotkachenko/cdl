# Story 2.1 — BUG-002: Fix handle401Error Infinite Hang

**Epic:** Critical Bug Fixes
**Priority:** CRITICAL
**Status:** DONE

## Problem
`handle401Error` in `auth.interceptor.ts` hangs forever when `refreshToken` is null.
The `refreshTokenSubject.pipe(filter(token => token !== null))` never emits, so the
HTTP observable never completes. Users are stuck on frozen screens.

## Scope (per HARD_BUGS_REGISTRY.md BUG-002)
File: `frontend/src/app/core/interceptors/auth.interceptor.ts`

Fix:
```typescript
if (refreshToken) {
  // existing refresh logic
} else {
  // No refresh token — fail immediately, redirect to login
  isRefreshing = false;
  authService.logout().subscribe();
  return throwError(() => new HttpErrorResponse({ status: 401 }));
}
```

Also:
- Reset `isRefreshing = false` on the error/catch path so it cannot get stuck at `true`
- Add timeout to `refreshTokenSubject` filter pipeline (e.g., `timeout(10000)`)

## Acceptance Criteria
- [ ] `handle401Error` with null refresh token emits error within 500ms (does not hang)
- [ ] `handle401Error` with `isRefreshing = true` and no prior refresh emits error
- [ ] Hitting protected endpoint with cleared localStorage → redirects to `/login` in <1s
- [ ] Previously `it.fails` unit test now passes
- [ ] Integration test: clear localStorage → hit protected endpoint → redirect, not hang

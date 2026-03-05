# Story 2.1 — BUG-002: Fix handle401Error Infinite Hang

**Epic:** Critical Bug Fixes
**Priority:** CRITICAL
**Status:** DONE
**File:** `frontend/src/app/core/interceptors/auth.interceptor.ts`

## Problem
When a 401 response arrives and no refresh token exists, `handle401Error()` subscribes to `refreshTokenSubject.pipe(filter(token => token !== null))` and waits forever. The HTTP observable never completes, Angular subscribe callbacks never fire, and the user is stuck on a frozen screen.

Additionally, `isRefreshing` is a module-level `let` variable that can get stuck at `true` across the app lifetime (e.g., if the refresh request was aborted), causing all subsequent 401s to hang.

## The Fix (from HARD_BUGS_REGISTRY.md BUG-002)

```typescript
// In handle401Error, after checking refreshToken:
if (refreshToken) {
  // ... existing refresh logic ...
} else {
  // No refresh token — don't wait forever, just fail immediately
  isRefreshing = false;
  authService.logout().subscribe();
  return throwError(() => new HttpErrorResponse({ status: 401 }));
}
```

Additionally:
- Add timeout to `refreshTokenSubject` filter pipeline (e.g., `timeout(10000)`) so it cannot hang forever
- Reset `isRefreshing = false` in the `catchError` of the refresh call

## Acceptance Criteria
- [ ] `handle401Error` with null/missing refresh token emits error within 500ms — does NOT hang
- [ ] `handle401Error` with `isRefreshing = true` and no prior refresh emits error (not hang)
- [ ] Clearing localStorage tokens and hitting a protected endpoint → redirect to `/login` in <1 second
- [ ] Previously `it.fails` unit test for this bug now passes
- [ ] Integration test: clear localStorage → hit `/api/driver/profile` → redirect to login, not hang
- [ ] `refreshTokenSubject` filter has a timeout of ≤15 seconds as safety net

## Files to modify
- `frontend/src/app/core/interceptors/auth.interceptor.ts`
- `frontend/src/app/__tests__/auth.interceptor.spec.ts` (or create if doesn't exist)

## Implementation Notes
- Only modify the null-refresh-token path — do not change the happy path refresh logic
- `authService.logout()` is fire-and-forget here — don't chain `.subscribe()` deeply
- The BUG-001 fix (adding `/auth/signin` to public list) already prevents login from hitting this; this fix covers ALL other protected endpoints when session expires

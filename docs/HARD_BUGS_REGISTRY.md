# Hard Bugs Registry

Bugs that took significant effort (3+ investigation cycles) to diagnose and fix.
Use this document to write regression tests and audit other modules for similar patterns.

---

## BUG-001: Auth Interceptor Missing `/auth/signin` in Public Endpoints

**Severity:** Critical (blocks all login error handling)
**Discovered:** 2026-03-03
**Files:**
- `frontend/src/app/core/interceptors/auth.interceptor.ts`

**Symptoms:**
- Login form stays stuck on "SIGNING IN..." after wrong password (401 response)
- `.error-alert` div never appears, snackbar never appears
- `loading` property never resets to `false`
- Successful logins and registrations also hung in certain sequences

**Root Cause:**
The `isPublicEndpoint()` function listed `/auth/login` but the actual API endpoint is `/auth/signin`. Because `/auth/signin` was not in the public list, the interceptor's `catchError` caught the 401 response and called `handle401Error()`. With no refresh token available (user isn't logged in), the code fell through to a `refreshTokenSubject.pipe(filter(token => token !== null))` that **waits forever** for a non-null token that never arrives. The HTTP observable never completed or errored, so Angular's subscribe callbacks never fired.

**The Fix:**
Added `'/auth/signin'` to the `publicEndpoints` array in `isPublicEndpoint()`.

**Detection Pattern — audit all modules for:**
```
# 1. Find all API endpoint URLs used by Angular services
grep -rn "this.http\.\(get\|post\|put\|delete\|patch\)" frontend/src/ --include="*.ts"

# 2. Compare against the public endpoints list in the interceptor
grep -A 15 "publicEndpoints" frontend/src/app/core/interceptors/auth.interceptor.ts

# 3. Find any auth-related endpoint that is NOT in the public list
# Every endpoint that can be called WITHOUT a token must be listed
```

**Test to write:**
- Unit test: call `isPublicEndpoint()` with every auth URL used in `AuthService` — all must return `true`
- E2E test: login with wrong password → error message appears within 5s
- E2E test: login with non-existent email → error message appears within 5s

---

## BUG-002: `handle401Error` Hangs Forever When No Refresh Token Exists

**Severity:** Critical (silent infinite hang)
**Discovered:** 2026-03-03 (discovered alongside BUG-001)
**Files:**
- `frontend/src/app/core/interceptors/auth.interceptor.ts` (lines 81-125, 161-197)

**Symptoms:**
- Any 401 response on a non-public endpoint causes the HTTP observable to hang indefinitely
- If `isRefreshing` is already `true` from a prior request, ALL subsequent 401s hang
- Module-level `isRefreshing` boolean persists across the entire app lifetime

**Root Cause:**
In `handle401Error()`, when `!isRefreshing` and `refreshToken` is falsy (null), execution falls through to the "wait for token refresh" block (lines 117-124). This block subscribes to `refreshTokenSubject` and filters for non-null values, but since no refresh was initiated, the subject never emits a non-null value. The observable hangs forever.

Additionally, `isRefreshing` is a module-level `let` variable (line 81). If it gets stuck at `true` (e.g., the refresh request was aborted when Cypress navigated away), every subsequent 401 goes straight to the hanging wait block.

**The Fix (partial):**
BUG-001 fix prevents login endpoints from hitting this code path. However, the underlying hang bug still exists for any non-public endpoint 401 when no refresh token is available.

**Recommended full fix:**
```typescript
// In handle401Error, after checking refreshToken:
if (refreshToken) {
  // ... existing refresh logic ...
} else {
  // No refresh token — don't wait forever, just fail
  isRefreshing = false;
  authService.logout().subscribe();
  return throwError(() => new HttpErrorResponse({ status: 401 }));
}
```

**Detection Pattern — audit for:**
```
# Find all RxJS filter() calls that could block indefinitely
grep -rn "filter.*!== null\|filter.*token" frontend/src/ --include="*.ts"

# Find module-level mutable state in interceptors/services
grep -rn "^let " frontend/src/ --include="*.ts"
```

**Test to write:**
- Unit test: `handle401Error` with null refresh token should emit error, not hang
- Unit test: `handle401Error` with `isRefreshing = true` and no prior refresh should emit error
- Integration test: clear localStorage tokens, then hit a protected endpoint → should redirect to login, not hang

---

## BUG-003: Supabase Admin Client Auth State Pollution (RLS Infinite Recursion)

**Severity:** Critical (breaks all DB queries after first login)
**Discovered:** 2026-03-03
**Files:**
- `backend/src/controllers/auth.controller.js`
- `backend/src/config/supabase.js`

**Symptoms:**
- First API call after server start works fine
- After any `signIn` call, subsequent DB queries fail with: `"infinite recursion detected in policy for relation 'users'"`
- Error appears on unrelated endpoints (registration, profile fetch, etc.)

**Root Cause:**
The backend used a single shared `supabase` client (created with the service role key) for everything. When `signInWithPassword()` was called on this client, it set an internal user session on the client object. All subsequent `.from('users')` queries then ran under RLS (Row Level Security) with that user's context instead of bypassing RLS via the service role. The RLS policies on the `users` table had circular references, causing "infinite recursion."

**The Fix:**
Created a separate `supabaseAnon` client for `signInWithPassword()` calls only. The main `supabase` admin client is never used for auth sign-in, keeping its service role session clean:

```javascript
const { supabase, supabaseAnon } = require('../config/supabase');
const authClient = supabaseAnon; // Only for signInWithPassword
// supabase (admin) is used for all .from() DB queries
```

**Detection Pattern — audit all modules for:**
```
# Find any signInWithPassword or signUp on the admin/service-role client
grep -rn "supabase\.auth\.signIn\|supabase\.auth\.signUp" backend/src/ --include="*.js"
# These should use supabaseAnon, never supabase (admin)

# Find shared singleton clients that might accumulate state
grep -rn "module\.exports.*supabase\|module\.exports.*client" backend/src/ --include="*.js"
```

**Test to write:**
- Integration test: call signIn, then immediately call register (or any DB query) → should succeed
- Integration test: call signIn 10 times in sequence → last DB query should succeed
- Unit test: after signInWithPassword, `supabase.auth.getSession()` on admin client should return null/service-role

---

## BUG-004: Database Enum Mismatch — `carrier` and `paralegal` Not in `user_role`

**Severity:** High (500 error on carrier/paralegal registration)
**Discovered:** 2026-03-02
**Files:**
- `backend/src/controllers/auth.controller.js`
- Database schema (`user_role` enum type)

**Symptoms:**
- Carrier registration returns 500 Internal Server Error
- Paralegal registration returns 500 Internal Server Error
- Driver, attorney, admin registration works fine
- Error in logs: `invalid input value for enum user_role: "carrier"`

**Root Cause:**
The API accepts 5 roles: `driver`, `carrier`, `attorney`, `admin`, `paralegal`. But the PostgreSQL `user_role` enum only defines 4 values: `driver`, `attorney`, `admin`, `operator`. Two mismatches:
1. `carrier` is not a valid DB enum value
2. `paralegal` maps to `operator` in the DB but the code tried to insert `paralegal`

The error was caught by a generic `catch` block that returned 500 without logging the actual constraint violation.

**The Fix:**
Created a `dbRole()` mapping function:
```javascript
const VALID_DB_ROLES = ['driver', 'attorney', 'admin', 'operator'];
function dbRole(role) {
  if (VALID_DB_ROLES.includes(role)) return role;
  if (role === 'carrier') return 'driver';
  if (role === 'paralegal') return 'operator';
  return 'driver';
}
```
The real role is stored in `user_metadata.role` and returned in API responses.

**Detection Pattern — audit all modules for:**
```
# Find all enum types in the database
# Run in psql: SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid;

# Find all hardcoded role/status/type strings in backend code
grep -rn "'driver'\|'carrier'\|'attorney'\|'admin'\|'paralegal'\|'operator'" backend/src/ --include="*.js"

# Find all INSERT/UPDATE that set enum columns
grep -rn "\.insert\|\.update\|\.upsert" backend/src/ --include="*.js"
```

**Test to write:**
- API test: register with each of the 5 roles → all should return 201
- API test: login after registering with each role → response should contain the original role
- Unit test: `dbRole()` returns valid DB enum for all 5 input roles

---

## BUG-005: Route Path Mismatch — `/app/` Prefix in Navigation

**Severity:** High (login redirect fails silently)
**Discovered:** 2026-03-02
**Files:**
- `frontend/src/app/core/services/auth.service.ts`
- `frontend/src/app/app.routes.ts`

**Symptoms:**
- After successful login, user stays on `/login` page
- No error in console — `router.navigate()` silently resolves to the catch-all route
- URL briefly flickers to `/app/driver/dashboard` then back to `/login`

**Root Cause:**
`AuthService.signIn()` navigated to `/app/driver/dashboard`, `/app/admin/dashboard`, etc. But the actual routes defined in `app.routes.ts` are `/driver/dashboard`, `/admin/dashboard` — no `/app/` prefix. The catch-all route `{ path: '**', redirectTo: '/login' }` silently redirected back to login.

**The Fix:**
Removed `/app/` prefix from all `router.navigate()` calls in `AuthService`:
```typescript
case 'driver': this.router.navigate(['/driver/dashboard']); break;
case 'admin':  this.router.navigate(['/admin/dashboard']);  break;
// etc.
```

**Detection Pattern — audit all modules for:**
```
# Extract all navigation targets
grep -rn "router\.navigate\|routerLink\|router\.navigateByUrl" frontend/src/ --include="*.ts" --include="*.html"

# Extract all defined routes
grep -rn "path:" frontend/src/app/*routing* frontend/src/app/app.routes.ts

# Cross-reference: every navigate target must exist as a defined route
```

**Test to write:**
- E2E test: login as each role → URL should contain the expected dashboard path
- Unit test: collect all `router.navigate()` arguments, verify each matches a route in `app.routes.ts`

---

## Summary Table

| ID | Title | Severity | Category | Key Pattern |
|----|-------|----------|----------|-------------|
| BUG-001 | Interceptor missing `/auth/signin` in public list | Critical | Config mismatch | Endpoint URL not in allowlist |
| BUG-002 | `handle401Error` hangs when no refresh token | Critical | Observable hang | `filter()` waiting forever |
| BUG-003 | Supabase admin client auth state pollution | Critical | Shared mutable state | Singleton client accumulates state |
| BUG-004 | DB enum mismatch for `carrier`/`paralegal` | High | Schema mismatch | API values vs DB enum |
| BUG-005 | Route paths with wrong `/app/` prefix | High | Config mismatch | Navigate target vs route definition |

---

## How to Use This Document

1. **Write regression tests** for each bug listed above (see "Test to write" sections)
2. **Run the detection patterns** against all modules to find similar latent issues
3. **Add new entries** when a bug takes 3+ cycles to diagnose — use the same format
4. **Review before each release** to ensure no regressions

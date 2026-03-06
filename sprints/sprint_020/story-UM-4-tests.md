# Story UM-4 — Tests: Sprint 020 Coverage

**Epic:** Platform Administration
**Sprint:** 020
**Priority:** HIGH
**Status:** DONE

## Test Files

### Backend

| File | Tests | Status |
|---|---|---|
| `backend/src/__tests__/admin.controller.test.js` | 11 | PASS |

#### admin.controller.test.js (11 tests)

- `getUsers` — returns mapped users list
- `getUsers` — applies role filter query param
- `getUsers` — applies status=active filter
- `inviteUser` — creates user and returns 201
- `inviteUser` — returns 400 when email is missing
- `inviteUser` — returns 409 when email already exists (`DUPLICATE_EMAIL` code)
- `changeUserRole` — updates role and returns updated user
- `changeUserRole` — returns 404 when user not found
- `changeUserRole` — returns 400 when trying to demote last admin (`LAST_ADMIN` code)
- `suspendUser` — sets is_active=false and returns suspended status
- `unsuspendUser` — sets is_active=true and returns active status

### Frontend

| File | Tests | Status |
|---|---|---|
| `frontend/src/app/core/services/admin.service.spec.ts` | 6 | PASS |
| `frontend/src/app/features/admin/user-management/user-management.component.spec.ts` | 12 | PASS |

#### admin.service.spec.ts (6 tests)

- `getAllUsers()` calls GET /admin/users
- `getAllUsers()` passes role and status as query params
- `inviteUser()` calls POST /admin/users/invite with email and role
- `changeUserRole()` calls PATCH /admin/users/:id/role
- `suspendUser()` calls PATCH /admin/users/:id/suspend
- `unsuspendUser()` calls PATCH /admin/users/:id/unsuspend

#### user-management.component.spec.ts (12 tests)

- loads users on init
- shows loading spinner while fetching
- filteredUsers() returns all users when no filter set
- filteredUsers() filters by search term (name match)
- filteredUsers() filters by role
- filteredUsers() filters by status
- clearFilters() resets all filters
- toggleInvite() shows and hides invite panel
- sendInvite() posts invite and reloads users
- suspend() calls PATCH suspend and reloads
- unsuspend() calls PATCH unsuspend and reloads
- getInitials() returns correct initials

## Test Results

```
Backend:  11/11 admin.controller tests pass
Frontend: 448/449 total pass (1 pre-existing socket.service failure, unrelated)
```

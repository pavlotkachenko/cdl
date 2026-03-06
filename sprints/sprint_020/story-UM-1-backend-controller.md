# Story UM-1 — Backend: Admin User Management Controller

**Epic:** Platform Administration
**Sprint:** 020
**Priority:** HIGH
**Status:** DONE

## User Story

As an admin,
I want backend endpoints to list, invite, change roles, and suspend users,
so I can manage all platform accounts from one place.

## Acceptance Criteria

- [x] `GET /api/admin/users` — returns all users with optional `?role=` and `?status=` filters
- [x] `POST /api/admin/users/invite` — creates a pending user; returns 409 if email already exists
- [x] `PATCH /api/admin/users/:id/role` — changes user role; returns 400 if demoting last admin
- [x] `PATCH /api/admin/users/:id/suspend` — sets `is_active=false`
- [x] `PATCH /api/admin/users/:id/unsuspend` — sets `is_active=true`
- [x] All routes protected by `[authenticate, authorize('admin')]`
- [x] Consistent error shape: `{ error: { code, message } }`
- [x] No stack traces in responses

## Files Modified

- `backend/src/controllers/admin.controller.js` — NEW: 5 exported handlers
- `backend/src/routes/admin.routes.js` — REPLACED placeholder with real routes

## Key Implementation Notes

- `getUsers`: maps `is_active` → `status` (`true`→`active`, `false`→`suspended`); pending users have `is_active=null`
- `inviteUser`: uses `maybeSingle()` to check for duplicate email before insert
- `changeUserRole`: two sequential `single()` calls (fetch target role → count admins if demoting → update)
- `suspendUser`/`unsuspendUser`: PATCH `is_active` field, map result back to `status` string

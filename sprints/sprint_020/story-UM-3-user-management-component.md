# Story UM-3 — Frontend: UserManagementComponent

**Epic:** Platform Administration
**Sprint:** 020
**Priority:** HIGH
**Status:** DONE

## User Story

As an admin,
I want a User Management page with invite, role change, and suspend/unsuspend controls,
so I can manage all platform users from the admin portal.

## Acceptance Criteria

- [x] Page at `/admin/users` lazy-loaded via `admin-routing.module.ts`
- [x] "Invite User" panel: email + role form, validation, sends POST invite, reloads list
- [x] Filter row: search by name/email, filter by role, filter by status, "Clear" button
- [x] User cards: avatar (initials), name, email, last login, role badge, status badge
- [x] Active users: role change select + "Suspend" button
- [x] Suspended users: role change select + "Unsuspend" button
- [x] Pending users: "Invite pending" label, no role change
- [x] Loading spinner while fetching
- [x] Empty state when no users match filters
- [x] StaffManagement "Add Staff" button navigates to `/admin/users` (was "coming soon" snackBar)

## Files Modified

- `frontend/src/app/features/admin/user-management/user-management.component.ts` — NEW
- `frontend/src/app/features/admin/admin-routing.module.ts` — added `/users` route
- `frontend/src/app/features/admin/staff-management/staff-management.component.ts` — fixed `addNewStaff()`

## Key Implementation Notes

- Angular 21: `inject()`, `signal()`, `computed()`, `OnPush`, `@if`/`@for`, `ReactiveFormsModule`
- `DatePipe` imported explicitly for `| date:'mediumDate'` in template
- `filteredUsers` computed signal applies search + role + status filters in sequence

# Sprint 020 — Admin User Management

**Epic:** Platform Administration
**Sprint:** 020
**Priority:** HIGH
**Status:** DONE

## Goal

Give admins full control over platform users: list all users, invite new users by email, change roles, and suspend/unsuspend accounts.

## Stories

| Story | Title | Priority | Status |
|---|---|---|---|
| [UM-1](story-UM-1-backend-controller.md) | Backend: admin.controller.js user management handlers | HIGH | DONE |
| [UM-2](story-UM-2-admin-service.md) | Frontend: AdminService user management methods | HIGH | DONE |
| [UM-3](story-UM-3-user-management-component.md) | Frontend: UserManagementComponent + routing | HIGH | DONE |
| [UM-4](story-UM-4-tests.md) | Tests: backend + frontend coverage | HIGH | DONE |

## Definition of Done (Sprint)

- [x] All 4 stories completed
- [x] Backend: 11 Jest tests pass for admin.controller
- [x] Frontend: 12 Vitest tests pass for UserManagementComponent + 6 for AdminService
- [x] All tests pass: `npx ng test --no-watch` + `cd backend && npm test`
- [x] Routes wired: `/admin/users` lazy-loads UserManagementComponent
- [x] StaffManagement "Add Staff" navigates to `/admin/users`

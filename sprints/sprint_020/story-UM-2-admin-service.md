# Story UM-2 — Frontend: AdminService User Management Methods

**Epic:** Platform Administration
**Sprint:** 020
**Priority:** HIGH
**Status:** DONE

## User Story

As a frontend developer,
I want typed Angular service methods for all user management endpoints,
so components can call them without duplicating HTTP logic.

## Acceptance Criteria

- [x] `PlatformUser` interface exported from `admin.service.ts`
- [x] `getAllUsers(role?, status?)` → `Observable<{ users: PlatformUser[] }>`
- [x] `inviteUser(email, role)` → `Observable<{ user: PlatformUser }>`
- [x] `changeUserRole(userId, role)` → `Observable<{ user: Pick<PlatformUser, 'id' | 'role'> }>`
- [x] `suspendUser(userId)` → `Observable<{ user: Pick<PlatformUser, 'id' | 'status'> }>`
- [x] `unsuspendUser(userId)` → `Observable<{ user: Pick<PlatformUser, 'id' | 'status'> }>`
- [x] No mock fallbacks — errors propagate to components

## Files Modified

- `frontend/src/app/core/services/admin.service.ts` — added `PlatformUser` interface + 5 methods

## PlatformUser Interface

```typescript
export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: 'driver' | 'carrier' | 'attorney' | 'admin' | 'operator' | 'paralegal';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLogin?: string | null;
}
```

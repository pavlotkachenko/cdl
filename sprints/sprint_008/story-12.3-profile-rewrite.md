# Story 12.3 — Profile Component Rewrite

**Sprint:** 008 — Driver Experience Modernization
**Status:** DONE

## Goal
Rewrite `profile.component.ts` to Angular 21. Replace `setTimeout` mocks with real API calls.

## Changes
- Removed: `standalone: true`, `Subject`/`takeUntil`, external template, `CommonModule`/`RouterModule`, constructor injection
- Added: `signal()`, `computed()`, `OnPush`, inline template, `inject()`
- `currentUser`, `editingProfile`, `editingPassword`, `savingProfile`, `savingPassword` are signals
- `fullName` and `memberSince` are `computed()`
- `saveProfile()` calls `authService.updateProfile()` (real HTTP) instead of `setTimeout` mock
- `savePassword()` calls `authService.changePassword()` (real HTTP) instead of `setTimeout` mock
- Added `updateProfile()` and `changePassword()` methods to `AuthService`

## Files
- `frontend/src/app/features/driver/profile/profile.component.ts`
- `frontend/src/app/core/services/auth.service.ts` (added `updateProfile`, `changePassword`)

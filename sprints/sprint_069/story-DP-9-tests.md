# Story: DP-9 — Tests

**Sprint:** sprint_069
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want comprehensive unit tests for the redesigned ProfileComponent and NotificationPreferencesService,
So that regressions are caught and all acceptance criteria are verified.

## Scope

### Files to Create/Modify
- `frontend/src/app/features/driver/profile/profile.component.spec.ts` (rewrite)
- `frontend/src/app/core/services/notification-preferences.service.spec.ts` (create)

### Database Changes
- None

## Acceptance Criteria

- [x] Test file created and all tests pass via `npx ng test --no-watch`
- [x] **Page structure tests:** 2-column layout renders, hero card renders, all 5 content cards render, toast area exists
- [x] **Hero card tests:** avatar renders (image or initials fallback), full name displayed, email with verified badge, member since chip, 3 stats display, 5 section nav links render, clicking nav link calls scrollToSection
- [x] **Profile information tests:** view mode shows 7 fields, Edit button toggles to edit mode, form pre-populated with user data, save calls updateProfile with all fields (name, phone, bio, cdl_number, cdl_state), cancel reverts form, invalid form shows toast, bio character counter updates
- [x] **Password & security tests:** password dots displayed, Change Password button expands form, form validation (required, minLength, mismatch), save calls changePassword, 2FA warning banner shown when no WebAuthn
- [x] **Notification preference tests:** 5 toggle rows render with correct titles, toggles have role="switch" and aria-checked, toggling calls updatePreference, optimistic update reverts on error, keyboard Enter/Space toggles
- [x] **Linked accounts tests:** 3 provider rows render, Apple shows "Coming Soon", Google/Facebook show Connect buttons, connected provider shows green badge
- [x] **Danger zone tests:** red-bordered card renders, Delete Account button shows confirmation modal, typing "DELETE" enables confirm button, confirm shows toast message, cancel closes modal
- [x] **Accessibility tests:** all toggles have role="switch" + aria-checked, emoji spans have aria-hidden="true", form inputs have labels, section headings use h2/h3, focus-visible styles exist
- [x] **Computed signal tests:** fullName, avatarUrl, memberSince, initials compute correctly
- [x] **Toast tests:** showToast sets message, auto-clears after timeout, success/error styling
- [x] **NotificationPreferencesService tests:** getPreferences calls GET, updatePreference calls PUT with correct payload

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `profile.component.ts` | `profile.component.spec.ts` | this story |
| `notification-preferences.service.ts` | `notification-preferences.service.spec.ts` | this story |

## Dependencies

- Depends on: DP-1, DP-2, DP-3, DP-4, DP-5, DP-6, DP-7
- Blocked by: none

## Notes

- Use `vi.fn()` for mocking service methods
- Use `of()` from rxjs to mock observable returns
- Use `fixture.debugElement.query(By.css(...))` for DOM assertions
- Helper pattern: `el(selector)`, `all(selector)`, `text(selector)` like Sprint 067/068
- Mock `window.open` and `document.getElementById` for nav tests
- Mock `AuthService`, `NotificationPreferencesService`, `Router`
- Target: ~65+ test cases
- Rewrite existing 6 tests to match new component structure

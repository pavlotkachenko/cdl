# Story: DP-1 — Component Modernization & Data Layer

**Sprint:** sprint_069
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want the ProfileComponent modernized to use external template/styles, remove Angular Material, and have all data signals and services wired up,
So that subsequent stories can build UI sections on a clean foundation.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/profile/profile.component.ts`

### Files to Create
- `frontend/src/app/features/driver/profile/profile.component.html` (replace inline template)
- `frontend/src/app/features/driver/profile/profile.component.scss` (replace inline styles)
- `frontend/src/app/core/services/notification-preferences.service.ts`

### Database Changes
- None (DP-8 handles backend)

## Acceptance Criteria

- [x] Remove ALL Angular Material imports: MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule, MatSnackBar
- [x] Switch from inline `template`/`styles` to external `templateUrl`/`styleUrl`
- [x] Keep: ReactiveFormsModule, FormBuilder, Validators, Router, AuthService
- [x] Add imports: DatePipe, CommonModule (if needed)
- [x] Add signals: `driverStats` (cases, winRate, avgDays), `notificationPrefs` (5 toggles), `emailVerified`, `expandedSection` (for section nav)
- [x] Add computed signals: `fullName`, `avatarUrl`, `memberSince`, `initials` (fallback when no avatar)
- [x] Create `NotificationPreferencesService` in `core/services/`:
  - `getPreferences()` → `GET /api/notifications/preferences`
  - `updatePreference(type: string, channel: string, enabled: boolean)` → `PUT /api/notifications/preferences`
- [x] Add `loadDriverStats()` method calling `GET /api/drivers/me/analytics`
- [x] Add `loadNotificationPrefs()` method
- [x] Replace MatSnackBar with signal-based toast: `toastMessage` signal + `showToast(msg)` method
- [x] Interfaces: `DriverStats`, `NotificationPref`, `ProfileSection`
- [x] Hardcoded data: `PROFILE_SECTIONS` (nav links), `NOTIFICATION_TYPES` (5 types)
- [x] `ngOnInit` loads user, stats, and notification prefs

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `profile.component.ts` | `profile.component.spec.ts` | DP-9 |
| `notification-preferences.service.ts` | `notification-preferences.service.spec.ts` | DP-9 |

## Dependencies

- Depends on: none
- Blocked by: none

## Notes

- This is a foundation story — the template will be minimal placeholder until DP-2 through DP-6 flesh it out
- Keep existing `profileForm` and `passwordForm` reactive forms
- Add `cdlNumber`, `cdlState`, `bio` fields to `profileForm`
- Toast replaces MatSnackBar: simple `<div>` with CSS transition, auto-dismiss after 3s

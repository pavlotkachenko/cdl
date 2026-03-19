# Story: DP-4 — Password & Security Card

**Sprint:** sprint_069
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to change my password and see my security status including 2FA,
So that I can keep my account secure.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/profile/profile.component.html`
- `frontend/src/app/features/driver/profile/profile.component.scss`
- `frontend/src/app/features/driver/profile/profile.component.ts` (minor — reuse existing password form)

### Database Changes
- None

## Acceptance Criteria

- [x] Card with `id="password-security"` for section nav scroll target
- [x] Header: `<span aria-hidden="true">🔒</span> Password & Security` (15px, font-weight 800)
- [x] Password display row:
  - Label "Password" with dots `••••••••••••`
  - "Change Password" button (teal outline, pill shape)
- [x] Clicking "Change Password" expands the password form:
  - Current Password (type="password")
  - New Password (type="password") with hint "At least 8 characters"
  - Confirm New Password (type="password")
  - Mismatch error shown inline
  - Save + Cancel buttons
- [x] Password form uses existing `passwordForm` FormGroup + `savePassword()` method
- [x] 2FA / WebAuthn status section:
  - If WebAuthn credentials exist: 🟢 "Biometric authentication enabled" with green badge
  - If no WebAuthn: ⚠️ amber warning banner "Two-factor authentication is not enabled. We recommend enabling biometric authentication for added security."
  - "Manage 2FA" link/button navigates to security settings (or just shows info for now)
- [x] All form inputs are custom styled — no Angular Material form fields
- [x] Password visibility toggle (eye icon) on each password field

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `profile.component.ts` | `profile.component.spec.ts` | DP-9 |

## Dependencies

- Depends on: DP-1
- Blocked by: none

## Notes

- Reuses existing `passwordForm`, `passwordMatchValidator`, `savePassword()`, `toggleEditPassword()`
- WebAuthn status can be checked via `GET /api/auth/webauthn/register/options` or by checking if user has credentials
- For MVP, 2FA section is informational — "Manage 2FA" can link to `/driver/settings` or show a tooltip
- Password visibility toggle: inline SVG eye/eye-off icon, toggles input type between "password" and "text"

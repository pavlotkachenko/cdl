# Story: DP-3 — Profile Information Card

**Sprint:** sprint_069
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to view and edit my profile information including CDL details and bio,
So that my account information is complete and up to date.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/profile/profile.component.html`
- `frontend/src/app/features/driver/profile/profile.component.scss`
- `frontend/src/app/features/driver/profile/profile.component.ts` (add CDL/bio to form)

### Database Changes
- None (DP-8 handles backend)

## Acceptance Criteria

- [x] Card with `id="profile-information"` for section nav scroll target
- [x] Header: `<span aria-hidden="true">👤</span> Profile Information` (15px, font-weight 800) + Edit button (teal, pill shape)
- [x] View mode — 2-column field grid:
  - Full Name (from `currentUser().name`)
  - Email + ✅ Verified badge (or ⚠️ Unverified)
  - Phone (with 📱 icon)
  - State / Region (from `cdlState`)
  - CDL License # (from `cdlNumber`)
  - Member Since (formatted date)
  - Bio (full width, italic if empty: "No bio added yet")
- [x] Each field: uppercase label (0.7rem, #8a94a6) + value below (15px, #0f2137)
- [x] Edit mode — reactive form with fields:
  - First Name + Last Name (2-column)
  - Email (disabled — not editable)
  - Phone (type="tel", inputmode="tel")
  - State / Region (text input or select)
  - CDL License # (text input)
  - Bio (textarea, max 500 chars, character counter)
- [x] Form validation: firstName + lastName required, phone optional, bio max 500
- [x] Save button: teal pill, shows spinner while saving
- [x] Cancel button: resets form to current user values
- [x] On save success: toast "Profile updated successfully", exit edit mode
- [x] On save error: toast "Failed to update profile", stay in edit mode
- [x] Custom form inputs — no Angular Material form fields

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `profile.component.ts` | `profile.component.spec.ts` | DP-9 |

## Dependencies

- Depends on: DP-1, DP-2
- Blocked by: DP-8 (for bio/CDL fields to persist — can stub until backend ready)

## Notes

- Email edit is disabled because changing email requires verification flow (out of scope)
- `cdlNumber` and `cdlState` exist in User interface (`core/models/index.ts`) but aren't in the current form
- Bio field is new — will be `''` until DP-8 migration adds the column
- 2-column grid at desktop, 1-column at mobile (768px breakpoint)

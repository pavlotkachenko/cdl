# Story: DP-6 — Linked Accounts & Danger Zone

**Sprint:** sprint_069
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver,
I want to see which social accounts are linked and have the option to delete my account,
So that I can manage my connected services and account lifecycle.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/profile/profile.component.html`
- `frontend/src/app/features/driver/profile/profile.component.scss`
- `frontend/src/app/features/driver/profile/profile.component.ts`

### Database Changes
- None (backend deferred)

## Acceptance Criteria

### Linked Accounts
- [x] Card with `id="linked-accounts"` for section nav scroll target
- [x] Header: `<span aria-hidden="true">🔗</span> Linked Accounts` (15px, font-weight 800)
- [x] 3 account rows:
  1. 🍎 Apple — "Connected" (green badge) or "Connect" button (currently static display only)
  2. Google (inline SVG logo) — "Connect" button
  3. Facebook (inline SVG logo) — "Connect" button
- [x] Each row: icon + provider name + email/status on left, Connect/Disconnect button on right
- [x] Connect buttons call `authService.signInWithGoogle()` / `signInWithFacebook()` for now
- [x] Apple row shows "Coming Soon" badge instead of connect button
- [x] Connected accounts show green ✅ badge + "Connected" text
- [x] Disconnect is not functional yet — show tooltip "Contact support to unlink"

### Danger Zone
- [x] Card with `id="danger-zone"` for section nav scroll target
- [x] Red-bordered card (`border: 2px solid var(--red-border)`, light red background)
- [x] Header: `<span aria-hidden="true">⚠️</span> Danger Zone` (15px, font-weight 800, red color)
- [x] Description: "Once you delete your account, there is no going back. Please be certain."
- [x] "Delete Account" button: red background, white text, pill shape
- [x] Clicking shows confirmation dialog (custom modal, not browser confirm):
  - "Are you sure you want to delete your account?"
  - "This action cannot be undone. All your data including cases, documents, and payment history will be permanently deleted."
  - Type "DELETE" to confirm (input field)
  - Cancel + Confirm buttons
- [x] Confirm button disabled until user types "DELETE"
- [x] On confirm: show toast "Account deletion request submitted. Our team will process this within 48 hours." (no backend action yet)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `profile.component.ts` | `profile.component.spec.ts` | DP-9 |

## Dependencies

- Depends on: DP-1
- Blocked by: none (UI only — backend deferred)

## Notes

- Linked accounts are UI-only for now — actual connect/disconnect requires Supabase identity linking (separate sprint)
- Account deletion is UI-only — backend endpoint deferred pending data retention policy
- The confirmation modal is inline in the template (not a separate component), controlled by `showDeleteConfirm` signal
- Google/Facebook SVG logos are inline (small, ~20px)

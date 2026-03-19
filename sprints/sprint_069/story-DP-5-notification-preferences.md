# Story: DP-5 — Notification Preferences Card

**Sprint:** sprint_069
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver,
I want to manage my notification preferences for different types of alerts,
So that I only receive notifications I care about.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/profile/profile.component.html`
- `frontend/src/app/features/driver/profile/profile.component.scss`
- `frontend/src/app/features/driver/profile/profile.component.ts`

### Files Created in DP-1
- `frontend/src/app/core/services/notification-preferences.service.ts`

### Database Changes
- None (backend `notification_preferences` table already exists from migration 005)

## Acceptance Criteria

- [x] Card with `id="notifications"` for section nav scroll target
- [x] Header: `<span aria-hidden="true">🔔</span> Notification Preferences` (15px, font-weight 800)
- [x] Subtitle: "Choose how you want to be notified"
- [x] 5 toggle rows, each with:
  - Emoji icon + title + description on left
  - Toggle switch on right with `role="switch"`, `aria-checked`, `tabindex="0"`
- [x] Toggle rows:
  1. 📋 Case Updates — "Get notified when your case status changes"
  2. 💬 Attorney Messages — "Receive alerts for new messages from your attorney"
  3. 💳 Payment & Billing — "Notifications about payments, invoices, and billing"
  4. ⚖️ Court Reminders — "Reminders about upcoming court dates and deadlines"
  5. 📢 Marketing & Tips — "Occasional tips, offers, and product updates"
- [x] Toggle loads initial state from `GET /api/notifications/preferences`
- [x] Toggling calls `PUT /api/notifications/preferences` with optimistic UI update
- [x] On API error: revert toggle, show toast "Failed to update preference"
- [x] Toggle animation: pill slides left/right, background color changes (grey → teal)
- [x] Keyboard support: Enter/Space toggles, focus-visible outline
- [x] Loading state: skeleton rows while preferences load

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `profile.component.ts` | `profile.component.spec.ts` | DP-9 |
| `notification-preferences.service.ts` | `notification-preferences.service.spec.ts` | DP-9 |

## Dependencies

- Depends on: DP-1
- Blocked by: none

## Notes

- Backend mapping: `case_update` → Case Updates, `message_received` → Attorney Messages, `payment_received` → Payments, `court_reminder` → Court Reminders, `marketing` → Marketing (may need to add this type)
- The backend stores per-channel preferences (email, sms, in_app, push). For simplicity, the toggle controls all channels at once (or just `in_app` + `push`)
- Toggle component is inline (not a separate component) — matches Sprint 068 billing toggle pattern
- `NOTIFICATION_TYPES` array is hardcoded in the component TS

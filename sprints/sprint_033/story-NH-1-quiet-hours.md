# Story NH-1 — Quiet Hours Enforcement (SMS + Push)

**Sprint:** 033 — Notification Hygiene + CSA Score
**Priority:** P1
**Status:** DONE

## User Story

As Miguel (driver),
I want notifications to stop between 9pm and 8am,
so I'm not woken up by case updates in the middle of the night.

## Scope

### `backend/src/services/sms.service.js` — UPDATED

New helper `isQuietHours(userId)`:
- Queries `notification_preferences` for user's `quiet_hours_start` and `quiet_hours_end` (defaults: `'21:00'` / `'08:00'`)
- Compares against current UTC time (or user timezone if stored)
- Returns `true` if within quiet hours

All send functions (`sendSms`, `sendCaseSubmissionSms`, `sendAttorneyAssignedSms`, `sendStatusChangeSms`, `sendPaymentReminderSms`) wrap send in:
```js
if (await isQuietHours(userId)) return { queued: true }; // skip, not queued for MVP
```
Exception: payment reminders always send (financial, scheduled at 9am by cron).

### `backend/src/services/onesignal.service.js` — UPDATED

`notifyUser(userId, ...)` and `sendPushNotification(...)`:
- Check `isQuietHours(userId)` (same helper, extracted to `notification.utils.js`)
- If quiet: return early with `{ skipped: 'quiet_hours' }`

### `backend/src/services/notification.utils.js` — CREATED

Shared helper: `isQuietHours(userId, supabase)` — single source of truth used by both SMS and push services.

### Frontend — no changes needed

Preferences UI already exists in notification preferences component (sprint 029).

## Acceptance Criteria

- [x] SMS not sent during user's configured quiet hours
- [x] Push notification not sent during quiet hours
- [x] Default quiet hours: 9pm–8am if user has no preference set
- [x] Payment reminders bypass quiet hours (scheduled at safe time by cron)
- [x] Quiet hours calculated correctly across midnight (e.g., 21:00–08:00)

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `notification.utils.js` | `notification.utils.test.js` | DONE |
| `sms.service.js` (quiet hours) | `sms.service.test.js` | DONE |
| `onesignal.service.js` (quiet hours) | `onesignal.service.test.js` | DONE |

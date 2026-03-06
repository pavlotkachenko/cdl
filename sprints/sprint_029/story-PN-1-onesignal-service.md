# Story PN-1 — OneSignal Backend Service

**Sprint:** 029 — Push Notifications
**Status:** DONE

## User Story

As Miguel (driver),
I want to receive a push notification on my phone when my case status changes,
so I don't have to keep opening the app to check.

## Changes

### `backend/src/services/onesignal.service.js` — CREATED

Key functions:
- `sendPushNotification(playerIds, title, body, data)` — posts to OneSignal REST API; no-ops gracefully when `ONESIGNAL_APP_ID` / `ONESIGNAL_API_KEY` env vars are absent
- `notifyUser(userId, title, body, data)` — looks up user's `push_token` from DB, delegates to `sendPushNotification`; returns silently if user has no token

Guard pattern: all OneSignal calls are wrapped in env-var check so local dev without credentials is unaffected.

## Acceptance Criteria

- [x] `sendPushNotification` posts to OneSignal REST API with correct headers
- [x] `notifyUser` looks up `push_token` from `users` table before sending
- [x] Both functions return silently (no throw) when env vars absent
- [x] Both functions return silently when user has no `push_token`

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `onesignal.service.js` | `onesignal.service.test.js` | ✅ |

# Story PN-6 — Tests

**Sprint:** 029 — Push Notifications
**Status:** DONE

## Scope

10 new backend tests + 13 new frontend tests covering all PN-1 through PN-5 changes.

## Backend Tests

### `backend/src/__tests__/onesignal.service.test.js` — CREATED (~6 tests)
- `sendPushNotification`: posts to OneSignal API with correct headers and body
- `sendPushNotification`: no-ops when `ONESIGNAL_APP_ID` absent
- `notifyUser`: looks up `push_token` from DB and delegates to `sendPushNotification`
- `notifyUser`: returns silently when user has no `push_token`
- `notifyUser`: returns silently when DB lookup fails

### `backend/src/__tests__/push.token.test.js` — CREATED (~4 tests)
- `PATCH /api/users/me/push-token`: updates `push_token` for authenticated user
- `PATCH /api/users/me/push-token`: returns 400 when `push_token` missing
- `PATCH /api/users/me/push-token`: returns 401 without JWT
- `PATCH /api/users/me/push-token`: handles DB error gracefully

## Frontend Tests

### `push-notification-prompt.component.spec.ts` — CREATED
- Component creates without errors
- Banner hidden when `Notification.permission === 'granted'`
- Banner shown when permission is `'default'`
- "Enable" button calls `requestPermission`
- "Dismiss" sets localStorage and hides banner

### `notification-preferences.component.spec.ts` — UPDATED (full rewrite)
- Component creates without errors
- Push toggle calls push-token endpoint
- SMS toggle calls user preferences endpoint
- Saving signal true during API call, false after

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `onesignal.service.js` | `onesignal.service.test.js` | ✅ |
| `user.routes.js` push-token | `push.token.test.js` | ✅ |
| `push-notification-prompt.component.ts` | `push-notification-prompt.component.spec.ts` | ✅ |
| `notification-preferences.component.ts` | `notification-preferences.component.spec.ts` | ✅ |

## Totals

- Backend: 258/258 pass (+10 new)
- Frontend: 581/581 pass (+13 new)

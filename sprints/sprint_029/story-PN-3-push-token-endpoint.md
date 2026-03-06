# Story PN-3 — Push Token Storage Endpoint

**Sprint:** 029 — Push Notifications
**Status:** DONE

## User Story

As the mobile frontend,
I need to store the OneSignal player ID against the authenticated user,
so the backend knows where to send push notifications.

## Changes

### `backend/src/routes/user.routes.js` — UPDATED

New endpoint:
```
PATCH /api/users/me/push-token
Body: { push_token: string }
Auth: verifyToken
```

Updates `users.push_token` column for `req.user.id`. Returns `{ success: true }`.

## Acceptance Criteria

- [x] `PATCH /api/users/me/push-token` updates `push_token` for authenticated user
- [x] Returns 400 if `push_token` is missing from body
- [x] Returns 401 if no JWT provided
- [x] Endpoint protected by `verifyToken` middleware

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `user.routes.js` (push-token endpoint) | `push.token.test.js` | ✅ |

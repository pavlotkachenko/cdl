# Story PN-4 — Push Notification Prompt Component (Driver)

**Sprint:** 029 — Push Notifications
**Status:** DONE

## User Story

As Miguel (driver),
I want a prompt on my dashboard asking if I want push notifications,
so I can opt in with one tap without hunting through settings.

## Changes

### `frontend/src/app/features/driver/push-notification-prompt/push-notification-prompt.component.ts` — CREATED

- Banner component shown on driver dashboard when `Notification.permission === 'default'`
- "Enable Notifications" button calls `Notification.requestPermission()`
- On grant: initialises OneSignal, retrieves player ID, calls `PATCH /api/users/me/push-token`
- "Dismiss" button hides banner and sets `localStorage` key — not shown again
- Uses `UserPreferencesService` for token storage call
- Hidden on browsers that don't support the Notifications API

### `frontend/src/app/features/driver/driver-dashboard/driver-dashboard.component.ts` — UPDATED

Embeds `<app-push-notification-prompt>` at top of dashboard template, guarded by `@if (showPushPrompt())`.

## Acceptance Criteria

- [x] Banner shown only when `Notification.permission === 'default'`
- [x] "Enable" triggers browser permission prompt
- [x] On grant: player ID sent to `PATCH /api/users/me/push-token`
- [x] "Dismiss" hides banner permanently (localStorage)
- [x] Banner not shown on non-supporting browsers (SSR safe)

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `push-notification-prompt.component.ts` | `push-notification-prompt.component.spec.ts` | ✅ |

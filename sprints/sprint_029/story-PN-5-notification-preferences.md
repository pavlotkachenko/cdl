# Story PN-5 — Notification Preferences Component Rewrite

**Sprint:** 029 — Push Notifications
**Status:** DONE

## User Story

As any user,
I want a single settings screen to toggle push notifications and SMS separately,
so I control exactly how I'm contacted.

## Changes

### `frontend/src/app/features/.../notification-preferences.component.ts` — REWRITTEN

Full Angular 21 rewrite (signals, OnPush, `inject()`, native `@if`/`@for`):

- **Previous:** used `Subject`/`takeUntil`, constructor injection, `*ngIf`
- **New:** signals for `pushEnabled`, `smsEnabled`, `saving`; `inject()` for services; OnPush

New capabilities added:
- Push notification toggle — calls `PATCH /api/users/me/push-token` (clear token to disable)
- SMS toggle — calls `PATCH /api/users/me` to update `sms_notifications_enabled`
- Persists preferences on toggle (debounced 500ms)

### Files deleted (replaced by rewrite):
- `notification-preferences.component.html` (329 lines → inlined template)
- `notification-preferences.component.scss` (263 lines → scoped styles in component)

## Acceptance Criteria

- [x] Push toggle reflects current `Notification.permission` state on load
- [x] SMS toggle reflects `user.sms_notifications_enabled` on load
- [x] Toggling push sends `PATCH /api/users/me/push-token`
- [x] Toggling SMS sends `PATCH /api/users/me`
- [x] Saving spinner shown during API calls
- [x] Component uses Angular 21 patterns (signals, OnPush, inject)

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `notification-preferences.component.ts` | `notification-preferences.component.spec.ts` | ✅ |

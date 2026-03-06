# Story PN-2 — Case Lifecycle Push Triggers

**Sprint:** 029 — Push Notifications
**Status:** DONE

## User Story

As Miguel (driver),
I want a push notification when my case is created, my attorney is assigned, and my case status changes,
so I always know what's happening in real time.

## Changes

### `backend/src/controllers/case.controller.js` — UPDATED

Added non-blocking `notifyUser` calls (same fire-and-forget pattern as email):
- `createCase` — notifies driver: "Case submitted successfully"
- `assignToAttorney` — notifies driver: "Attorney assigned to your case"; notifies attorney: "New case assigned"
- `changeStatus` — notifies driver with new status label

All calls wrapped in `try/catch` — a push failure never blocks the API response.

## Acceptance Criteria

- [x] Case creation triggers push to driver
- [x] Attorney assignment triggers push to driver and attorney
- [x] Status change triggers push to driver
- [x] Push failure does not cause API error response

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `case.controller.js` (push triggers) | existing `case.controller.test.js` | ✅ |

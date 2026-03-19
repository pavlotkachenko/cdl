# Story: NR-9 — WebSocket Realtime

**Sprint:** sprint_070
**Priority:** P1
**Status:** DONE

## User Story

As a driver,
I want new notifications to appear in real time without refreshing the page,
so that I am always up to date on case changes and messages.

## Acceptance Criteria

- [x] Call `NotificationService.connectWebSocket()` in `ngOnInit`, passing the user's JWT token
- [x] New notifications arriving via WebSocket are auto-prepended to the top of the list
- [x] Unread counter updates immediately when a new notification arrives
- [x] Summary card counts update reactively on new notification arrival
- [x] Toast/snackbar notification shown when a new notification arrives (brief, non-blocking)
- [x] WebSocket disconnects cleanly on `ngOnDestroy`
- [x] Reconnection uses existing exponential backoff logic in NotificationService
- [x] New notifications respect the current filter — if viewing "Read" tab, a new unread notification updates counts but doesn't appear in the visible list until switching to "All" or "Unread"

## Technical Notes

- The existing `NotificationService` already has `connectWebSocket(token)` and `disconnectWebSocket()` methods
- Subscribe to the service's notification stream (likely an Observable or callback) and update the `notifications` signal
- Prepend new notifications: `this.notifications.update(list => [newNotification, ...list])`
- Toast can use a simple CSS-animated element or the existing snackbar pattern in the app
- Ensure the component implements `OnDestroy` and calls `disconnectWebSocket()` in `ngOnDestroy`
- The exponential backoff reconnection is handled internally by the service — no component-level retry logic needed

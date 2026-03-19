# Story: NR-6 — Interactive Actions

**Sprint:** sprint_070
**Priority:** P0
**Status:** DONE

## User Story

As a driver,
I want to mark notifications as read or delete them with quick actions,
so that I can manage my notification list efficiently.

## Acceptance Criteria

- [x] Hover-reveal action buttons on each notification item:
  - "Mark Read" button with green checkmark (✓) icon
  - "Delete" button with red trash icon
- [x] Mark-as-read action:
  - Calls `notificationService.markAsRead(id)`
  - Instantly dims the item (applies read styling)
  - Removes the "NEW" pill badge
  - Updates all counters (unread count, read count) and summary card values
- [x] Delete action:
  - Calls `notificationService.deleteNotification(id)`
  - Removes the item from the list
  - Updates all counters and summary card values
- [x] "Mark All Read" button (from NR-2 header):
  - Calls `notificationService.markAllAsRead()`
  - Updates all notification items to read state
  - Resets unread counter to 0
  - Updates all summary card counts
- [x] All summary card counts are reactive via `computed()` signals — no manual counter management
- [x] Action buttons have appropriate aria-labels (e.g., "Mark notification as read", "Delete notification")

## Technical Notes

- Hover-reveal: buttons are hidden by default, shown on `:hover` of the notification item
- On touch devices, buttons should always be visible (no hover state) — use `@media (hover: hover)` to detect
- The `computed()` signals for counts automatically update when the `notifications` signal changes
- Service calls should be optimistic — update UI immediately, handle errors with rollback if needed
- "Mark All Read" should batch-update the notifications array in a single signal update

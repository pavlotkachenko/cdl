# Story OP-2: Operator Notifications Page

## Status: DONE

## Description
Create an operator notifications page following the same pattern as the attorney
notifications component. Features: notification list with type-based icons, mark as read,
mark all as read, unread count badge.

## Changes
- **`operator-notifications/operator-notifications.component.ts`**: New component
  - Mock data with operator-relevant notifications (case assignments, approval status, SLA warnings)
  - Type-based icon and color styling (info/warning/success/error)
  - Click to mark individual notification as read
  - "Mark All Read" button when unread exist
  - Unread count banner
  - Keyboard accessible (Enter key support)
  - TranslateModule with OPR.* keys
  - OnPush change detection, signals

## Acceptance Criteria
- [x] Shows list of notifications with type-based icons
- [x] Clicking a notification marks it as read
- [x] "Mark All Read" button clears all unread
- [x] Unread banner shows count
- [x] Empty state when no notifications
- [x] All text uses OPR.* translation keys

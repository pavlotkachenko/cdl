# Story CN-1: Carrier Notifications Page

**Status:** DONE

## Description
New notifications page for the carrier portal with unread badge, mark-all-read action,
and notification cards styled by type (info, warning, success, error).

## Acceptance Criteria
- [x] Unread count banner with "Mark All Read" button
- [x] Notification cards with type-colored icons
- [x] Unread cards have blue left border + background tint
- [x] Click to mark individual notification as read
- [x] Signals + OnPush + standalone component
- [x] Route: `/carrier/notifications` (lazy-loaded)

## Files Changed
- `frontend/src/app/features/carrier/notifications/carrier-notifications.component.ts` — new component
- `frontend/src/app/features/carrier/carrier-routing.module.ts` — added notifications route

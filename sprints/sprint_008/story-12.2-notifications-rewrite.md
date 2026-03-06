# Story 12.2 — Notifications Component Rewrite

**Sprint:** 008 — Driver Experience Modernization
**Status:** DONE

## Goal
Rewrite `notifications.component.ts` to Angular 21 standards.

## Changes
- Removed: `standalone: true`, `Subject`/`takeUntil`, external template, `CommonModule`/`RouterModule`, `ReactiveFormsModule`
- Added: `signal()`, `computed()`, `OnPush`, inline template
- `notifications`, `unreadCount`, `loading`, `selectedFilter`, `selectedType` are signals
- `filteredNotifications` is `computed()` from all filter signals
- Subscribes to `notificationService.notifications$` and `unreadCount$` for live updates
- Calls `getNotifications()` in `ngOnInit` to fetch from server (was missing in legacy)
- Fixed: `markAsRead()`, `markAllAsRead()`, `deleteNotification()` now subscribe to their observables (legacy never subscribed, so HTTP calls never fired)

## File
`frontend/src/app/features/driver/notifications/notifications.component.ts`

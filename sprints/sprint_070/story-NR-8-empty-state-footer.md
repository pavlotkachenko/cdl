# Story: NR-8 — Empty State & Footer

**Sprint:** sprint_070
**Priority:** P1
**Status:** DONE

## User Story

As a driver,
I want to see a helpful empty state when I have no notifications and a footer with useful links,
so that the page never feels broken and I can always navigate to preferences.

## Acceptance Criteria

- [x] Empty state displays when the filtered notification list is empty:
  - 72px emoji icon (🔔) centered
  - Title text (e.g., "No notifications")
  - Context-aware subtitle that changes based on the active filter:
    - All: "You're all caught up! No notifications to show."
    - Unread: "No unread notifications. You've read them all!"
    - Read: "No read notifications yet."
    - Action Needed: "No action items right now. Check back later."
- [x] Empty state is visually centered in the content area
- [x] Footer section at the bottom of the page:
  - "Showing X notifications" count text
  - Teal-colored "Manage notification preferences →" link
  - Preferences link routes to `/driver/settings/notifications`
- [x] Footer count updates reactively when notifications are added/removed
- [x] Empty state emoji wrapped in `<span aria-hidden="true">`

## Technical Notes

- The empty state appears when `filteredNotifications().length === 0`
- Footer is always visible (even when empty state shows — count would be "Showing 0 notifications")
- Use `@if` control flow to conditionally render empty state vs notification list
- Preferences link uses `routerLink` directive
- The subtitle is determined by a computed value or a method that checks `selectedFilter()`

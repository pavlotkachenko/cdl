# Story: NR-4 — Date-Grouped List

**Sprint:** sprint_070
**Priority:** P0
**Status:** DONE

## User Story

As a driver,
I want my notifications grouped by date,
so that I can easily see which notifications are recent and which are older.

## Acceptance Criteria

- [x] Notifications grouped into 4 date sections:
  - "Today" — notifications from the current calendar day
  - "Yesterday" — notifications from the previous calendar day
  - "Earlier this week" — notifications from the current week (Mon-Sun) excluding today and yesterday
  - "Older" — all notifications before the current week
- [x] Each section has a date header with a divider line
- [x] Each section header shows a count label (e.g., "Today (3)")
- [x] Grouping is computed dynamically from `createdAt` relative to the current date (not hardcoded dates)
- [x] Empty groups are not displayed
- [x] Groups update reactively when notifications change (e.g., after deletion or new notification arrives)
- [x] **Hidden requirement:** Use `computed()` signal for reactive grouping — not imperative code in methods

## Technical Notes

- Create a `groupedNotifications` computed signal that derives from `filteredNotifications`
- Grouping logic:
  ```
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = startOfDay(subDays(now, 1));
  const startOfWeek = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  ```
- Use simple date comparison — no need for date-fns library, native Date is sufficient
- The computed signal returns an array of `{ label: string, notifications: Notification[] }` objects
- Section headers use `<h2>` for semantic structure

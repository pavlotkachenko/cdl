# Story: NR-2 — Page Header & Summary Cards

**Sprint:** sprint_070
**Priority:** P0
**Status:** DONE

## User Story

As a driver,
I want a clear page header with summary cards showing notification counts,
so that I can quickly see how many notifications need my attention and filter by category.

## Acceptance Criteria

- [x] Page header displays "Notifications" title
- [x] Red "N unread" pill badge next to the title showing unread count
- [x] Subtitle text below the title (e.g., "Stay updated on your cases and messages")
- [x] "Preferences" button in header area
- [x] "Mark All Read" teal-bordered button in header area
- [x] 4 clickable summary cards rendered in a row:
  - All: emoji 🔔, neutral styling, shows total count
  - Unread: emoji 🔴, red count styling, shows unread count
  - Read: emoji ✅, green count styling, shows read count
  - Action Needed: emoji ⏰, amber count styling, shows action-needed count
- [x] Clicking a summary card updates the `selectedFilter` signal to the corresponding filter
- [x] Active/selected card has distinct visual styling (e.g., border highlight)
- [x] **Hidden requirement:** "Action Needed" count = notifications where `priority === 'high'` OR `type === 'court_reminder'`

## Technical Notes

- Summary card counts should be `computed()` signals derived from the `notifications` signal
- `actionNeededCount` computed: `notifications().filter(n => n.priority === 'high' || n.type === 'court_reminder').length`
- `selectedFilter` signal type: `'all' | 'unread' | 'read' | 'action_needed'`
- Cards should be responsive — stack vertically on small screens (see NR-7 for breakpoints)
- All emojis must be wrapped in `<span aria-hidden="true">` for accessibility

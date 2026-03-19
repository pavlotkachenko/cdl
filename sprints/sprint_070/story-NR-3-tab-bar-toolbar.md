# Story: NR-3 — Tab Bar & Toolbar

**Sprint:** sprint_070
**Priority:** P0
**Status:** DONE

## User Story

As a driver,
I want a tab bar to quickly switch between All, Unread, and Read notifications,
so that I can focus on the notifications that matter most.

## Acceptance Criteria

- [x] Pill-group tab bar with 3 tabs: All, Unread, Read
- [x] Each tab shows a count badge:
  - All: gray badge with total count
  - Unread: red badge with unread count
  - Read: green badge with read count
- [x] Active tab has filled pill styling (teal background, white text)
- [x] Inactive tabs have outlined pill styling
- [x] Clicking a tab updates the `selectedFilter` signal (same signal as summary cards)
- [x] "Clear All" ghost button with trash icon to the right of tabs
- [x] Settings icon button (gear icon) to the right of "Clear All"
- [x] Tab state stays in sync with summary card selection from NR-2

## Technical Notes

- The tab bar and summary cards share the same `selectedFilter` signal
- "Clear All" triggers a confirmation or directly calls delete-all (implementation detail for NR-6)
- Settings icon navigates to `/driver/settings/notifications`
- Tabs are rendered as `<button>` elements with `role="tab"` inside a container with `role="tablist"`
- Count badges are `<span>` elements styled as pills

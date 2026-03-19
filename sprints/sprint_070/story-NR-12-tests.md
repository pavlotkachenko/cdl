# Story: NR-12 — Tests

**Sprint:** sprint_070
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want comprehensive tests for the redesigned Notifications page,
so that all features are verified and regressions prevented.

## Acceptance Criteria

- [x] ~55 test cases covering all NR-1 through NR-11 stories
- [x] Page structure: renders page header, summary cards, toolbar, notification list
- [x] Summary cards: render 4 cards with correct counts, click-to-filter updates selectedFilter
- [x] Tab switching: All/Unread/Read tabs update filter, active tab highlighted
- [x] Date grouping: notifications grouped into Today/Yesterday/Earlier/Older sections
- [x] Notification items: unread shows colored bar + NEW pill, read shows dimmed state
- [x] Type chips: correct chip text and color per notification type
- [x] CTA links: correct label per type (View Case, Reply to Message, etc.)
- [x] Mark-as-read: calls service, dims item, removes NEW pill, updates counters
- [x] Delete: calls service, removes item from list
- [x] Mark All Read: calls service, updates all items
- [x] Empty state: renders with correct message per active filter
- [x] Footer: shows notification count and preferences link
- [x] Computed signals: filteredNotifications, groupedNotifications, actionNeededCount
- [x] WebSocket: mock new notification prepend, counter update
- [x] Case grouping: collapsed card shows badge, expands on click
- [x] Batch select: checkbox toggles selection, Select All works, bulk actions fire
- [x] Accessibility: aria-hidden on emojis, aria-label on buttons, h2 headings, role="list"
- [x] scrollIntoView mocked (jsdom doesn't implement it)

## Technical Notes

- Use Vitest (vi) with Angular TestBed
- Mock NotificationService with BehaviorSubject for notifications$ and unreadCount$
- Mock Router for navigation assertions
- Use `Element.prototype.scrollIntoView = vi.fn()` in beforeEach
- Mock WebSocket connection (service.connectWebSocket)
- Test file: `notifications.component.spec.ts` (co-located)

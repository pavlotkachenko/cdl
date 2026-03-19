# Story: NR-5 — Notification Items

**Sprint:** sprint_070
**Priority:** P0
**Status:** DONE

## User Story

As a driver,
I want each notification to clearly show its type, status, and a relevant action,
so that I can understand and act on notifications at a glance.

## Acceptance Criteria

- [x] Each notification item has a colored left border bar by type:
  - `case_update` — blue
  - `message` — teal
  - `payment` — green
  - `court_reminder` — amber
  - Read items — transparent (no bar)
- [x] Compound emoji icon with an SVG corner badge:
  - `case_update` — update icon (↻)
  - `payment` — checkmark icon (✓)
  - `message` — plus icon (+)
  - Other types — appropriate badge
- [x] Type chip in matching color with label:
  - `case_update` — "Case Update" (blue)
  - `message` — "Message" (teal)
  - `payment` — "Payment" (green)
  - `court_reminder` — "Action Needed" (amber)
  - `resolved` — "Resolved" (neutral)
- [x] Unread items show a "NEW" red pill badge
- [x] Bold key details within notification text (e.g., case number, attorney name)
- [x] Contextual CTA link with chevron (›) per notification type:
  - `case_update` — "View Case" (routes to case detail)
  - `message` — "Reply to Message" (routes to message thread)
  - `payment` — "View Receipt" (routes to payment detail)
  - `court_reminder` — "View Case" (routes to case detail)
  - `resolved` — "View Resolution" (routes to case detail)
- [x] **Hidden requirement:** Read items are visually dimmed — muted text color, no colored left bar, no NEW pill
- [x] Relative timestamp display (e.g., "2 hours ago", "Yesterday at 3:15 PM")

## Technical Notes

- CTA links use `routerLink` with the appropriate route based on `notification.type` and `notification.related_case_id`
- Bold key details: parse notification message for patterns like case numbers or names and wrap in `<strong>`
- SVG corner badges are small (16px) positioned at bottom-right of the emoji icon container
- The left border bar is a 4px wide colored border-left on the notification card
- Read state dimming: apply a CSS class like `.notification-read` that reduces opacity or uses muted colors

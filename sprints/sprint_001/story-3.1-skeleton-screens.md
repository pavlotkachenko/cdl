# Story 3.1 — Skeleton Screens for Data-Heavy Views

**Epic:** Loading States & Error Handling
**Priority:** HIGH
**Status:** DONE

## User Story
As a user on a slow connection,
I want to see placeholder shapes while data loads,
so that the app feels responsive, not broken.

## Scope
Add skeleton screens to:
- Driver dashboard (ticket cards, stats)
- Tickets list
- Case detail
- Carrier dashboard (fleet overview)

Use CSS shimmer animation or Angular Material skeleton — no new npm libraries.

## Acceptance Criteria
- [ ] Each listed screen shows skeleton shapes during API loading
- [ ] Skeleton disappears and real content appears once API responds
- [ ] No flash of empty content (skeleton shown immediately on route activate)
- [ ] Works on 4G throttle in Chrome DevTools

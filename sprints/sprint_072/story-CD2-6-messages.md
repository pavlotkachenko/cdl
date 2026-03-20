# Story CD2-6 — Messages Section Redesign

**Status:** TODO
**Priority:** P1

## Description

Redesign the messages section with role-based avatar colors and improved message bubble styling.

## Acceptance Criteria

- [ ] Message avatars use role-based background colors (Hidden Req #6)
- [ ] Message bubbles have improved styling with design system tokens
- [ ] Sent vs received messages visually distinct
- [ ] Share confirmation preserves `aria-live="polite"` (Hidden Req #11)
- [ ] Emoji spans have `aria-hidden="true"` (Hidden Req #1)
- [ ] No .ts file changes

## Files Modified

- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`

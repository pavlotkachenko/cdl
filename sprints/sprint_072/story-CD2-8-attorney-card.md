# Story CD2-8 — Attorney Card Redesign

**Status:** TODO
**Priority:** P0

## Description

Redesign the attorney information card with an availability status dot, teal-styled statistics, and an enhanced avatar presentation.

## Acceptance Criteria

- [ ] Attorney card uses design system card styling with teal accents
- [ ] Availability dot indicator displayed (green for available, gray for unavailable)
- [ ] Availability dot has `aria-hidden="true"` as it is purely visual (Hidden Req #4)
- [ ] Statistics section (rating, cases handled) uses teal styling
- [ ] Attorney avatar enhanced with border and shadow treatment
- [ ] No .ts file changes

## Files Modified

- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`

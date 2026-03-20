# Story CD2-9 — Status Timeline Redesign

**Status:** TODO
**Priority:** P1

## Description

Redesign the case status timeline with teal and green step markers, a connecting line, and an animated dot on the current active step.

## Acceptance Criteria

- [ ] Completed steps use green markers
- [ ] Current step uses teal marker with animated pulsing dot
- [ ] Future steps use muted/gray markers
- [ ] Connecting line between steps uses design system colors
- [ ] Animation on current dot respects `prefers-reduced-motion` (Hidden Req #7)
- [ ] No .ts file changes

## Files Modified

- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`

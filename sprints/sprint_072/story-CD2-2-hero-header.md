# Story CD2-2 — Case Hero Header Redesign

**Status:** TODO
**Priority:** P0

## Description

Redesign the case detail hero header section with a teal gradient background, white text, stat dividers between key metrics, and inverted button styling for visibility on the dark background.

## Acceptance Criteria

- [ ] Hero header uses teal gradient background from design tokens
- [ ] All text in hero header is white for contrast on dark background
- [ ] Stat dividers separate key metrics (case number, status, dates)
- [ ] Status badge uses white pill styling visible on teal gradient (Hidden Req #3)
- [ ] Hero buttons use inverted/outlined styling on dark background (Hidden Req #9)
- [ ] Breadcrumb preserves `aria-current="page"` attribute (Hidden Req #10)
- [ ] No .ts file changes

## Files Modified

- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`

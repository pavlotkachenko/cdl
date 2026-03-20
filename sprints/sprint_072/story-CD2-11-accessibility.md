# Story CD2-11 — Accessibility, Responsive & Reduced Motion

**Status:** TODO
**Priority:** P0

## Description

Ensure full WCAG 2.1 AA compliance across the redesigned Case Detail page, including `prefers-reduced-motion` support, `focus-visible` outlines, and responsive design across 4 breakpoints.

## Acceptance Criteria

- [ ] `prefers-reduced-motion: reduce` disables ALL animations and transitions (Hidden Req #7)
- [ ] `focus-visible` outlines on all interactive elements with teal accent
- [ ] 4 responsive breakpoints (mobile, tablet, desktop, wide) tested
- [ ] All emoji spans have `aria-hidden="true"` (Hidden Req #1)
- [ ] Breadcrumb `aria-current="page"` preserved (Hidden Req #10)
- [ ] Share `aria-live="polite"` preserved (Hidden Req #11)
- [ ] Footer SVG `aria-hidden="true"` preserved (Hidden Req #12)
- [ ] Minimum 44px touch targets on all interactive elements
- [ ] Semantic heading hierarchy maintained
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for large text)
- [ ] No .ts file changes

## Files Modified

- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`

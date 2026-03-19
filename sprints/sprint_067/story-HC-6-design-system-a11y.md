# Story: HC-6 — Design System, Accessibility & Responsive

**Sprint:** sprint_067
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver,
I want the help page to be fully accessible, responsive, and visually consistent with the teal design system,
So that I can use it on any device and with assistive technologies.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/help/help.component.html`
- `frontend/src/app/features/driver/help/help.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] SCSS uses teal design system variables: `$teal: #1dad8c`, `$teal-dark: #17a07f`, `$teal-light: #f0faf7`
- [ ] Font family: `'Mulish', sans-serif` (matching case-payment redesign)
- [ ] No `::ng-deep` anywhere in the SCSS
- [ ] No Angular Material classes or overrides in SCSS
- [ ] All interactive elements have min 44px touch targets (WCAG 2.1 AA)
- [ ] Color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [ ] Focus-visible outlines on all interactive elements (2px solid teal, 2px offset)
- [ ] `prefers-reduced-motion: reduce` disables hover transforms and accordion transitions
- [ ] Responsive breakpoints: 968px (tablet), 768px (mobile), 640px (small mobile), 480px (micro)
- [ ] Search input has proper `aria-label`
- [ ] Category tabs have `role="tablist"` container, each tab has `role="tab"` and `aria-selected`
- [ ] FAQ accordion items have proper ARIA attributes (see HC-4)
- [ ] All emoji icons wrapped in `<span aria-hidden="true">` so screen readers skip them
- [ ] `@keyframes fadeIn` animation for section entry (subtle opacity + translateY)
- [ ] Smooth scrolling behavior for category → FAQ navigation

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `frontend/src/app/features/driver/help/help.component.scss` | `help.component.spec.ts` | HC-7 |

## Dependencies

- Depends on: HC-2, HC-3, HC-4, HC-5
- Blocked by: none

## Notes

- This story is a polish/refinement pass over all HTML and SCSS produced by HC-2 through HC-5
- May also adjust TS for any missing ARIA bindings
- Verify with simulated screen reader flow: hero → search → categories → tabs → FAQs → contact → resources → CTA

# Story: SP-7 — Design System, Accessibility & Responsive

**Sprint:** sprint_068
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver,
I want the subscription page to be fully accessible, responsive, and visually consistent with the teal/purple design system,
So that I can use it on any device and with assistive technologies.

## Scope

### Files to Modify
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.html`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] SCSS variables: `$teal: #1dad8c`, `$teal-dark: #17a07f`, `$teal-light: #f0faf7`, `$purple: #8b5cf6`, `$font: 'Mulish'`
- [ ] CSS custom properties matching template: `--teal`, `--teal-mid`, `--teal-bg`, `--teal-bg2`, `--teal-border`, `--purple`, `--purple-bg`, `--purple-border`, `--green`, `--green-bg`, `--green-border`, `--amber`, `--amber-bg`, `--blue`, `--blue-bg`, `--red`, `--red-bg`, `--red-border`
- [ ] Font family: `'Mulish', sans-serif` throughout
- [ ] No `::ng-deep` in SCSS
- [ ] No Angular Material classes or overrides in SCSS
- [ ] All interactive elements have min 44px touch targets (WCAG 2.1 AA)
- [ ] Color contrast ratios meet WCAG AA (4.5:1 normal text, 3:1 large text)
- [ ] Focus-visible outlines on all interactive elements (2px solid teal, 2px offset)
- [ ] `prefers-reduced-motion: reduce` disables hover transforms, fadeIn animations, and toggle transitions
- [ ] Responsive breakpoints: plans grid 3→2→1 cols, trust row 4→2→1 cols, banner actions stack vertically
- [ ] `@keyframes fadeIn` with staggered delays: banner 0s, toggle 0.04s, plans 0.08s, trust 0.12s
- [ ] `@keyframes pulse` for active badge dot (opacity 1→0.4→1, 2s infinite)
- [ ] All emoji icons wrapped in `<span aria-hidden="true">`
- [ ] Toggle has `role="switch"` and `aria-checked`
- [ ] FAQ items have `role="button"`, `aria-expanded`, `aria-controls`
- [ ] Footer note with copyright, Privacy Policy, Terms of Service links

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `subscription-management.component.scss` | `subscription-management.component.spec.ts` | SP-8 |

## Dependencies

- Depends on: SP-2, SP-3, SP-4, SP-5, SP-6
- Blocked by: none

## Notes

- This story is a polish/refinement pass over all HTML and SCSS from SP-2 through SP-6
- Shadow tokens: `--shadow-sm`, `--shadow-md`, `--shadow-teal`, `--shadow-teal-lg`
- Radius tokens: `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 16px`

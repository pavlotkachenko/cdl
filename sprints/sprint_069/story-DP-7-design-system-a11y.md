# Story: DP-7 — Design System, Accessibility & Responsive

**Sprint:** sprint_069
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver,
I want the profile page to be fully accessible, responsive, and visually consistent with the teal design system,
So that I can use it on any device and with assistive technologies.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/profile/profile.component.html`
- `frontend/src/app/features/driver/profile/profile.component.scss`

### Database Changes
- None

## Acceptance Criteria

### Design Tokens
- [x] SCSS variables: `$teal: #1dad8c`, `$teal-dark: #17a07f`, `$teal-light: #f0faf7`, `$purple: #8b5cf6`, `$font: 'Mulish'`
- [x] CSS custom properties: `--teal`, `--teal-mid`, `--teal-bg`, `--teal-bg2`, `--teal-border`, `--red`, `--red-bg`, `--red-border`, `--green`, `--green-bg`, `--amber`, `--amber-bg`, `--blue`, `--blue-bg`
- [x] Shadow tokens: `--shadow-sm`, `--shadow-md`, `--shadow-teal`
- [x] Radius tokens: `--radius-sm: 6px`, `--radius-md: 10px`, `--radius-lg: 16px`
- [x] Font family: `'Mulish', sans-serif` throughout

### Accessibility (WCAG 2.1 AA)
- [x] No `::ng-deep` in SCSS
- [x] No Angular Material classes or overrides
- [x] All interactive elements have min 44px touch targets
- [x] Color contrast ratios meet WCAG AA (4.5:1 normal text, 3:1 large text)
- [x] Focus-visible outlines on all interactive elements (2px solid teal, 2px offset)
- [x] Notification toggles have `role="switch"` and `aria-checked`
- [x] All emoji icons wrapped in `<span aria-hidden="true">`
- [x] Section headings use proper `<h2>`/`<h3>` hierarchy
- [x] Form inputs have associated `<label>` elements or `aria-label`
- [x] Delete confirmation input has `aria-label="Type DELETE to confirm"`
- [x] Password fields have `autocomplete` attributes

### Animations
- [x] `@keyframes fadeIn` with staggered delays: hero 0s, info 0.04s, password 0.08s, notifications 0.12s, linked 0.16s, danger 0.2s
- [x] `@keyframes pulse` for verified badge dot
- [x] `@keyframes spin` for upload/save spinners
- [x] `prefers-reduced-motion: reduce` disables all transforms, fadeIn, pulse, toggle transitions

### Responsive
- [x] 968px: 2-column → 1-column layout, hero card becomes full-width banner
- [x] 768px: field grids 2→1 column, form grids 2→1 column, buttons stack vertically
- [x] 640px: reduce padding, smaller fonts
- [x] 480px: compact mobile view, stats strip wraps

### Toast Notification
- [x] Fixed position bottom-right (or bottom-center on mobile)
- [x] Slide-in animation, auto-dismiss after 3s
- [x] Green for success, red for error
- [x] Close button (×)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `profile.component.scss` | `profile.component.spec.ts` | DP-9 |

## Dependencies

- Depends on: DP-2, DP-3, DP-4, DP-5, DP-6
- Blocked by: none

## Notes

- This story is a polish/refinement pass over all HTML and SCSS from DP-2 through DP-6
- Matches Sprint 068 subscription page design language
- Hero card uses `position: sticky` on desktop, normal flow on mobile
- Toast notification replaces MatSnackBar — implemented as signal-driven `@if` block

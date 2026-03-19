# Story: NR-7 — Design System & Accessibility

**Sprint:** sprint_070
**Priority:** P1
**Status:** DONE

## User Story

As a driver,
I want the notification center to follow the teal design system and be fully accessible,
so that the page is consistent with the rest of the app and usable by everyone.

## Acceptance Criteria

- [x] Full SCSS using CSS custom properties matching the teal/purple design system
- [x] Animations:
  - `fadeIn` staggered animation for summary cards on page load
  - `slideIn` animation for notification items as they appear
  - `prefers-reduced-motion: reduce` disables all animations
- [x] 4 responsive breakpoints:
  - `968px` — 2-column to 1-column layout if applicable
  - `768px` — tablet adjustments (smaller cards, stacked elements)
  - `640px` — compact layout
  - `480px` — mobile-first minimal layout
- [x] WCAG 2.1 AA compliance:
  - `aria-label` on all action buttons (mark-read, delete, preferences, settings)
  - `role="list"` on the notification list container
  - Semantic `<h2>` headings for date group headers
  - `focus-visible` outlines on all interactive elements
  - Minimum 44px touch targets for all buttons and interactive elements
- [x] All emojis wrapped in `<span aria-hidden="true">` to hide from screen readers
- [x] Color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- [x] Keyboard navigation: Tab through all interactive elements in logical order

## Technical Notes

- CSS custom properties to define:
  - `--notification-blue`, `--notification-teal`, `--notification-green`, `--notification-amber`
  - `--card-bg`, `--card-border`, `--card-shadow`
  - `--text-primary`, `--text-muted`, `--text-accent`
- Animation keyframes:
  ```scss
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-12px); }
    to { opacity: 1; transform: translateX(0); }
  }
  ```
- Staggered animation via `animation-delay` calculated with `@for` index or CSS `nth-child`
- Mobile-first approach: base styles for smallest screen, use `min-width` media queries to add complexity

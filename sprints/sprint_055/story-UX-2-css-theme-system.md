# UX-2: Create CSS custom properties theme system (light/dark/high-contrast)

- **Status:** DONE
- **Priority:** P0
- **Sprint:** 055

## Description

Create a CSS custom properties theme system with light, dark, and high-contrast themes, mapping 1:1 to Figma brand tokens and supporting responsive font sizes.

## Acceptance Criteria

- [x] _css-tokens.scss defines 75+ CSS custom properties prefixed --cdl-*
- [x] Light theme (default) maps 1:1 to Figma brand tokens
- [x] Dark theme with inverted surfaces, brightened accents
- [x] High-contrast theme meeting WCAG AAA contrast ratios
- [x] Responsive font sizes adjust via media queries (mobile/tablet breakpoints)
- [x] Theme switching works via data-theme attribute on <html>
- [x] Imported in styles.scss
- [x] No regressions in ng build

## Files

- `src/assets/styles/_css-tokens.scss`
- `src/styles.scss`

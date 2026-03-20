# Story CD2-1 — Design Tokens & SCSS Foundation

**Status:** TODO
**Priority:** P0

## Description

Replace SCSS `$variables` with CSS custom properties on `:host`, establishing the teal/purple design system foundation for the Case Detail component. All subsequent stories depend on these tokens.

## Acceptance Criteria

- [ ] All SCSS `$variables` replaced with CSS custom properties defined on `:host`
- [ ] Teal/purple color palette tokens defined (primary, secondary, accent, surface, text variants)
- [ ] Spacing, border-radius, shadow, and typography tokens defined as custom properties
- [ ] Gradient tokens for hero, alerts, and cards defined
- [ ] Existing visual appearance preserved until subsequent stories restyle sections
- [ ] No .ts file changes

## Files Modified

- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`

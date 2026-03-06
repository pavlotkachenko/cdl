# Story 23.3 — WCAG 2.1 AA Accessibility Audit (Launch Gate 3)

**Epic:** Launch Gate Sprint
**Sprint:** 019
**Priority:** CRITICAL
**Status:** TODO

## User Story

As a driver with visual or motor impairments,
I want to use the platform with assistive technology,
so I'm not excluded from managing my CDL tickets.

## Scope

Pass WCAG 2.1 AA compliance across all user-facing screens to meet Launch Gate 3.

## Audit Checklist (per screen)

### Color & Contrast
- [ ] All text meets 4.5:1 contrast ratio (normal text) or 3:1 (large text)
- [ ] No information conveyed by color alone (error states use icon + text + color)
- [ ] Focus indicators visible with ≥ 3:1 contrast against adjacent color

### Touch Targets
- [ ] All interactive elements ≥ 44×44px on mobile
- [ ] Sufficient spacing between tappable items (≥ 8px gap)

### Keyboard Navigation
- [ ] All interactive elements reachable via Tab key
- [ ] Logical focus order (top-left to bottom-right)
- [ ] No keyboard traps (modals include Escape to close)
- [ ] Skip-to-content link at top of page

### Screen Reader Support
- [ ] All images have descriptive `alt` text (decorative images use `alt=""`)
- [ ] Form inputs have associated `<label>` or `aria-label`
- [ ] Error messages linked to inputs via `aria-describedby`
- [ ] Dynamic content changes announced via `aria-live` regions
- [ ] Dialogs use `role="dialog"` with `aria-labelledby`

### Forms
- [ ] Required fields marked with `aria-required="true"`
- [ ] Error messages appear adjacent to the invalid field
- [ ] Autocomplete attributes set on login/registration fields

## Screens to Audit

Priority order:
1. Landing page (`/`)
2. Driver registration (`/auth/register`)
3. Login (`/auth/login`)
4. Driver dashboard (`/driver/dashboard`)
5. Submit ticket wizard (`/driver/tickets/new`)
6. Case detail (`/driver/cases/:id`)
7. Payment (`/driver/cases/:id/pay`)
8. Attorney recommendation (`/driver/cases/:id/attorneys`)

## Tools

```bash
# AXE automated check (run in browser dev tools or CI)
npx axe-cli http://localhost:4200 --tags wcag2aa

# Lighthouse accessibility score (target: 100)
npx lighthouse http://localhost:4200 --only-categories=accessibility
```

## Acceptance Criteria

- [ ] AXE reports zero violations on all 8 priority screens
- [ ] Lighthouse accessibility score = 100 on all 8 screens
- [ ] Manual keyboard navigation test passes for ticket submission flow
- [ ] Findings documented in `sprints/sprint_019/wcag-audit-results.md`

## Files to Modify

- Any component with AXE violations found during audit
- Test file: `*.component.spec.ts` — add AXE assertion where missing

# Sprint 068 — Subscription Page Redesign

**Goal:** Redesign the Driver Subscription Management page with hardcoded plan tiers, billing toggle, trust row, FAQ accordion, and full teal/purple design system — matching the approved HTML template.
**Branch:** `feat/sprint-068-subscription-redesign`
**Created:** 2026-03-19

## Stories

| # | ID | Title | Priority | Status | Depends On |
|---|-----|-------|----------|--------|------------|
| 1 | SP-1 | Component Modernization (extract template/styles, remove Material) | P0 | DONE | none |
| 2 | SP-2 | Current Plan Banner | P0 | DONE | SP-1 |
| 3 | SP-3 | Billing Toggle | P0 | DONE | SP-1 |
| 4 | SP-4 | Plan Cards with Tier Colors | P0 | DONE | SP-3 |
| 5 | SP-5 | Trust Row | P1 | DONE | SP-1 |
| 6 | SP-6 | FAQ Accordion | P1 | DONE | SP-1 |
| 7 | SP-7 | Design System, Accessibility & Responsive | P1 | DONE | SP-2, SP-3, SP-4, SP-5, SP-6 |
| 8 | SP-8 | Tests | P0 | DONE | SP-1, SP-2, SP-3, SP-4, SP-5, SP-6, SP-7 |

## Definition of Done

- [ ] All story statuses are DONE
- [ ] All acceptance criteria checked in every story file
- [ ] Backend tests pass: `cd backend && npm test`
- [ ] Frontend tests pass: `cd frontend && npx ng test --no-watch`
- [ ] No uncommitted changes
- [ ] Docs updated (API spec, functional reqs, bug registry as needed)
- [ ] PR created and approved by human reviewer

## Dependencies

- SubscriptionService already exists with all required API methods
- No backend changes needed — frontend-only sprint
- No database changes

## Notes

- Content values (plan names, prices, features, FAQ text) are hardcoded from the approved HTML template
- Do NOT touch sidebar, header/topbar, or footer — only the content area
- Three plan tiers: Starter (free/grey), Driver Plus ($15/teal), Driver Unlimited ($40/purple)
- Billing toggle switches between monthly and annual pricing (20% discount)
- Remove all Angular Material dependencies from this component
- Use emoji spans with `aria-hidden="true"` per design system

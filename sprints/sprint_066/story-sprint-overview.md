# Sprint 066 — Pay Attorney Fee Page Redesign

**Goal:** Redesign the case-payment page to match the teal design system, restructure to checkout-style 2-column layout, replace mat-spinner/MatSnackBar with custom elements, add trust badges and enriched case summary, and update all tests.
**Branch:** `feat/sprint-066-pay-attorney-redesign`
**Created:** 2026-03-19

## Stories

| # | ID | Title | Priority | Status | Depends On |
|---|-----|-------|----------|--------|------------|
| 1 | PF-1 | Frontend — Page Header & Layout Restructure | P0 | DONE | none |
| 2 | PF-2 | Frontend — Enriched Case Summary Card | P0 | DONE | PF-1 |
| 3 | PF-3 | Frontend — Payment Option Cards & Schedule | P0 | DONE | PF-1 |
| 4 | PF-4 | Frontend — Card Form Redesign (Stripe Elements + Cardholder Name) | P0 | DONE | PF-1 |
| 5 | PF-5 | Frontend — Order Summary Sidebar, Attorney Card & Trust Badges | P1 | DONE | PF-1 |
| 6 | PF-6 | Frontend — Teal Design System, Remove Material deps, Accessibility | P1 | DONE | PF-1 |
| 7 | PF-7 | Frontend — Tests Update | P0 | DONE | PF-2, PF-3, PF-4, PF-5, PF-6 |

## Batch Dependencies

```
Batch 1 (foundation):  PF-1
Batch 2 (parallel):    PF-2, PF-3, PF-4, PF-5, PF-6
Batch 3 (depends on all): PF-7
```

## Definition of Done

- [ ] All story statuses are DONE
- [ ] All acceptance criteria checked in every story file
- [ ] Frontend tests pass: `cd frontend && npx ng test --no-watch`
- [ ] No `mat-spinner` or `MatSnackBar` in case-payment component
- [ ] No `mat-icon` — only emoji + inline SVG
- [ ] Teal (#1dad8c) color scheme throughout (not blue)
- [ ] Angular 21 conventions: signals, inject(), OnPush, native control flow
- [ ] WCAG 2.1 AA: ARIA labels, keyboard navigable, 44px touch targets
- [ ] Mobile-first responsive layout (stacks at 768px)
- [ ] Stripe Elements remain for card inputs (PCI compliance)
- [ ] No uncommitted changes
- [ ] PR created and approved

## Dependencies

- Stripe SDK (`@stripe/stripe-js`) — already installed
- Backend endpoints unchanged — no backend stories needed

## Notes

- This is a **frontend-only** sprint. All backend endpoints (payment intents, plan options, plan creation, confirmation) are already implemented and working.
- **Scope: content area only.** The app shell (sidebar navigation, topbar, footer) is NOT part of this sprint — those are rendered by the parent layout and remain unchanged. Only the `case-payment.component` content inside the `<router-outlet>` is redesigned.
- The HTML template provided by the designer is the visual reference. Sidebar/topbar/footer in the template are for context only — do not replicate them. Stripe Elements must replace raw `<input>` fields for card data (PCI compliance).
- Processing fee display changes from "2.9% + $0.30" to "Free" per design. The `processingFee` computed signal should return 0. Backend does not charge processing fee separately.
- Payment plan options: keep backend flexibility (Full/4wk/8wk from API) but present as 2-card selector (Full vs Plan). Default plan = 4 weeks.

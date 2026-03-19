# Story: SP-3 — Billing Toggle

**Sprint:** sprint_068
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to toggle between monthly and annual billing,
So that I can see discounted annual pricing before choosing a plan.

## Scope

### Files to Modify
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.ts`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.html`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] Toggle row centered: "Monthly" label — pill toggle — "Annual" label — "Save 20%" badge
- [ ] Active billing label has `color: var(--text-primary)`, inactive has `color: var(--text-muted)`
- [ ] Toggle pill: 48×26px, teal background, white 20×20px knob with CSS transition (left: 3px ↔ 25px)
- [ ] Clicking the toggle pill calls `toggleBilling()` which flips `billingInterval` signal
- [ ] "Save 20%" badge: green-bg, green text, green border, 20px border-radius
- [ ] Badge opacity transitions: 0.4 when monthly, 1.0 when annual
- [ ] Toggle has `role="switch"` and `aria-checked` bound to annual state
- [ ] Toggle is keyboard accessible (Enter/Space to toggle)
- [ ] `@keyframes fadeIn` animation with 0.04s delay

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `subscription-management.component.ts` | `subscription-management.component.spec.ts` | SP-8 |

## Dependencies

- Depends on: SP-1
- Blocked by: none

## Notes

- The toggle only changes the display prices on plan cards — it does not call any API
- Annual prices: Plus $15 → $12, Unlimited $40 → $32 (Math.round(base * 0.8))
- Signal: `billingInterval = signal<'monthly' | 'annual'>('monthly')`

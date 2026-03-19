# Story: SP-5 — Trust Row

**Sprint:** sprint_068
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver,
I want to see trust indicators below the plan cards,
So that I feel confident about the billing and cancellation policies.

## Scope

### Files to Modify
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.html`
- `frontend/src/app/features/attorney/subscription-management/subscription-management.component.scss`

### Database Changes
- None

## Acceptance Criteria

- [ ] 4-column grid of trust cards below the plans grid
- [ ] Card 1: 🔒 "Cancel Anytime" — "No lock-in contracts. Cancel your plan with one click, effective end of billing cycle." (teal-bg2 icon bg)
- [ ] Card 2: 💰 "No Hidden Fees" — "The price you see is what you pay. No setup fees, no activation charges." (green-bg icon bg)
- [ ] Card 3: ⚡ "Instant Activation" — "Your plan upgrades take effect immediately — no waiting period." (blue-bg icon bg)
- [ ] Card 4: 🛡️ "Secure Billing" — "All payments processed via Stripe. Your card data is never stored on our servers." (amber-bg icon bg)
- [ ] Each card: white bg, 1.5px border-light border, 10px border-radius, shadow-sm
- [ ] Trust icon: 36×36px, 9px border-radius, colored background, 16px emoji
- [ ] All emoji icons wrapped in `<span aria-hidden="true">`
- [ ] `@keyframes fadeIn` animation with 0.12s delay

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `subscription-management.component.html` | `subscription-management.component.spec.ts` | SP-8 |

## Dependencies

- Depends on: SP-1
- Blocked by: none

## Notes

- Trust row data is hardcoded in the component as a readonly array
- Trust row replaces the old billing history table from the original component

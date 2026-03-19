# Story: PF-5 — Frontend — Order Summary Sidebar, Attorney Card & Trust Badges

**Sprint:** sprint_066
**Priority:** P1
**Status:** DONE

## User Story

As Miguel (Driver),
I want to see a clear order summary, my attorney's credentials, and security trust badges in a sidebar,
So that I know exactly what I'm paying and feel confident the transaction is safe.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-payment/case-payment.component.html`
- `frontend/src/app/features/driver/case-payment/case-payment.component.scss`
- `frontend/src/app/features/driver/case-payment/case-payment.component.ts`

### Implementation

All three sections go in the **right column** (360px, sticky).

#### 1. Order Summary Card
```
.order-summary
  .order-header > .order-title ("Order Summary")
  .order-rows
    .order-row: "Attorney fee" → "$450.00"
    .order-row: "Processing fee" → "Free" (green)
    .order-row: "Platform fee" → "Included" (green)
  .order-divider
  .order-total-row (teal background): "Total due today" → amount (22px, teal, bold)
  .order-note: shield icon + "No hidden fees. Secure payment via Stripe."
```

**Dynamic behavior:**
- When "Payment Plan" selected: total shows first installment amount, not full amount
- Amount updates live when plan selection changes (same pattern as template's `selectOption()`)

#### 2. Attorney Card (moved from left column)
```
.attorney-card
  title: "YOUR ATTORNEY" (uppercase muted)
  .atty-row: 44px avatar (blue gradient, initials) + name + role ("CDL Defense Attorney · Licensed...")
  .atty-stats (3 columns):
    Win Rate (teal, 16px bold) + "Win Rate" label
    Years Exp (teal) + "Yrs Exp" label
    Cases Won (teal) + "Cases Won" label
```

Remove the attorney card from the left column and the "RECOMMENDED" badge. The sidebar version is simpler.

#### 3. Trust Badges Card (NEW)
```
.trust-card
  .trust-card-title: "Why it's safe to pay"
  4 items:
    🔒 "SSL Encrypted" — "All data is transmitted securely over HTTPS."
    💳 "Stripe Secured" — "Your card data never touches our servers."
    ✅ "PCI Compliant" — "Fully certified payment processing."
    ↩️ "Cancel Anytime" — "Payment plans can be paused if needed."
```

Each item: 26px icon square (colored background) + bold title + description text.

#### Signal Changes
- `orderTotal = computed(() => ...)` — returns full amount or first installment based on plan
- Remove `processingFee` computed (or set to always return 0)
- Remove `totalAmount` computed (replaced by `orderTotal`)
- Update `payButtonLabel()` to use `orderTotal()`

## Acceptance Criteria

- [ ] Order summary card in right column with "Order Summary" header
- [ ] Three line items: Attorney fee (amount), Processing fee ("Free" in green), Platform fee ("Included" in green)
- [ ] Divider between line items and total row
- [ ] Total row has teal background, "Total due today" label, amount in 22px teal bold
- [ ] Total updates live: shows full amount for "Pay in Full", first installment for "Payment Plan"
- [ ] "No hidden fees" note with shield SVG icon below total
- [ ] Attorney card in right column: avatar with initials, name, role text, 3-stat strip (teal numbers)
- [ ] Trust badges card with 4 items: SSL, Stripe, PCI, Cancel Anytime
- [ ] Each trust item has colored icon square + bold title + description
- [ ] Right column is sticky (follows scroll)
- [ ] Attorney card removed from left column
- [ ] "RECOMMENDED" badge removed

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | defer to PF-7 |

## Dependencies

- Depends on: PF-1 (layout structure)
- Blocked by: none

## Notes

- Processing fee being "Free" is a business decision reflected in this redesign. The backend does not charge a separate processing fee — Stripe fees are absorbed by the platform.
- Trust badge texts are static — no API data needed.
- On mobile (<=768px), the sidebar sections stack below the main form: order summary first, then attorney, then trust badges.

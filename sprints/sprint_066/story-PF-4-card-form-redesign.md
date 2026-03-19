# Story: PF-4 — Frontend — Card Form Redesign (Stripe Elements + Cardholder Name)

**Sprint:** sprint_066
**Priority:** P0
**Status:** DONE

## User Story

As Miguel (Driver),
I want a professional card entry form with clear labels, a brand indicator strip, and security reassurance,
So that I feel safe entering my payment details.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-payment/case-payment.component.html`
- `frontend/src/app/features/driver/case-payment/case-payment.component.scss`
- `frontend/src/app/features/driver/case-payment/case-payment.component.ts`

### Implementation

#### Card Form Section
Move the card form into the left column, inside the Payment Options card (below the plan selector). Structure:

```
.card-form
  .card-form-title  ("Card Details" + card brand strip)
  .field-group       (Cardholder Name — regular HTML input)
  .field-group       (Card Number — Stripe Element mount point + lock icon)
  .f-row
    .field-group     (Expiry — Stripe Element mount point)
    .field-group     (CVV — Stripe Element mount point + info tooltip SVG)
  .stripe-badge      (shield icon + "Secured by Stripe · AES-256 encryption · PCI DSS compliant")
  .pay-btn           (teal gradient, lock icon, amount)
```

#### Card Brand Strip
```html
<div class="card-brands">
  <div class="card-brand visa">VISA</div>
  <div class="card-brand mc">MC</div>
  <div class="card-brand amex">AMEX</div>
</div>
```

#### Cardholder Name Field (NEW)
- Regular `<input>` (not Stripe Element) — this field is not sensitive
- Label: "Cardholder Name" with person SVG icon
- Pre-populated placeholder: user's name if available, else "Full name on card"
- Pass to Stripe via `billing_details.name` in `confirmCardPayment()` and `createPaymentMethod()`

#### Stripe Elements Styling Update
Update the element style object to match the new design:
- Background: `var(--bg)` (#f4f7f9)
- Border: 1.5px solid `var(--border)` (#e2e8ee)
- Focus: teal border + 3px teal ring
- Font: Mulish, 14px, weight 600
- Placeholder: muted color

#### Lock Icon on Card Number
SVG padlock icon positioned absolute right inside the card number field wrapper.

#### CVV Info Tooltip
SVG info circle icon next to the CVV label with `title="3-digit security code"` and `cursor: help`.

#### Pay Button Redesign
- Full-width teal gradient (`linear-gradient(135deg, #1dad8c, #17a07f)`)
- Lock SVG icon + "Pay" text + amount in lighter opacity span
- Shadow: `0 4px 16px rgba(29,173,140,.25)`
- Hover: deeper shadow + translateY(-1px)
- Disabled: gray background, no shadow
- Loading state: CSS spinner (not mat-spinner) + "Processing..."

#### Signal/Method Changes
- Add `cardholderName = signal('')` for the name input
- Update `pay()` method to include `billing_details: { name: cardholderName() }` in both payment flows
- Remove `MatSnackBar` usage — replace with inline error/success signals
- Add `paymentError = signal('')` for inline error display below pay button

## Acceptance Criteria

- [ ] Card form is in the left column, inside the payment options card area
- [ ] "Card Details" title with card brand strip (VISA, MC, AMEX) to the right
- [ ] Cardholder Name field: regular HTML input, labeled with person SVG icon
- [ ] Card Number field: Stripe Element `<div>` mount point with lock SVG icon inside
- [ ] Expiry + CVV in a 2-column row
- [ ] CVV label has info tooltip SVG with `title` attribute
- [ ] Stripe Element styling matches design (teal focus, Mulish font, correct colors)
- [ ] "Secured by Stripe · AES-256 encryption · PCI DSS compliant" badge below fields
- [ ] Pay button: teal gradient, lock SVG, shows amount dynamically
- [ ] Pay button disabled state: gray background, no pointer
- [ ] Pay button loading state: CSS spinner + "Processing..." (no mat-spinner)
- [ ] Cardholder name passed as `billing_details.name` to Stripe
- [ ] Card validation errors shown below respective fields with `role="alert"`
- [ ] Payment error shown inline below pay button (no MatSnackBar)
- [ ] `MatSnackBar` and `MatProgressSpinnerModule` removed from component imports

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-payment.component.ts` | `case-payment.component.spec.ts` | defer to PF-7 |

## Dependencies

- Depends on: PF-1 (layout structure)
- Blocked by: none

## Notes

- **CRITICAL:** Card Number, Expiry, and CVC must remain Stripe Elements (`<div>` mount points). Do NOT use regular `<input>` fields for these — PCI DSS violation.
- The Cardholder Name is the only new regular `<input>` field. Stripe Elements handle the sensitive card data.
- When `paying()` is true, also disable the Cardholder Name input.
- The `payButtonLabel()` method should be updated to show just the amount (e.g., "$450.00") after "Pay" text, matching the template's `pay-btn-amount` span.

# Story 7.4 — Driver Payment Page

**Epic:** Core Flow Integration
**Priority:** CRITICAL
**Status:** DONE

## User Story
As Miguel (driver),
I want to pay my attorney fee with a debit or credit card in under 60 seconds,
so that my case can start immediately.

## Context
`payment.service.js` → `createPaymentIntent` and `confirmPayment` exist and are tested.
Stripe is integrated on the backend. The frontend has no payment page wired to these endpoints.
`sendPaymentConfirmationEmail` fires on `confirmPayment` (Sprint 001).

## Scope

### Backend
- `POST /api/cases/:caseId/payments` — create a payment intent for the case fee
  - Calls `paymentService.createPaymentIntent`
  - Returns `clientSecret` and `paymentIntentId`
- `POST /api/payments/:paymentIntentId/confirm` — called after Stripe client-side confirmation
  - Calls `paymentService.confirmPayment`
- Ensure driver can only pay for their own cases

### Frontend (new route: `/driver/cases/:caseId/pay`)

**Fee summary card:**
- Case number, attorney name, violation type
- Total fee amount, large, prominent
- "No hidden fees" trust line

**Payment form:**
- Stripe Elements card input (card number, expiry, CVC)
- "Pay $X.XX" button with Stripe loading state
- Link: "Need a payment plan? Contact support" (simple escape hatch for now)

**Payment flow:**
1. Mount → `POST /api/cases/:caseId/payments` → receive `clientSecret`
2. Driver fills card details
3. Driver taps "Pay" → `stripe.confirmCardPayment(clientSecret)`
4. On Stripe success → `POST /api/payments/:paymentIntentId/confirm`
5. Navigate to confirmation page (Story 7.5) or case status page with success toast

**Error handling:**
- Stripe card error (declined, insufficient funds): show Stripe's user-friendly error message inline
- Network error: "Payment not completed — please try again" with retry button
- Do not show generic 500 error to user

### Security
- Never log or store raw card details
- `clientSecret` lives only in component memory, never in local storage

## Acceptance Criteria
- [ ] Payment page shows fee amount, case number, and attorney name
- [ ] Stripe Elements card input renders correctly on mobile
- [ ] Successful payment navigates to success screen and triggers confirmation email
- [ ] Stripe card decline shows inline error message (not a page crash)
- [ ] Driver can only initiate payment for their own case (403 otherwise)
- [ ] "Pay" button disabled while Stripe processing is in flight
- [ ] No card data stored client-side beyond Stripe's own tokenization

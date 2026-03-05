# Story 9.1 — Driver Payment Page (Stripe)

**Epic:** Complete Driver End-to-End Journey
**Priority:** CRITICAL
**Status:** DONE (component pre-exists, needs tests)

## User Story
As Miguel (driver),
I want to pay my attorney fee securely with my debit/credit card from my case page,
so that my case moves forward immediately without phone calls or checks.

## Context
`CasePaymentComponent` exists at `features/driver/case-payment/case-payment.component.ts`.
Route: `/driver/cases/:caseId/pay` registered in `driver-routing.module.ts`.
The case detail page has a `payAttorneyFee()` method that navigates to this route when
the case status is `pay_attorney`.

## Component Behaviour (what exists)
- `ngOnInit`: reads `caseId` from route params, calls `GET /api/cases/:id` to get case info
- `createPaymentIntent()`: calls `POST /api/cases/:id/payments` → gets `clientSecret` + `paymentIntentId`
- `ngAfterViewInit → initStripe()`: fetches `GET /api/payments/config` for publishable key,
  loads Stripe.js, mounts `CardElement` into `#cardEl` div
- `pay()`: calls `stripe.confirmCardPayment(clientSecret)`, then `POST /api/payments/confirm`
  on success, navigates to `/driver/cases/:caseId/payment-success`
- `goBack()`: navigates to `/driver/cases/:caseId`

## Acceptance Criteria
- [ ] Case number, attorney name, and fee amount shown before card entry
- [ ] Stripe card element mounted in `#cardEl` after async init
- [ ] Pay button disabled while Stripe loads or while processing
- [ ] Card errors shown inline under the card element
- [ ] On success: navigates to `/driver/cases/:caseId/payment-success` with `amount` + `transactionId` in state
- [ ] On case load failure: shows snackbar, remains on page
- [ ] `goBack()` navigates to case detail
- [ ] Unit tests cover all these paths (see Story 9.5)

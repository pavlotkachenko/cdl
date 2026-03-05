# Story 7.5 — Payment Confirmation Screen

**Epic:** Core Flow Integration
**Priority:** HIGH
**Status:** TODO

## User Story
As Miguel (driver),
I want a clear confirmation after paying so I know my case is officially started,
so that I don't wonder if the payment went through.

## Context
Immediately follows Story 7.4. This is the "We got it!" moment for payment.
The confirmation email is already sent by `sendPaymentConfirmationEmail` (Sprint 001).
This story covers the in-app confirmation UI and the transition back to case tracking.

## Scope

### Frontend (route: `/driver/cases/:caseId/payment-success` or query param `?paid=true`)

**Success screen:**
- Large success icon (checkmark animation — simple CSS, no heavy library)
- "Payment received!" heading
- Amount paid, last 4 digits of card (from Stripe response), transaction ID
- "Your attorney has been notified and will begin working on your case" body text
- "View Case" primary button → navigates to `/driver/cases/:caseId`
- "Back to Dashboard" secondary link

**Email reminder line:**
- "A confirmation email has been sent to [masked email]"

### Guard
- Route only accessible when coming from a successful payment flow
- Direct URL access without valid payment state → redirect to `/driver/cases/:caseId`

## Acceptance Criteria
- [ ] Success icon and heading display immediately after payment confirmation
- [ ] Amount paid and last 4 digits shown from Stripe response
- [ ] "View Case" button navigates to the case status page
- [ ] Direct URL access without payment flow context redirects gracefully
- [ ] No sensitive card data displayed (only last 4 digits)
- [ ] Confirmation email reminder shown with masked email address

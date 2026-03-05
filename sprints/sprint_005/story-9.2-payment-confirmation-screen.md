# Story 9.2 — Payment Confirmation Screen

**Epic:** Complete Driver End-to-End Journey
**Priority:** HIGH
**Status:** DONE (component pre-exists, needs tests)

## User Story
As Miguel (driver),
I want to see a clear "Payment received!" screen with my transaction details after paying,
so I know the payment went through and my attorney is notified.

## Context
`PaymentSuccessComponent` exists at `features/driver/payment-success/payment-success.component.ts`.
Route: `/driver/cases/:caseId/payment-success` registered in `driver-routing.module.ts`.
State is passed via Angular router navigation state (`{ amount, transactionId }`).

## Component Behaviour (what exists)
- `ngOnInit`: reads `caseId` from route params, reads `amount` + `transactionId` from `history.state`
- If `history.state.amount` is absent (direct URL access), redirects to `/driver/cases/:caseId`
- `viewCase()`: navigates to `/driver/cases/:caseId`
- `goToDashboard()`: navigates to `/driver/dashboard`

## Acceptance Criteria
- [ ] "Payment Received!" heading visible
- [ ] Amount and transaction ID shown when available
- [ ] "View Case" navigates to case detail
- [ ] "Back to Dashboard" navigates to driver dashboard
- [ ] Direct URL access (no state) redirects to case detail (graceful fallback)
- [ ] Unit tests cover all these paths (see Story 9.5)

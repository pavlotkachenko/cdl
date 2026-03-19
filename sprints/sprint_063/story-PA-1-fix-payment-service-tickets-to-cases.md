# Story PA-1: Fix tickets→cases in payment.service.js

## Status: DONE

## Problem
`payment.service.js` was querying a non-existent `tickets` table in 4 methods, causing `POST /api/cases/:id/payments` to 500 and the frontend to show an infinite "Loading payment options..." spinner.

## Root Cause
The `payments` table schema (migration 011) uses `case_id UUID REFERENCES cases(id)` — there is no `ticket_id` column and no `tickets` table. The service was written with legacy naming that was never updated.

## Changes

### `backend/src/services/payment.service.js`
- `createPaymentIntent({ ticketId, ... })` → `createPaymentIntent({ caseId, ... })`
  - Queries `cases` table with `driver_id` filter (was `tickets` with `user_id`)
  - Inserts `case_id` into payments (was `ticket_id`)
  - Updates `cases.payment_status` (was `tickets.payment_status`)
  - Stripe metadata now includes `caseNumber` for dashboard visibility
- `handlePaymentFailure()` — updates `cases.payment_status` (was `tickets`)
- `processRefund()` — updates `cases.payment_status` (was `tickets`)
- `getTicketPayments()` → `getCasePayments()` — queries `case_id` column

### `backend/src/controllers/case.controller.js`
- `createCasePayment`: changed `ticketId: id` → `caseId: id` in `paymentService.createPaymentIntent()` call

### `backend/src/controllers/payment.controller.js`
- `createPaymentIntent` handler: `ticketId` → `caseId` in request body
- `confirmPayment` invoice email: `payment.ticketId` → `payment.case_id`, `payment.userId` → `payment.user_id`
- `getTicketPayments` → `getCasePayments`

### `backend/src/routes/payment.routes.js`
- `GET /ticket/:ticketId` → `GET /case/:caseId`

## Verification
- `POST /api/cases/:id/payments` now returns `{ clientSecret, paymentIntentId, amount }` ✓
- No `tickets` table references remain in payment files ✓

# Story IN-3 — Invoice Email Trigger

**Sprint:** 030 — Rating System + Invoicing
**Status:** DONE

## User Story

As Miguel (driver),
I want an invoice emailed to me automatically after payment,
so I have a record in my inbox without needing to log back in.

## Changes

### `backend/src/services/email.service.js` — UPDATED

New function:
- `sendInvoiceEmail(driverEmail, invoiceData)` — sends formatted invoice email via SendGrid with invoice number, amount, attorney name, and a link to view the case

### `backend/src/controllers/payment.controller.js` — UPDATED

After successful payment confirmation:
- Calls `invoice.service.getInvoiceForCase(caseId, userId)` to derive invoice data
- Calls `email.service.sendInvoiceEmail(driver.email, invoiceData)` — non-blocking (fire-and-forget, wrapped in `try/catch`)

## Acceptance Criteria

- [x] Invoice email sent automatically after `POST /api/payments/confirm` succeeds
- [x] Email failure does not cause payment confirmation to return an error
- [x] Email contains invoice number, amount, attorney name, and case link
- [x] `sendInvoiceEmail` function is unit-testable (SendGrid client mockable)

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `email.service.js` (`sendInvoiceEmail`) | `email.service.test.js` | ✅ extended |
| `payment.controller.js` (invoice trigger) | existing `payment.controller.test.js` | ✅ |

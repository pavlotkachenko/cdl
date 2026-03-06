# Story IN-1 — Invoice Service + Endpoint

**Sprint:** 030 — Rating System + Invoicing
**Status:** DONE

## User Story

As James (attorney),
I want a professional invoice generated automatically when a driver pays,
so I have a record for accounting and the driver has proof of payment.

## Changes

### `backend/src/services/invoice.service.js` — CREATED

Key function:
- `getInvoiceForCase(caseId, requestingUserId)` — derives invoice data from `cases` + `payments` tables (no separate invoice table needed); returns `{ invoiceNumber, caseId, driverName, attorneyName, amount, date, status }`
- Invoice number format: `INV-{caseId.slice(0,8).toUpperCase()}`

### `backend/src/controllers/invoice.controller.js` — CREATED

- `GET /api/invoices/case/:id` — returns invoice for a case; accessible by the case's driver or attorney

### `backend/src/routes/invoice.routes.js` — CREATED

```
GET /api/invoices/case/:id  → getInvoiceForCase  (verifyToken)
```

### `backend/src/server.js` — UPDATED

Registered `invoiceRoutes` at `/api/invoices`.

## Acceptance Criteria

- [x] `GET /api/invoices/case/:id` returns invoice data for driver or attorney on the case
- [x] Returns 403 if requesting user is neither driver nor attorney on the case
- [x] Returns 404 if case not found
- [x] Invoice number is deterministic from case ID (idempotent)

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `invoice.service.js` | existing backend test suite | ✅ |
| `invoice.controller.js` | existing backend test suite | ✅ |

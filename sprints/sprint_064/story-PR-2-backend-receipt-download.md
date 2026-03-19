# Story PR-2: Backend — Receipt PDF Download Endpoint

## Meta

- **Sprint:** 064
- **Priority:** P0
- **Status:** DONE
- **Batch:** 1 (no dependencies)

## User Story

**As** Miguel (Driver),
**I want** to download a PDF receipt for my payment,
**So that** I have proof of payment for my records or to share with my carrier.

## Scope

### Files to modify

| File | Action |
|------|--------|
| `backend/src/controllers/payment.controller.js` | Add `downloadReceipt` handler |
| `backend/src/routes/payment.routes.js` | Add `GET /:id/receipt` route |
| `backend/src/__tests__/payment.controller.test.js` | Add tests for receipt endpoint |

### API Contract

**`GET /api/payments/:id/receipt`**

Requires: `authenticate` middleware

**Behavior:**
1. If `receipt_url` exists in DB → 302 redirect to Stripe-hosted receipt
2. If `receipt_url` is null → generate PDF receipt using pdfkit and stream as response

Response (302 — Stripe receipt):
```
Location: https://pay.stripe.com/receipts/...
```

Response (200 — generated PDF):
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="receipt-<payment-id>.pdf"
```

Error responses:
- 404: `{ "success": false, "message": "Payment not found" }`
- 403: `{ "success": false, "message": "Access denied" }`

### Implementation Notes

- Fetch payment by ID, verify `user_id === userId`
- If `receipt_url` exists: `res.redirect(302, payment.receipt_url)`
- If no `receipt_url`: generate PDF with pdfkit (already in project from sprint 035):
  - Header: "CDL Advisor — Payment Receipt"
  - Fields: Amount, Date, Transaction ID, Card (brand + last4), Case Number
  - Footer: "Secured by Stripe"
- Join `cases` table to get `case_number` for the PDF
- Route must be placed ABOVE `/:id` in payment.routes.js (before the generic getPayment handler) to avoid conflict

## Acceptance Criteria

- [ ] Redirects to Stripe receipt URL when `receipt_url` exists in DB
- [ ] Generates PDF receipt when `receipt_url` is null
- [ ] PDF contains: amount, date, transaction ID, card brand + last4, case number
- [ ] 403 if payment `user_id` does not match authenticated user
- [ ] 404 if payment not found
- [ ] Content-Disposition header set for PDF download with correct filename
- [ ] Tests cover: redirect path, PDF generation path, auth guard (403), not found (404)

## Test Coverage Matrix

| Source File | Test File | Action |
|------------|-----------|--------|
| `backend/src/controllers/payment.controller.js` | `backend/src/__tests__/payment.controller.test.js` | Update |

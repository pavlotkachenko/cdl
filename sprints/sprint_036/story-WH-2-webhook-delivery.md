# Story WH-2 — Webhook Delivery Service

**Sprint:** 036
**Priority:** P2
**Status:** DONE

## Scope
- `backend/src/services/webhook.service.js` — NEW: dispatch(carrierId, event, payload)
- `backend/src/controllers/case.controller.js` — integrate dispatch on status change
- `backend/src/controllers/payment.controller.js` — integrate dispatch on payment

## Events
- case.status_changed, payment.received, attorney.assigned, case.created

## Acceptance Criteria
- [x] Signed POST sent to registered webhook URLs (X-CDL-Signature: sha256=...)
- [x] Inactive webhooks skipped
- [x] Network failures do not throw (fail-safe, non-blocking)
- [x] Retry once on failure before giving up

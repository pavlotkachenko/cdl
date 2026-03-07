# Story WH-1 — Webhook Registration API

**Sprint:** 036
**Priority:** P2
**Status:** DONE

## Scope
- `backend/src/migrations/015_carrier_webhooks.sql` — NEW table: carrier_webhooks
- `backend/src/controllers/webhook.controller.js` — NEW: list, create, update, delete
- `backend/src/routes/webhook.routes.js` — NEW: 4 CRUD routes
- `backend/src/server.js` — mount /api/webhooks

## Acceptance Criteria
- [x] POST /api/webhooks registers URL + events, returns auto-generated secret
- [x] GET /api/webhooks lists carrier's webhooks
- [x] PUT /api/webhooks/:id updates active/url/events
- [x] DELETE /api/webhooks/:id removes webhook
- [x] 403 if no carrierId in token

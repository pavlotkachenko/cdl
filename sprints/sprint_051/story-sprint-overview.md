# Sprint 051 — Operator Case Management: Full Workflow

## Goal
Deliver the complete operator (case manager) workflow as defined by TC-OPR-001 through TC-OPR-007,
closing all feature gaps identified in the requirements analysis. When this sprint is done, an
operator can: view an enriched case queue with priority indicators, open a full case detail view,
assign attorneys (auto or manual with ranking), process batch OCR tickets, use message templates in
driver conversations, and receive real-time notifications — all backed by existing backend
infrastructure and covered by unit + E2E tests.

## Scope
- **Frontend:** 6 new components, 2 new services, routing updates, i18n keys (en/es/fr)
- **Backend:** 3 new endpoints (case detail, batch OCR, admin approve/reject), enriched existing endpoints
- **Testing:** Co-located `.spec.ts` for every new component/service, Cypress specs for TC-OPR-001–007
- **Documentation:** Updated API spec, operator persona docs, RBAC matrix

## Dependencies
- Existing backend services: `assignment.service.js`, `ocr.service.js`, `template.service.js`,
  `conversation.service.js`, `message.service.js`, `notification.service.js`
- Existing backend controllers: `assignment.controller.js`, `ocr.controller.js`,
  `template.controller.js`, `conversation.controller.js`, `operator.controller.js`
- Existing database tables: `cases`, `court_dates`, `assignment_requests`, `message_templates`,
  `conversations`, `messages`, `notifications`, `users`
- Sprint 049 (operator dashboard rewrite) and Sprint 050 (profile/notifications pages) must be complete

## Stories

| # | Story | Priority | Status |
|---|-------|----------|--------|
| OC-1 | Operator case detail component (view, activity log, status) | P0 | DONE |
| OC-2 | Attorney assignment UI (auto-assign + manual with ranking) | P0 | DONE |
| OC-3 | Queue data enrichment (court date, fine amount, priority color) | P0 | DONE |
| OC-4 | Operator messaging & template system | P1 | DONE |
| OC-5 | Batch OCR processing tool | P1 | DONE |
| OC-6 | Real-time updates & notification service integration | P1 | DONE |
| OC-7 | Admin assignment request approval flow | P1 | DONE |
| OC-8 | i18n, accessibility & navigation consolidation | P2 | DONE |
| OC-9 | Documentation & API specification updates | P2 | DONE |
| OC-10 | E2E test coverage (TC-OPR-001 through TC-OPR-007) | P0 | DONE |

## Story Dependency Graph
```
OC-3 (queue enrichment) ──┐
                          ├──▶ OC-1 (case detail) ──▶ OC-2 (attorney assignment)
OC-6 (real-time)─────────┘                              │
                                                         ▼
OC-4 (messaging) ──────────────────────────────────▶ OC-10 (E2E tests)
OC-5 (batch OCR) ──────────────────────────────────▶ OC-10
OC-7 (admin approval) ─────────────────────────────▶ OC-10
OC-8 (i18n/a11y) ──────────────────────────────────▶ OC-10
OC-9 (docs) — no code dependency, can run in parallel
```

## Implementation Order (recommended)
1. **Wave 1 (P0 foundation):** OC-3 → OC-1 → OC-2
2. **Wave 2 (P1 features):** OC-4, OC-5, OC-6, OC-7 (parallel)
3. **Wave 3 (P2 polish):** OC-8, OC-9
4. **Wave 4 (validation):** OC-10

## Files Changed (summary — see individual stories for details)

### Frontend (New)
- `features/operator/case-detail/operator-case-detail.component.ts`
- `features/operator/attorney-assignment/attorney-assignment.component.ts`
- `features/operator/batch-ocr/batch-ocr.component.ts`
- `features/operator/messaging/operator-messaging.component.ts`
- `core/services/operator.service.ts` (dedicated operator API service)
- `core/services/template.service.ts` (message template API)
- Corresponding `.spec.ts` for every new file

### Frontend (Modified)
- `features/operator/operator-routing.module.ts` — new routes for case detail, messaging, batch OCR
- `features/operator/operator-dashboard/operator-dashboard.component.ts` — enriched queue data binding
- `assets/i18n/en.json`, `es.json`, `fr.json` — OPR.* keys for new screens
- `core/services/case.service.ts` — enriched operator case methods

### Backend (New)
- `controllers/operator.controller.js` — `getCaseDetail`, `batchOcr` endpoints
- `routes/operator.routes.js` — new route registrations
- `controllers/admin.controller.js` — `approveAssignment`, `rejectAssignment` endpoints
- Corresponding `__tests__/*.test.js` for new endpoints

### Backend (Modified)
- `controllers/operator.controller.js` — enrich `getOperatorCases` and `getUnassignedCases` with court_date, fine_amount
- `controllers/operator.controller.js` — filter suspended attorneys from `getAvailableAttorneys`

### E2E Tests (New)
- `frontend/cypress/e2e/operator/operator.cy.ts` — TC-OPR-001 through TC-OPR-007

### Documentation (Modified)
- `docs/API_SPECIFICATION.md` — operator endpoints
- `docs/02_PERSONAS_AND_JOURNEYS.md` — operator persona (Lisa) journey updates
- `docs/04_FUNCTIONAL_REQUIREMENTS.md` — operator RBAC matrix

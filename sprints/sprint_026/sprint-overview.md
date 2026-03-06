# Sprint 026 — Launch Hardening

**Theme:** Close gaps before beta launch — security, observability, and polish.

**Status:** COMPLETE

---

## Stories

| ID | Title | Status |
|----|-------|--------|
| LH-1 | Rate Limiting + CORS Hardening | DONE |
| LH-2 | Missing Email Triggers | DONE |
| LH-3 | Empty States on Remaining Dashboards | DONE |
| LH-4 | Carrier Analytics Tests Expansion | DONE |
| LH-5 | Payment Flow Cypress E2E | DONE |
| LH-6 | Audit Infrastructure | DONE |

---

## Changes by Story

### LH-1 — Rate Limiting + CORS Hardening
- Installed `express-rate-limit` in backend
- Auth routes `/api/auth/*`: 100 req / 15 min window
- Public submit `/api/cases/public-submit`: 10 req / 15 min window
- CORS: Added `PRODUCTION_URL` env var support; dynamic origin callback (no wildcard)
- Tests: `backend/src/__tests__/server.ratelimit.test.js` — 11 tests

### LH-2 — Missing Email Triggers
- `email.service.js`: Added `sendCaseSubmissionEmail` and `sendAttorneyAssignmentEmail`
- `case.controller.js`: Non-blocking email trigger in `publicSubmit`, `createCase`, `assignToAttorney`
- `case.controller.js`: Extended attorney user select to include `email` field
- Tests: Extended `email.service.test.js` — now 12 tests

### LH-3 — Empty States on Remaining Dashboards
- Admin dashboard: Upgraded "No cases found." to icon + heading + helper text + CTA
- Carrier analytics: Added zero-data full-page empty state when `totalCases === 0`
- Carrier analytics: Chart sections upgraded from plain `<p>` to icon + message pattern

### LH-4 — Carrier Analytics Tests Expansion
- `carrier-analytics.component.spec.ts`: Added 11 new tests (zero-data state, chart empties, bar height edge cases, export states, loading/error behavior)
- Total: 22 tests (was 11)

### LH-5 — Payment Flow Cypress E2E
- `frontend/cypress/e2e/payment-flow.cy.ts`: 8 test scenarios across 7 describe blocks
  - Success (4242...), Declined (4000...0002), Insufficient funds (9995), 3DS (3220), Expired (0069), Wrong CVC (0127), Backend 404, Backend 500
  - All use `cy.intercept` for mock Stripe/backend responses (no real network calls)

### LH-6 — Audit Infrastructure
- `scripts/lighthouse-audit.sh`: Executable script auditing 5 key pages, saves JSON reports to `docs/audit/lighthouse/`
- `frontend/cypress/e2e/accessibility.cy.ts`: WCAG 2.1 AA checks on public pages using cypress-axe
- `docs/audit/SECURITY_CHECKLIST.md`: 50-item pre-launch security review checklist
- `docs/audit/LAUNCH_CHECKLIST.md`: Go/no-go launch checklist with sign-off table

# Story CR-1: DOT Compliance Report

**As a** carrier, **I want to** generate a printable violation history report **so that** I can prepare for DOT audits with accurate records.

## Acceptance Criteria
- Optional date range filters (from / to)
- Table: case#, driver, CDL, violation, state, status, date, attorney
- Print button triggers `window.print()` with print-optimised CSS
- Empty state when no violations in range

## Files
- `backend/src/controllers/carrier.controller.js` — `getComplianceReport`
- `backend/src/routes/carrier.routes.js` — `GET /me/compliance-report`
- `frontend/.../compliance-report/compliance-report.component.ts`
- `frontend/.../compliance-report/compliance-report.component.spec.ts`
- `frontend/.../carrier-routing.module.ts` — `/compliance-report` route

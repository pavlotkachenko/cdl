# Story PE-2 — Carrier Compliance Report PDF

**Sprint:** 035 — PDF Export
**Priority:** P1
**Status:** DONE

## Scope
- `backend/src/services/pdf.service.js` — NEW: generateComplianceReport(rows, from, to) → Buffer using pdfkit
- `backend/src/controllers/carrier.controller.js` — ADD: downloadComplianceReport()
- `backend/src/routes/carrier.routes.js` — ADD: GET /me/compliance-report/pdf
- `frontend/.../compliance-report/compliance-report.component.ts` — ADD: "Download PDF" button

## Acceptance Criteria
- [x] GET /api/carriers/me/compliance-report/pdf returns Content-Type: application/pdf
- [x] PDF has header with date range and fleet info
- [x] Table with 8 columns matching the compliance report data
- [x] Browser download triggered via blob URL

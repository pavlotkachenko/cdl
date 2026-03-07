# Story PE-1 — Driver Invoice PDF

**Sprint:** 035 — PDF Export
**Priority:** P1
**Status:** DONE

## User Story
As Miguel (driver), I want to download a proper PDF of my invoice so I can keep records.

## Scope
- `frontend/src/app/features/driver/case-invoice/case-invoice-section.component.ts`
  - Add `downloadPdf()` using jsPDF + autoTable
  - Replace print button with "Download PDF" button

## Acceptance Criteria
- [x] Clicking "Download PDF" triggers browser file download
- [x] PDF filename: `invoice-<invoiceNumber>.pdf`
- [x] PDF contains invoice number, driver name, attorney, amount, issued date
- [x] No backend call needed (data already loaded)

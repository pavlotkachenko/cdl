# Story BO-1: Bulk Ticket CSV Import

**As a** carrier, **I want to** upload a CSV of driver violations **so that** I can create multiple cases at once without manual entry.

## Acceptance Criteria
- CSV columns: `cdl_number`, `violation_type`, `state` (required); `incident_date` (optional)
- File drag-and-drop or paste text input supported
- Preview table shows valid/invalid rows before confirming
- Only rows with matching CDL in fleet are imported
- Imported count and errors reported in snackbar

## Files
- `backend/src/controllers/carrier.controller.js` — `bulkImport`
- `backend/src/routes/carrier.routes.js` — `POST /me/bulk-import`
- `frontend/.../bulk-import/bulk-import.component.ts`
- `frontend/.../bulk-import/bulk-import.component.spec.ts`

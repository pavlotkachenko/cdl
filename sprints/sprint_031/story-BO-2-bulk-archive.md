# Story BO-2: Bulk Case Archive

**As a** carrier, **I want to** select multiple cases and archive them at once **so that** I can clean up resolved or irrelevant cases efficiently.

## Acceptance Criteria
- Checkboxes on each case card in carrier cases view
- Bulk action bar appears when ≥1 case selected showing count + Archive button
- Archive sets status=closed for all selected cases belonging to this carrier
- Selection cleared after archive; snackbar shows count archived

## Files
- `backend/src/controllers/carrier.controller.js` — `bulkArchive`
- `backend/src/routes/carrier.routes.js` — `POST /me/cases/bulk-archive`
- `frontend/.../cases/carrier-cases.component.ts` — updated with selection
- `frontend/.../cases/carrier-cases.component.spec.ts` — 6 new tests

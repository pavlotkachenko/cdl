# Story CD-1: Carrier Documents Page

**Status:** DONE

## Description
New documents page for the carrier portal with category filtering and file type indicators.
Shows compliance reports, insurance certificates, ticket photos, and other fleet documents.

## Acceptance Criteria
- [x] Category filter chips (All, Compliance, Tickets, Insurance, Reports, Import, Maintenance)
- [x] Document cards with file type icons (PDF=red, CSV=green, Image=blue)
- [x] Document metadata (size, date, category)
- [x] Download button on each document
- [x] Link to compliance report generator
- [x] 9 mock documents across all categories
- [x] Signals + computed + OnPush + standalone component
- [x] Route: `/carrier/documents` (lazy-loaded)

## Files Changed
- `frontend/src/app/features/carrier/documents/carrier-documents.component.ts` — new component
- `frontend/src/app/features/carrier/carrier-routing.module.ts` — added documents route

# MD-6: Carrier: migrate documents and analytics to live data

**Status:** TODO
**Priority:** P1
**Dependencies:** MD-1

## Description
Replace carrier document mocks and carrier service analytics fallback data with real API calls. The carrier service has a particularly insidious pattern: mock data is returned in catchError() blocks, silently masking API failures.

## Acceptance Criteria

- [ ] carrier-documents.component.ts: mock document data removed -- from GET /api/carrier/documents
- [ ] carrier.service.ts: mock fleet analytics fallback removed -- error shown to user instead
- [ ] SkeletonLoader shown during data fetch
- [ ] Empty state shown when carrier has no documents
- [ ] ErrorState shown on API failure (no silent mock fallback)
- [ ] carrier.service.ts: catchError() blocks propagate errors instead of returning mock data
- [ ] Co-located spec files updated

## Files

- `frontend/src/app/features/carrier/documents/carrier-documents.component.ts`
- `frontend/src/app/features/carrier/documents/carrier-documents.component.spec.ts`
- `frontend/src/app/core/services/carrier.service.ts`
- `frontend/src/app/core/services/carrier.service.spec.ts`

## Technical Notes

- The carrier.service.ts mock fallback pattern is especially dangerous because it masks real API failures -- users see "data" but it's fake
- Fleet analytics data (vehicle counts, compliance rates, violation trends) should come from aggregated case/vehicle data
- Documents should include compliance documents, insurance certificates, and driver qualification files
- The carrier documents endpoint should support filtering by document type and date range
- Ensure the carrier service error propagation doesn't break other components that consume it -- check all injection sites

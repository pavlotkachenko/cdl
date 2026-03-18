# MD-8: Remove messaging mock service and all remaining MOCK_ constants from production code

**Status:** TODO
**Priority:** P2
**Dependencies:** MD-2, MD-3, MD-4, MD-5, MD-6, MD-7

## Description
Final cleanup pass. Delete or deprecate the messaging mock service. Search the entire codebase for any remaining MOCK_, mock, dummy, fake, sample constants in production (non-test, non-story) files. This story ensures zero mock data leaks into production after all role-specific migrations are complete.

## Acceptance Criteria

- [ ] messaging.service.mock.ts deleted or moved to test fixtures directory
- [ ] grep -r "MOCK_" across all .ts files (excluding .spec.ts, .stories.ts) returns zero results
- [ ] grep -r "mockData\|dummyData\|sampleData\|fakeData" across .ts files (excluding tests) returns zero results
- [ ] No setTimeout-based fake loading patterns in production code
- [ ] No simulated incoming message/notification patterns in production code
- [ ] All mock constants that are useful for testing preserved in test fixture files
- [ ] ng build succeeds with no errors
- [ ] ng test passes with no regressions

## Files

- `frontend/src/app/features/driver/services/messaging.service.mock.ts`
- Any remaining files found during grep audit

## Technical Notes

- Run comprehensive grep searches to find any mock data that was missed in stories MD-2 through MD-7
- Search patterns to check:
  - `MOCK_` prefix constants
  - `mockData`, `dummyData`, `sampleData`, `fakeData` variable names
  - `generateMock` function names
  - `simulateIncoming`, `simulateResponse` function names
  - Hardcoded arrays of objects with fake names/emails/phones in non-test files
  - `setTimeout` with random delays used to simulate API latency
  - `catchError` blocks that return `of(MOCK_*)` instead of propagating errors
- Mock constants that are valuable for testing should be moved to a shared test fixtures location or kept in individual .spec.ts files
- Verify the build succeeds after all removals -- some components may have implicit dependencies on mock imports

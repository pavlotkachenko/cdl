# Story BO-3: Backend + Frontend Tests

## Backend Tests (`carrier.bulk.test.js`)
- bulkImport: 403 no carrier, 400 missing csv, 400 header only, 400 missing cols, imports valid + reports errors, 500 on DB error
- bulkArchive: 403 no carrier, 400 empty ids, archives and returns count, 500 on DB error
- getComplianceReport: 403 no carrier, returns rows + generated_at, date params appended, 500 on DB error

**Total: 14 tests — all pass**

## Frontend Tests
- `bulk-import.component.spec.ts` — 6 tests
- `compliance-report.component.spec.ts` — 6 tests
- `carrier-cases.component.spec.ts` — 11 tests (5 existing + 6 new)

**Frontend total: 611/611 pass**

# Sprint 073 — Admin Backend Fixes & Performance

**Goal:** Fix 6 critical admin backend bugs, add missing API fields for Reports page, and optimize query performance (48→2 queries for staff performance, 15 sequential→parallel for dashboard stats).
**Branch:** `fix/sprint-073-admin-fixes`
**Created:** 2026-03-20

## Stories

| # | ID | Title | Priority | Status | Depends On |
|---|-----|-------|----------|--------|------------|
| 1 | AF-1 | Fix auth middleware and admin controller bugs | P0 | DONE | none |
| 2 | AF-2 | Add missing dashboard stats and performance fields | P0 | DONE | AF-1 |
| 3 | AF-3 | Parallelize admin API queries for performance | P1 | DONE | AF-2 |
| 4 | AF-4 | Fix Reports component data population | P1 | DONE | AF-2 |
| 5 | AF-5 | Update backend tests for admin controller changes | P0 | DONE | AF-1, AF-2, AF-3 |

## Definition of Done

- [x] All story statuses are DONE
- [x] All acceptance criteria checked in every story file
- [x] Backend tests pass: `cd backend && npm test`
- [x] Frontend tests pass: `cd frontend && npx ng build --configuration=development`
- [x] No uncommitted changes
- [ ] PR created and approved by human reviewer

## Dependencies

- None — all changes are self-contained backend fixes and frontend data mapping

## Notes

- Addresses regression items from TD-002 (admin regression report) and data requirements from TD-003
- Backend: 678/680 tests pass (2 pre-existing BUG-004 integration failures)
- Frontend: build succeeds; 8 admin spec files have pre-existing TranslateService injection failures (not caused by this sprint)

# Story 6.3 — Tests: assignment.service.js

**Epic:** Backend Test Coverage
**Priority:** HIGH
**Status:** DONE

## User Story
As a developer,
I want unit tests for the attorney scoring algorithm,
so that scoring weight changes don't silently break attorney ranking.

## Scope
- `calculateScore` — all 5 scoring dimensions (pure function, no mocks)
- `rankAttorneys` — sorted descending by score (DB mocked)
- `autoAssign` — no available attorneys throws
- File: `backend/src/__tests__/assignment.service.test.js`

## Acceptance Criteria
- [x] Full-match attorney scores 100
- [x] Unlicensed state gives 0 state score
- [x] 50+ cases gives 0 workload score
- [x] Availability scores map correctly (available=100, busy=30, unavailable=0)
- [x] `rankAttorneys` returns descending order
- [x] `autoAssign` throws when all attorneys are unavailable

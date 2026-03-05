# Story 6.2 — Tests: workflow.service.js

**Epic:** Backend Test Coverage
**Priority:** HIGH
**Status:** DONE

## User Story
As a developer,
I want unit tests for status transition logic,
so that invalid case transitions and missing email triggers are caught by CI.

## Scope
- `validateStatusTransition` — valid paths, invalid paths, terminal states, missing params
- `updateCaseStatus` — happy path, case not found, DB error, invalid transition, driver email for visible statuses, no email for internal statuses
- File: `backend/src/__tests__/workflow.service.test.js`

## Acceptance Criteria
- [x] Valid transitions (new→assigned, resolved→closed) return `valid: true`
- [x] Invalid transitions return `valid: false` with descriptive error
- [x] Terminal statuses (closed, withdrawn) have no allowed transitions
- [x] `updateCaseStatus` throws on case not found
- [x] `sendCaseStatusEmail` called for driver-visible statuses (assigned, in_progress, etc.)
- [x] `sendCaseStatusEmail` NOT called for internal statuses (under_review)

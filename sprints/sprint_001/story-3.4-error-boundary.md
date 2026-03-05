# Story 3.4 — Global Error Boundary & API Error Messages

**Epic:** Loading States & Error Handling
**Priority:** HIGH
**Status:** DONE

## User Story
As a user who encounters an unexpected error,
I want a clear, friendly message instead of a blank screen,
so that I know what happened and what to do.

## Scope
- Add Angular `ErrorHandler` that catches unhandled exceptions → show toast "Something went wrong. Please try again."
- Standardize HTTP error handling in Angular services:
  - 500 → "Server error, please try again"
  - 403 → "You don't have permission"
  - Network error → "No connection — check your internet"
- No stack traces exposed to user (log to console only)

## Acceptance Criteria
- [ ] 500 API response shows user-friendly snackbar, not raw error
- [ ] Network offline shows "No connection" message
- [ ] Global ErrorHandler logs to console but shows generic message to user
- [ ] Unit test: ErrorHandler catches thrown exception, shows snackbar, does not rethrow to browser

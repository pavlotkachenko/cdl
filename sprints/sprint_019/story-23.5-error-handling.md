# Story 23.5 — Error Scenario Coverage (Launch Gate 5)

**Epic:** Launch Gate Sprint
**Sprint:** 019
**Priority:** HIGH
**Status:** TODO

## User Story

As any user,
I want to see a clear, helpful message when something goes wrong,
so I never see a blank screen, spinner that never stops, or a stack trace.

## Scope

Achieve zero unhandled exceptions across 100 test scenarios to pass Launch Gate 5.

## Error Scenario Catalogue

### Network Errors (simulate with `cy.intercept`)

| Scenario | Expected Behaviour |
|---|---|
| API returns 500 on ticket submit | SnackBar: "Something went wrong. Please try again." Submit button re-enabled |
| API returns 404 on case load | Redirect to dashboard with snackBar: "Case not found" |
| API returns 401 (token expired) | Auth interceptor triggers logout + redirect to `/auth/login` |
| API returns 403 (wrong role) | SnackBar: "You don't have permission for this action" |
| Network offline during payment | SnackBar: "Check your connection and try again." Payment not double-charged |
| Stripe JS fails to load | Inline error: "Payment processor unavailable. Please refresh." |
| OCR endpoint returns 500 | SnackBar: "Couldn't read ticket automatically. Please enter details manually." Wizard continues |
| File upload timeout | SnackBar: "Upload timed out. Please try a smaller image." |

### Validation Errors

| Scenario | Expected Behaviour |
|---|---|
| Submit empty ticket form | Field-level errors highlight; form does not submit |
| Invalid email on registration | Inline error: "Enter a valid email address" |
| Password too short | Inline error: "Password must be at least 8 characters" |
| Duplicate email on register | SnackBar: "An account with this email already exists" |
| File too large (> 10MB) | SnackBar: "Image must be under 10MB" |
| File wrong type | SnackBar: "Please select an image file (JPG, PNG, HEIC)" |

### Navigation / State Errors

| Scenario | Expected Behaviour |
|---|---|
| Direct URL to payment (no state) | Redirect to case detail |
| Direct URL to payment-success (no state) | Redirect to case detail |
| Route not found (404) | 404 page with "Go to Dashboard" CTA |
| Auth guard blocks unauthenticated route | Redirect to `/auth/login` |

## Global Error Handling Requirements

- [ ] Angular `ErrorHandler` override catches unhandled errors — logs to console, shows generic snackBar
- [ ] HTTP interceptor handles 401 (auto-logout), 403 (permission snackBar), 5xx (generic snackBar)
- [ ] No `alert()` calls anywhere in the codebase (search and replace)
- [ ] No raw `console.error` with stack traces visible to users
- [ ] All `catch` blocks in services show user-friendly snackBar, not `throw` silently

## Acceptance Criteria

- [ ] `grep -r "alert(" frontend/src` returns zero results
- [ ] All 8 network error scenarios tested in Cypress (`frontend/cypress/e2e/error-scenarios.cy.ts`)
- [ ] Global `ErrorHandler` implemented and tested
- [ ] Zero unhandled promise rejections in browser console during full flow walkthrough

## Files to Create / Modify

- `frontend/src/app/core/handlers/global-error.handler.ts` (create)
- `frontend/src/app/core/interceptors/http-error.interceptor.ts` (update)
- `frontend/cypress/e2e/error-scenarios.cy.ts` (create)
- Any component still using `alert()`
- Test file: `global-error.handler.spec.ts`

# Story LH-2 — Missing Email Triggers

**Sprint:** 026 — Launch Hardening
**Status:** DONE

## Scope

Wire the remaining missing email notifications to the case lifecycle so drivers and attorneys receive confirmations at every key event.

## Changes

### `backend/src/services/email.service.js` — UPDATED
- Added `sendCaseSubmissionEmail(driverEmail, caseData)` — triggered on new case creation
- Added `sendAttorneyAssignmentEmail(attorneyEmail, driverName, caseData)` — triggered when attorney assigned

### `backend/src/controllers/case.controller.js` — UPDATED
- `publicSubmit`: non-blocking email trigger via `sendCaseSubmissionEmail`
- `createCase`: non-blocking email trigger via `sendCaseSubmissionEmail`
- `assignToAttorney`: non-blocking email trigger via `sendAttorneyAssignmentEmail`
- Extended attorney user `select` to include `email` field (required for assignment email)

### `backend/src/__tests__/email.service.test.js` — EXTENDED
- Now 12 tests (up from previous count)
- New tests: `sendCaseSubmissionEmail` happy path, `sendCaseSubmissionEmail` SendGrid error handling, `sendAttorneyAssignmentEmail` happy path, `sendAttorneyAssignmentEmail` error handling

## Email Coverage After This Story

| Event | Email Recipient | Status |
|---|---|---|
| Driver registration | Driver | ✅ pre-existing |
| Payment confirmed | Driver | ✅ pre-existing |
| Case status update | Driver | ✅ pre-existing |
| Case submitted | Driver | ✅ new |
| Attorney assigned to case | Attorney | ✅ new |
| Case resolved | Driver | ⏳ V1 |
| Payment plan installment charged | Driver | ⏳ V1 |

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `backend/src/services/email.service.js` | `backend/src/__tests__/email.service.test.js` | ✅ |
| `backend/src/controllers/case.controller.js` | `backend/src/__tests__/case.controller.test.js` | ✅ pre-existing |

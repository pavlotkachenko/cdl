# Story 22 — Submit Ticket Component Rewrite (Angular 21)

**Sprint:** 018 — Submit Ticket Angular 21 Migration
**Status:** DONE

## Scope

Angular 21 rewrite of `SubmitTicketComponent` to 4-step MatStepper flow with signals, OCR auto-fill, and proper snackBar error handling.

## Changes

### 22.1 `submit-ticket.component.ts` — REWRITTEN

**Architecture:** 4-step `MatStepper` flow:
1. **Scan / OCR** — photo upload, triggers `OcrService.processTicketImage()`
2. **Type** — violation type selection (OCR pre-filled if available)
3. **Details** — date, state, fine amount (OCR pre-filled)
4. **Submit** — review + submit to backend

**Key changes from previous version:**
- Full Angular 21 signals: `ocrResult`, `ocrFieldCount` (computed), `uploading`, `submitting`
- `MatSnackBar` replaces all `alert()` calls
- OCR auto-fill via `OcrService.processTicketImage(file)` → `applyOcrResults(data)`
- File validation: type check (image/*) + size limit with snackBar feedback
- `removeFile()` clears selection and resets OCR state
- `getFileSize(bytes)` — human-readable size string
- `submitTicket()` — validates form, calls backend, navigates to `/driver/tickets/:id`
- `submitAnother()` — resets stepper and all signals to initial state

### 22.2 `submit-ticket.component.spec.ts` — 17 NEW TESTS

| Test | Coverage |
|---|---|
| OCR scan success | `processTicketImage` resolves → `ocrResult` signal set, fields patched |
| OCR scan error | service throws → snackBar error shown, `uploading` cleared |
| OCR scan empty result | empty `extractedData` → no patch, snackBar warning |
| `applyOcrResults` patching | all OCR fields applied to correct form controls |
| `ocrFieldCount` computed | returns count of non-null OCR fields |
| File size validation | file > limit → snackBar error, file not set |
| File type validation | non-image file → snackBar error, file not set |
| `removeFile` | clears file signal + resets `ocrResult` to null |
| `getFileSize` bytes | `< 1024` → `"N bytes"` |
| `getFileSize` KB | `1024–1048575` → `"N.N KB"` |
| `getFileSize` MB | `≥ 1048576` → `"N.N MB"` |
| `submitTicket` success | valid form → POST succeeds → navigate to ticket detail |
| `submitTicket` invalid form | invalid → no POST, stepper stays |
| `submitTicket` error | POST fails → snackBar error, `submitting` cleared |
| `viewTicket` navigation | navigates to `/driver/tickets/:ticketId` |
| `submitAnother` reset | all signals cleared, stepper reset to step 0 |
| Component creation | instantiates without errors |

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `features/driver/submit-ticket/submit-ticket.component.ts` | `submit-ticket.component.spec.ts` | ✅ |

## Total

419/419 tests pass (was 402 before Sprint 018, +17 new tests).

# Story 9.5 — Sprint 005 Tests

**Epic:** Complete Driver End-to-End Journey
**Priority:** HIGH
**Status:** TODO

## Scope

### `payment-success.component.spec.ts`
- Renders "Payment Received!" heading
- Displays amount and transactionId from router state
- `viewCase()` navigates to `/driver/cases/:caseId`
- `goToDashboard()` navigates to `/driver/dashboard`
- Redirects to case detail when no payment state (direct URL access)

### `attorney-recommendation.component.spec.ts`
- Loads attorneys on init via `getRecommendedAttorneys()`
- Renders recommended badge for `isRecommended` attorney
- Shows empty state when attorney list is empty
- `selectAttorney()` calls `caseService.selectAttorney()` + navigates on success
- `selectAttorney()` shows error snackbar + clears `selecting` on failure
- `goBack()` navigates to `/driver/dashboard`

### `case-payment.component.spec.ts`
- Loads case details on init (`loadingCase` → false)
- Creates payment intent after case loads
- Shows case number, attorney name, amount
- `goBack()` navigates to `/driver/cases/:caseId`
- Shows error snackbar when case load fails
- `pay()` is a no-op when stripe not ready

### `ocr.service.spec.ts` (frontend)
- `processTicketImage` sends multipart POST to `/api/ocr/extract`
- Maps response `data` into `OCRResult` shape
- `getConfidenceLevel` returns correct labels for high/medium/low confidence
- `validateOCRData` returns warnings for missing optional fields

## Acceptance Criteria
- [ ] All spec files use Vitest globals (`vi.fn()`, no `jest.`)
- [ ] No `fakeAsync` / `tick` — use synchronous observable patterns
- [ ] MatSnackBar spied via `fixture.debugElement.injector.get(MatSnackBar)`
- [ ] All tests pass: `npx ng test --no-watch`

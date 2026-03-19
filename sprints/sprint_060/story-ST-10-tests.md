# Story ST-10: Tests — Full Coverage for All Changes

## Status: DONE

## Description
Update and expand test coverage for all Sprint 060 changes across backend and frontend.

## Backend Tests

### `backend/src/__tests__/case.controller.test.js`
- Test createCase with new fields: `citation_number`, `fine_amount`, `alleged_speed`
- Test validation: `fine_amount` < 0 rejected
- Test validation: `alleged_speed` < 1 or > 300 rejected
- Test validation: new violation_type values accepted (`hos_logbook`, `dot_inspection`, etc.)
- Test: `alleged_speed` stripped when violation_type is not `speeding`
- Test: existing createCase payload still works (backward compat)

## Frontend Tests

### `submit-ticket.component.spec.ts`
Update existing 16 tests + add new tests:

**Stepper:**
- Custom stepper renders 4 steps
- Step state updates correctly (done/current/todo)
- Navigation between steps works

**Violation Type Chips:**
- 7 chips rendered
- Click selects chip and updates form
- Only one chip selected at a time
- Form invalid without selection
- Keyboard: Enter/Space selects chip

**Form Fields:**
- Fine amount field present and optional
- Alleged speed visible only when type=speeding
- Alleged speed hidden when type changes away from speeding
- Character counter updates on description input
- Description capped at 500 characters
- State dropdown has all 50 states + DC
- All required fields show error on submit attempt

**Info Sidebar:**
- Progress card updates with step changes
- Tips card renders 4 tips
- What Happens Next card renders 3 items

**OCR Integration:**
- OCR maps fineAmount to form field
- OCR maps violationType to chip selection
- OCR type mapping handles fuzzy matches

**Review Step:**
- All form data displayed in review
- Payload maps camelCase to snake_case correctly
- Submit button disabled during submission

**Shared Component:**
- `wizard-stepper.component.spec.ts` — step rendering, state classes, accessibility

## Acceptance Criteria
- [ ] Backend tests pass with new validation rules
- [ ] Frontend tests cover all new UI elements
- [ ] Wizard stepper component has spec file
- [ ] All existing tests still pass (regression)
- [ ] `npx ng test --no-watch` — all pass
- [ ] `cd backend && npm test` — no new failures

## Files to Modify/Create
- `backend/src/__tests__/case.controller.test.js`
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.spec.ts`
- `frontend/src/app/shared/components/wizard-stepper/wizard-stepper.component.spec.ts`

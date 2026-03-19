# Story CD-6: Frontend — Edit Mode Implementation

## Meta

- **Sprint:** 065
- **Priority:** P1
- **Status:** DONE
- **Batch:** 3 (depends on CD-4)

## User Story

**As** Miguel (Driver),
**I want** to edit my case details (description, violation details) directly from the case detail page,
**So that** I can correct mistakes or add information without contacting support.

## Problem

The current component has edit mode stubs:
- `toggleEdit()` — toggles `isEditing` boolean
- `saveChanges()` — uses `setTimeout` to simulate save, never calls API
- Template has Edit/Cancel/Save buttons but no actual form fields in edit mode
- The backend `PATCH /api/cases/:id` endpoint exists and works (restricted to operator/attorney/admin roles)

## Scope

### Files to modify

| File | Action |
|------|--------|
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | Add edit form, save logic |
| `frontend/src/app/features/driver/case-detail/case-detail.component.spec.ts` | Add edit mode tests |
| `backend/src/routes/case.routes.js` | Extend PATCH authorize to include `driver` role (with field restrictions) |
| `backend/src/controllers/case.controller.js` | Add field-level restrictions for driver edits |
| `backend/src/__tests__/case.controller.test.js` | Add tests for driver edit |

### Editable Fields (Driver)

Drivers should only be able to edit:
- `description` — violation description / additional details
- `location` — violation location (if needed to correct)

Drivers should NOT be able to edit:
- `status`, `assigned_attorney_id`, `attorney_price`, `court_date`, `violation_type`, etc.

### Implementation

#### Backend
1. Add `driver` to the authorize list for `PATCH /api/cases/:id`
2. Add field-level restriction: if `req.user.role === 'driver'`, only allow `description` and `location` fields
3. Reject other fields with 403 error: `{ error: { code: 'FIELD_NOT_EDITABLE', message: 'Drivers can only edit description and location' } }`

#### Frontend
1. **Edit mode signal:** `isEditing = signal(false)`
2. **Edit form:** Reactive form with `description` and `location` controls, pre-populated from case data
3. **Toggle edit:** Button in case hero header (pencil emoji)
4. **Save:** Call `CaseService.updateCase(caseId, { description, location })`, update local case signal on success
5. **Cancel:** Reset form to original values, exit edit mode
6. **Saving state:** `saving = signal(false)` — disable save button while in progress
7. **Success feedback:** Brief "Changes saved" toast (custom, no MatSnackBar)
8. **Error handling:** Show error message if save fails

### UI in Edit Mode

- Info grid: `description` and `location` fields become editable textareas/inputs
- Other fields remain read-only
- Save/Cancel buttons replace Edit button in header
- Visual indicator: light blue/teal border around editable fields

## Acceptance Criteria

- [ ] Edit button shown in case hero header (pencil emoji)
- [ ] Clicking Edit enters edit mode — description and location become editable
- [ ] Cancel discards changes and exits edit mode
- [ ] Save calls `PATCH /api/cases/:id` with edited fields
- [ ] Save button disabled while saving
- [ ] Success: local case data updated, toast shown, edit mode exits
- [ ] Error: error message shown, edit mode stays open
- [ ] Backend restricts driver edits to `description` and `location` only
- [ ] Backend rejects other fields from driver with 403
- [ ] Operator/attorney/admin can still edit all fields (unchanged)
- [ ] All Angular 21 conventions (signals, reactive form, inject)
- [ ] All tests pass: `cd backend && npm test` and `cd frontend && npx ng test --no-watch`

## Test Coverage Matrix

| Source File | Test File | Action |
|------------|-----------|--------|
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | `case-detail.component.spec.ts` | Update |
| `backend/src/controllers/case.controller.js` | `backend/src/__tests__/case.controller.test.js` | Update |

## Test Cases Required

### Frontend
1. Edit button toggles edit mode
2. In edit mode, description and location fields are editable
3. Cancel resets form and exits edit mode
4. Save calls updateCase with correct fields
5. Save disables button during request
6. Successful save updates local data and exits edit mode
7. Failed save shows error and stays in edit mode

### Backend
8. Driver can PATCH description and location on own case
9. Driver cannot PATCH status field (403)
10. Driver cannot PATCH attorney_price field (403)
11. Operator/attorney can still PATCH all fields (unchanged behavior)

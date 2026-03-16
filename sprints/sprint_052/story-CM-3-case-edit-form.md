# Story CM-3: Case Data Edit Form

## Status: DONE

## Priority: P0

## Depends On: CM-1 (canAccessCase fix, document upload auth), Sprint 051 OC-1 (case detail page)

## Description
Add inline editing capability to the operator case detail page so operators can update case
data fields. The existing `PATCH /api/cases/:id` backend endpoint already supports updates
and is authorized for operators — this story builds the frontend form.

### User Story
> As an **operator**, I want to edit case fields (violation details, court date, fine amount,
> state, county, notes) directly on the case detail page, so I can keep case data accurate
> as new information comes in.

## Design Approach: View/Edit Mode Toggle
Rather than a separate edit page, the case detail page gets a **toggle button** that switches
between view mode (current read-only display) and edit mode (reactive form with editable
fields). This keeps the operator in context and avoids page navigation.

**View mode:** All fields displayed as text (current behavior from OC-1).
**Edit mode:** Editable fields become form inputs; non-editable fields stay as text with
a lock icon.

### Editable Fields
| Field | Input Type | Validation | DB Column |
|-------|-----------|------------|-----------|
| Violation type | Select dropdown | Required, valid enum | `violation_type` |
| Violation date | Date picker | Required, not future | `violation_date` |
| Violation details | Textarea | Optional, max 2000 chars | `violation_details` |
| State | Select (US states) | Required, 2 chars | `state` |
| County | Text input | Optional, max 100 chars | `county` |
| Town | Text input | Optional, max 100 chars | `town` |
| Court date | Date picker | Optional, not past | `court_date` |
| Next action date | Date picker | Optional | `next_action_date` |
| Fine amount | Number input | Optional, ≥0 | `attorney_price` |
| Court fee | Number input | Optional, ≥0 | `court_fee` |
| Carrier | Text input | Optional, max 255 chars | `carrier` |

### Non-Editable Fields (shown as read-only with lock icon)
| Field | Reason |
|-------|--------|
| Case number | System-generated, immutable |
| Driver name / contact | Belongs to driver, operator shouldn't change |
| Created date | Immutable timestamp |
| Assigned operator | Changed via assignment flow, not inline |
| Assigned attorney | Changed via assignment flow |

## Frontend Changes

### New Component: `CaseEditFormComponent`
**Path:** `frontend/src/app/features/operator/case-edit/case-edit-form.component.ts`

**Inputs:**
- `caseData = input.required<CaseDetail>()` — the case to edit
- `readonly = input<boolean>(false)` — force read-only mode (for paralegal role later)

**Outputs:**
- `saved = output<CaseDetail>()` — emits updated case after successful save
- `cancelled = output<void>()` — emits when edit is cancelled

**Signals:**
- `editing = signal(false)` — view/edit toggle
- `saving = signal(false)` — loading state
- `dirty = signal(false)` — form has unsaved changes
- `error = signal('')`

**Reactive Form:**
```typescript
private fb = inject(FormBuilder);

form = this.fb.group({
  violation_type: ['', Validators.required],
  violation_date: ['', Validators.required],
  violation_details: ['', Validators.maxLength(2000)],
  state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
  county: ['', Validators.maxLength(100)],
  town: ['', Validators.maxLength(100)],
  court_date: [''],
  next_action_date: [''],
  attorney_price: [null, [Validators.min(0)]],
  court_fee: [null, [Validators.min(0)]],
  carrier: ['', Validators.maxLength(255)],
});
```

**Template:**
1. **Header row:** "Case Details" title + Edit button (pencil icon) / Save & Cancel buttons
2. **Form grid** — 2-column layout on desktop, single column on mobile:
   - Each field shows label + value in view mode, or label + input in edit mode
   - Non-editable fields always show as text with subtle lock icon
   - Validation errors appear below each input as mat-error
3. **Unsaved changes guard:**
   - When `dirty()` is true and user tries to leave edit mode or navigate away, show
     confirmation dialog: "You have unsaved changes. Discard?"
   - `CanDeactivate` guard on the route (or handled by parent component)
4. **Save action:**
   - Collect only changed fields (diff against original)
   - Call `PATCH /api/cases/:id` with changed fields only
   - On success: emit `saved`, show snackbar "Case updated", switch to view mode
   - On error: show error below form, stay in edit mode
5. **Cancel action:**
   - If dirty, confirm discard
   - Reset form to original values
   - Switch to view mode

**Styling:**
- View mode: clean, card-based layout matching OC-1 design
- Edit mode: inputs appear with smooth transition (`@if` with animation)
- Invalid fields have red border + error text
- Save button is `mat-flat-button` primary; Cancel is `mat-stroked-button`
- Responsive: 2-column grid on ≥768px, single column below

### Integration with Case Detail Page
The case edit form replaces the static "Ticket details" grid in OC-1's case detail
component. The case detail component passes `caseData()` as input and handles `saved`
by refreshing data.

### Service Method
In `case.service.ts` or `operator.service.ts`:
```typescript
updateCase(caseId: string, fields: Partial<CaseUpdate>): Observable<CaseDetail>
```

## Backend Changes

### Minor: Field Whitelisting in `updateCase`
The existing `updateCase` controller deletes `id`, `case_number`, `driver_id`, `created_at`
from the update payload. Also add to the blocklist:
- `assigned_operator_id` — changed via assignment flow
- `assigned_attorney_id` — changed via assignment flow
- `updated_at` — set automatically

### Validation Enhancement
Add express-validator rules for case update fields (extend `updateCaseValidation` in
`case.routes.js`):
```javascript
const updateCaseValidation = [
  body('status').optional().isString(),
  body('court_date').optional().isISO8601(),
  body('attorney_price').optional().isFloat({ min: 0 }),
  body('court_fee').optional().isFloat({ min: 0 }),
  body('violation_type').optional().isIn([...violationTypes]),
  body('violation_date').optional().isISO8601(),
  body('violation_details').optional().isString().isLength({ max: 2000 }),
  body('state').optional().isLength({ min: 2, max: 2 }),
  body('county').optional().isString().isLength({ max: 100 }),
  body('town').optional().isString().isLength({ max: 100 }),
  body('carrier').optional().isString().isLength({ max: 255 }),
  body('next_action_date').optional().isISO8601(),
];
```

## Acceptance Criteria
- [ ] Case detail page has an "Edit" button visible to operators and admins
- [ ] Clicking "Edit" switches editable fields to form inputs
- [ ] Non-editable fields (case number, driver, dates) remain read-only with lock icon
- [ ] Reactive form validates all fields (required, length, format)
- [ ] Invalid fields show inline error messages
- [ ] "Save" sends only changed fields to `PATCH /api/cases/:id`
- [ ] Successful save shows snackbar, returns to view mode, refreshes data
- [ ] Activity log records "Case updated: [fields changed]"
- [ ] "Cancel" discards changes and returns to view mode
- [ ] Unsaved changes trigger confirmation dialog before leaving
- [ ] Form works on mobile (single column layout)
- [ ] All labels use TranslateModule with `OPR.EDIT.*` keys
- [ ] Violation type dropdown shows all valid enum values
- [ ] State dropdown shows 50 US states + DC
- [ ] Date pickers prevent invalid ranges (violation date not future, court date not past)
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests (extend `case.controller.test.js`)
- `updateCase` strips `assigned_operator_id` and `assigned_attorney_id` from payload
- `updateCase` validates field lengths and formats
- `updateCase` creates activity log entry listing changed fields
- `updateCase` returns updated case object

### Frontend Tests (`case-edit-form.component.spec.ts`)
- Renders in view mode by default
- "Edit" button switches to edit mode
- Form populated with current case data
- Required field validation shows error when empty
- Save button disabled when form is invalid or unchanged
- Save calls service with only changed fields
- Successful save emits `saved` event and switches to view mode
- Cancel resets form and switches to view mode
- Confirmation dialog appears when cancelling with dirty form
- Non-editable fields always show as text
- State dropdown has 51 options
- Violation type dropdown has correct enum values

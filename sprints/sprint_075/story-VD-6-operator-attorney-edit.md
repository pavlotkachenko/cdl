# Story: VD-6 — Operator & Attorney Edit Support for Type-Specific Fields

**Sprint:** sprint_075
**Priority:** P1
**Status:** DONE

## User Story

As an operator or attorney,
I want to view and edit the violation-specific details on a case,
So that I can correct information, add details from court documents, and maintain accurate case records.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-detail/case-detail.component.ts`
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`
- `frontend/src/app/features/operator/case-detail/operator-case-detail.component.ts`
- `frontend/src/app/features/operator/case-detail/operator-case-detail.component.html`
- `frontend/src/app/features/attorney/attorney-case-detail/attorney-case-detail.component.ts`
- `frontend/src/app/features/attorney/attorney-case-detail/attorney-case-detail.component.html`

### Database Changes
- None

## Acceptance Criteria

### Driver View (case-detail)

- [ ] Violation Detail Card (VD-1) is **read-only** for drivers
- [ ] No edit button on the Violation Details card for driver role
- [ ] Drivers can still edit description and location via existing edit mode

### Operator View (operator-case-detail)

- [ ] Violation Detail Card displayed with same layout as driver view (VD-1)
- [ ] "Edit" button on Violation Details card header (pencil icon)
- [ ] Edit mode renders type-specific fields as form inputs (same rendering as VT-6 submit-ticket conditional fields):
  - text → `<input type="text">`
  - number → `<input type="number">`
  - select → `<select>` dropdown
  - date → `<input type="date">`
  - boolean → toggle switch
- [ ] Edit mode also allows editing:
  - `violation_regulation_code` (text input, helpText: "e.g., 395.3(a)(1)")
  - `violation_severity` (select: critical, serious, standard, minor)
- [ ] Save button sends PATCH to `/api/cases/:id` with updated `type_specific_data`, `violation_regulation_code`, `violation_severity`
- [ ] Cancel reverts to read-only with original values
- [ ] Toast on success: "Violation details updated"
- [ ] Toast on error: "Failed to update violation details"
- [ ] Operator can also change `violation_type` — if changed, conditional fields rebuild for new type (existing data cleared with confirmation dialog)

### Attorney View (attorney-case-detail)

- [ ] Same edit capabilities as operator view
- [ ] Attorney can additionally set `violation_regulation_code` with auto-complete suggestions from a predefined list of common CFR sections
- [ ] Attorney can add case notes alongside violation details (uses existing notes system, not a new field)

### Shared Edit Form Logic

- [ ] Extract edit form building into a shared utility or mixin that both operator-case-detail and attorney-case-detail can use
- [ ] Form built from `VIOLATION_TYPE_REGISTRY[violation_type].conditionalFields` — same as submit-ticket (VT-6)
- [ ] Existing `type_specific_data` values pre-populate the form
- [ ] Validation runs per field definition (required, min/max, enum values)
- [ ] Only changed fields sent in PATCH payload (diff against original)

### Type Change Handling

- [ ] If operator/attorney changes `violation_type`:
  - Confirmation dialog: "Changing the violation type will clear all type-specific fields. Continue?"
  - On confirm: clear `type_specific_data`, rebuild conditional fields for new type
  - On cancel: revert type selection
  - `violation_severity` auto-updated from registry for new type

### Backend Integration

- [ ] PATCH payload structure:
  ```json
  {
    "type_specific_data": { "alleged_speed": 82, "posted_speed_limit": 65, ... },
    "violation_regulation_code": "395.3(a)(1)",
    "violation_severity": "serious"
  }
  ```
- [ ] Backend validation middleware (VT-4) validates the JSONB against the new type's schema
- [ ] Activity log records: "Violation details updated by [name]" with diff summary

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-detail.component.ts` | `case-detail.component.spec.ts` | VD-8 |
| `operator-case-detail.component.ts` | `operator-case-detail.component.spec.ts` | VD-8 |
| `attorney-case-detail.component.ts` | `attorney-case-detail.component.spec.ts` | VD-8 |

## Dependencies

- Depends on: VD-1 (violation detail card display), Sprint 074 (VT-2 registry, VT-4 backend API)
- Blocked by: VD-1
- Blocks: None

## Notes

- The driver's Violation Detail Card is strictly read-only — operators/attorneys are the ones with domain knowledge to correct violation details
- Auto-complete for regulation codes is a stretch goal — a simple text input with helpText is acceptable for MVP
- Type change is a destructive action (clears type-specific data) — hence the confirmation dialog
- The shared edit form logic should ideally be a service or utility function, not duplicated across operator and attorney components
- Activity logging on violation detail edits helps track changes for legal record-keeping
- Backend already allows operator/attorney to PATCH these fields (VT-4) — this story adds the frontend UI

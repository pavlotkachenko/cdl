# Story: VT-8 — Tests

**Sprint:** sprint_074
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want comprehensive tests for the violation type system expansion,
So that regressions are caught and all acceptance criteria are verified across DB, backend, and frontend layers.

## Scope

### Files to Create
- `frontend/src/app/core/constants/violation-type-registry.spec.ts`
- `backend/src/__tests__/violation-types.test.js`

### Files to Modify
- `backend/src/__tests__/case.controller.test.js`
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.spec.ts`

### Database Changes
- None

## Acceptance Criteria

### Backend: Violation Type Registry Tests (`violation-types.test.js`)

- [ ] `VIOLATION_TYPES` has 16 entries (all types including legacy)
- [ ] `ACTIVE_TYPES` has 14 entries (excludes parking, traffic_signal)
- [ ] Each active type has `value`, `label`, `icon`, `category`, `severity`, `conditionalFields`
- [ ] `getFieldSchema()` returns correct field definitions for each type
- [ ] `getFieldSchema('speeding')` returns 4 fields: alleged_speed, posted_speed_limit, speed_detection_method, road_zone
- [ ] `getFieldSchema('other')` returns empty array
- [ ] `getFieldSchema('nonexistent')` returns empty array or throws

### Backend: JSONB Validation Tests (`violation-types.test.js`)

- [ ] `validateTypeSpecificData('speeding', { alleged_speed: 82 })` → valid
- [ ] `validateTypeSpecificData('speeding', { alleged_speed: -1 })` → invalid (min 1)
- [ ] `validateTypeSpecificData('speeding', { alleged_speed: 'fast' })` → invalid (not number)
- [ ] `validateTypeSpecificData('dui', { bac_level: 0.06 })` → valid
- [ ] `validateTypeSpecificData('dui', {})` → valid (no required fields for DUI)
- [ ] `validateTypeSpecificData('dot_inspection', { inspection_report_number: 'RPT-123' })` → valid
- [ ] `validateTypeSpecificData('other', {})` → valid (no fields)
- [ ] `validateTypeSpecificData('other', { random_field: 'value' })` → valid (unknown fields ignored)
- [ ] `validateTypeSpecificData('overweight_oversize', { actual_weight: 82000, permitted_weight: 80000 })` → valid
- [ ] `validateTypeSpecificData('hazmat', { hazmat_class: '3', un_number: '1203' })` → valid
- [ ] `validateTypeSpecificData('railroad_crossing', { prior_rr_offenses: 6 })` → invalid (max 5)

### Backend: Case Controller Tests (`case.controller.test.js`)

- [ ] Create case with `type_specific_data` → stored correctly
- [ ] Create case with new violation types (overweight_oversize, equipment_defect, hazmat, railroad_crossing, seatbelt_cell_phone) → accepted
- [ ] Create speeding case → `alleged_speed` stored both as column and in `type_specific_data`
- [ ] Create case with invalid `type_specific_data` → 400 error
- [ ] Create case without `type_specific_data` → succeeds with default `{}`
- [ ] Create case with `violation_severity` → stored
- [ ] Create case without `violation_severity` → auto-populated from registry
- [ ] Create case with `violation_regulation_code` → stored
- [ ] Update case `type_specific_data` as operator → succeeds
- [ ] Update case `type_specific_data` as driver (status: new) → succeeds
- [ ] Update case `type_specific_data` as driver (status: reviewed) → 403

### Backend: Violation Types Endpoint Tests (`violation-types.test.js`)

- [ ] `GET /api/violation-types` → 200 with types array
- [ ] Response contains 14 active types (no parking, traffic_signal)
- [ ] Response includes `categories` array with 4 entries
- [ ] Each type has `conditionalFields` array
- [ ] Response has `Cache-Control: public, max-age=86400` header
- [ ] No auth required (public endpoint)

### Frontend: Registry Tests (`violation-type-registry.spec.ts`)

- [ ] `VIOLATION_TYPE_REGISTRY` has entries for all 14 active types
- [ ] Each entry has required fields: value, label, icon, category, severity, conditionalFields, fineRange
- [ ] `ACTIVE_VIOLATION_TYPES` has 14 entries
- [ ] `LEGACY_VIOLATION_TYPES` is `['parking', 'traffic_signal']`
- [ ] `VIOLATION_CATEGORIES` has 4 entries in correct order: moving, cdl_specific, vehicle_cargo, other
- [ ] Speeding has 4 conditional fields
- [ ] DUI has `disqualificationRisk: true`
- [ ] Other has 0 conditional fields
- [ ] All select-type fields have non-empty `options` array
- [ ] All required fields have `required: true`
- [ ] Category types sum to 14 (no duplicates, no missing)

### Frontend: Submit Ticket Tests (`submit-ticket.component.spec.ts`)

- [ ] 14 violation type chips rendered (not 7)
- [ ] 4 category headings rendered
- [ ] Chip selection sets `ticketTypeForm.type` value
- [ ] Selecting 'speeding' shows 4 conditional fields
- [ ] Selecting 'dui' shows 4 conditional fields (different from speeding)
- [ ] Selecting 'other' shows no conditional fields
- [ ] Changing type clears previous conditional field values
- [ ] Required conditional field prevents form submission
- [ ] Submitting includes `type_specific_data` in payload
- [ ] Speeding submission includes `alleged_speed` both top-level and in JSONB
- [ ] Review step displays conditional field values with labels
- [ ] Boolean toggle has `role="switch"` and `aria-checked`
- [ ] Select fields render all options from registry
- [ ] OCR_TYPE_MAP includes new keywords (dui, overweight, hazmat, etc.)
- [ ] Category chips have `role="radiogroup"` wrapper and `role="radio"` per chip

### Test Counts

- [ ] Backend: ~25 new test cases across 2 files
- [ ] Frontend: ~20 new test cases across 2 files
- [ ] All existing tests continue to pass

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `violation-types.js` | `violation-types.test.js` | this story |
| `violation-validation.middleware.js` | `violation-types.test.js` | this story |
| `violation-type.controller.js` | `violation-types.test.js` | this story |
| `case.controller.js` | `case.controller.test.js` | this story |
| `violation-type-registry.ts` | `violation-type-registry.spec.ts` | this story |
| `submit-ticket.component.ts` | `submit-ticket.component.spec.ts` | this story |

## Dependencies

- Depends on: VT-1 through VT-7 (tests verify all other stories)
- Blocked by: None (tests can be written TDD-style before implementation)

## Notes

- Use `vi.fn()` for mocking service methods
- Use `of()` from rxjs to mock observable returns
- Backend tests use Jest; frontend tests use Vitest via `npx ng test`
- For conditional fields testing, select a type then verify DOM contains expected input elements
- JSONB validation tests should cover both valid and invalid payloads for at least 4 different violation types
- The `type_specific_data` validation is permissive on unknown keys — test that unknown fields don't cause errors
- Target: ~45 new test cases total

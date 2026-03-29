# Story: VD-1 — Violation Detail Card

**Sprint:** sprint_075
**Priority:** P0
**Status:** DONE

## User Story

As a CDL driver,
I want to see the specific details of my violation displayed clearly on the case detail page,
So that I can verify the information is correct and understand exactly what I'm being charged with.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`
- `frontend/src/app/features/driver/case-detail/case-detail.component.ts`
- `frontend/src/app/features/driver/case-detail/case-detail.component.scss`

### Database Changes
- None

## Acceptance Criteria

### Card Structure

- [x] New card section placed between "Case Information" and "Documents" cards in left column
- [x] Card header: `<span aria-hidden="true">📝</span> Violation Details`
- [x] Card only renders if `caseData().type_specific_data` has at least one non-empty value OR `caseData().violation_regulation_code` exists
- [x] If no type-specific data and no regulation code, card is hidden (graceful empty handling)

### Dynamic Field Rendering

- [x] Read violation type from `caseData().violation_type`
- [x] Look up field definitions from `VIOLATION_TYPE_REGISTRY[violation_type].conditionalFields`
- [x] For each field in the registry that has a corresponding key in `type_specific_data`:
  - Render label (from registry `field.label`)
  - Render value with appropriate formatting:
    - **text:** displayed as-is
    - **number:** formatted with locale (e.g., `82,000 lbs`)
    - **select:** resolved to human-readable label from `field.options` (e.g., `'radar'` → `'Radar'`)
    - **date:** formatted as `MMM d, yyyy`
    - **boolean:** displayed as `<span class="badge badge-yes">Yes</span>` or `<span class="badge badge-no">No</span>`
- [x] Fields arranged in 2-column info grid (matching Case Information card layout)
- [x] Empty/null fields show "Not provided" in muted text

### Speeding-Specific Display

- [x] If violation_type is `speeding`:
  - Show speed comparison: `"82 mph in a 65 mph zone"` (formatted from alleged_speed + posted_speed_limit)
  - Show `mph over` calculated: `"17 mph over the limit"` with color coding (red if 15+, orange if 10-14, yellow if <10)
  - Road zone shown with warning icon if school/construction: `"🏫 School Zone"` or `"🚧 Construction Zone"`

### DUI-Specific Display

- [x] If violation_type is `dui`:
  - BAC level shown with threshold comparison: `"0.06% (CDL limit: 0.04%)"` with red highlight if over
  - Hazmat flag shown prominently if `hazmat_at_time: true`: `"⚠️ Hazmat endorsement active — 3-year disqualification applies"`

### DOT Inspection-Specific Display

- [x] If violation_type is `dot_inspection`:
  - Inspection level shown as badge: `"Level I — Full Inspection"`
  - OOS status highlighted: `"⛔ Vehicle Out of Service"` or `"⛔ Driver Out of Service"` in red
  - CVSA decal status: `"✅ CVSA Decal Issued"` or `"❌ No CVSA Decal"`

### Overweight-Specific Display

- [x] If violation_type is `overweight_oversize`:
  - Weight comparison: `"82,000 lbs / 80,000 lbs permitted"` with calculated `"2,000 lbs over"`
  - Pounds over shown in red if > 5,000 lbs

### Fine Amount Display

- [x] `fine_amount` from case data shown prominently if present: `"$1,250.00"` with dollar formatting
- [x] If fine_amount is absent, show fine range from registry: `"Typical range: $150 – $2,500"`

### Accessibility

- [x] All field labels use `<label>` elements
- [x] Boolean badges have accessible text (not just color)
- [x] Speed/weight comparisons have `aria-label` with full description
- [x] Warning messages have `role="alert"` or `role="status"`
- [x] Color is not the only indicator — text accompanies all color coding

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-detail.component.ts` | `case-detail.component.spec.ts` | VD-8 |

## Dependencies

- Depends on: Sprint 074 (VT-2 registry, VT-1 DB columns, VT-4 API)
- Blocked by: Sprint 074 completion
- Blocks: None

## Notes

- The card reads from `caseData().type_specific_data` which is populated during case creation (Sprint 074 VT-6)
- Existing cases with empty `type_specific_data` simply won't show this card — no migration needed
- Field resolution uses the same `VIOLATION_TYPE_REGISTRY` that the submit-ticket form uses — ensuring consistency
- Special formatting for speeding, DUI, DOT inspection, and overweight types is the priority; other types use generic field rendering
- The card is read-only in the driver view; edit support is in VD-6

# Story: VT-6 — Submit Ticket: Conditional Fields per Violation Type

**Sprint:** sprint_074
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver,
I want the ticket submission form to show relevant detail fields based on the violation type I selected,
So that I can provide the specific information needed for my attorney to build a strong defense.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts`
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.html`
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.scss`

### Database Changes
- None

## Acceptance Criteria

### Dynamic Conditional Field Section

- [ ] New section in Step 3 (Details) between common fields and description: **"Violation Details"**
- [ ] Header: `<span aria-hidden="true">📝</span> Violation Details` (15px, font-weight 700)
- [ ] Subtitle: "Provide details specific to your violation type" (13px, muted)
- [ ] Section only visible when a violation type is selected AND that type has conditional fields
- [ ] Fields rendered dynamically from `VIOLATION_TYPE_REGISTRY[selectedType].conditionalFields`

### Field Rendering by Type

Each `ConditionalField` from the registry renders as:

- [ ] `type: 'text'` → `<input type="text">` with label, placeholder, optional helpText
- [ ] `type: 'number'` → `<input type="number">` with label, min/max from validation, step attribute
- [ ] `type: 'select'` → `<select>` dropdown with label, options from field definition, placeholder "Select..."
- [ ] `type: 'date'` → `<input type="date">` with label
- [ ] `type: 'boolean'` → Toggle switch (matching Sprint 069 notification toggle pattern: `role="switch"`, `aria-checked`, teal active color)

### Form Group Management

- [ ] `conditionalFieldsForm` — dynamic `FormGroup` created from registry field definitions when type changes
- [ ] When violation type changes:
  1. Previous conditional form group destroyed
  2. New form group created with controls matching the selected type's `conditionalFields`
  3. Required fields get `Validators.required`
  4. Number fields get `Validators.min` / `Validators.max` from registry validation
  5. Form values cleared
- [ ] `canProceedFromDetails` computed signal updated to include `conditionalFieldsForm.valid`
- [ ] Effect or subscription watches `ticketTypeForm.type` changes to rebuild conditional fields

### Field Layout

- [ ] 2-column grid for conditional fields (mobile: 1-column)
- [ ] Boolean toggles span full width
- [ ] Help text shown below field in muted 12px text
- [ ] Required fields marked with red asterisk (*)
- [ ] Error messages shown below field on blur: "This field is required", "Must be between X and Y"

### Payload Construction

- [ ] `submitTicket()` method updated to collect conditional fields into `type_specific_data` JSONB object
- [ ] Only non-null, non-empty conditional field values included in `type_specific_data`
- [ ] Payload structure:
  ```typescript
  {
    ...commonFields,
    violation_type: 'speeding',
    type_specific_data: {
      alleged_speed: 82,
      posted_speed_limit: 65,
      speed_detection_method: 'radar',
      road_zone: 'normal'
    }
  }
  ```
- [ ] For speeding: `alleged_speed` sent BOTH as top-level field (backward compat) and in `type_specific_data`
- [ ] `violation_severity` auto-populated from registry and included in payload
- [ ] If user entered a regulation code in conditional fields, it's also sent as `violation_regulation_code`

### Review Step Update

- [ ] Step 4 (Review) displays conditional field values under a "Violation Details" section
- [ ] Fields shown with labels from registry (not raw keys)
- [ ] Boolean values displayed as "Yes" / "No"
- [ ] Select values displayed as human-readable label (not raw value)
- [ ] Empty/null fields omitted from review

### Per-Type Field Examples

**Speeding (4 fields):**
- [ ] Alleged Speed (number, required, 1-300, helpText: "Speed recorded on citation")
- [ ] Posted Speed Limit (number, required, 5-100)
- [ ] Detection Method (select: Radar, Lidar, Pacing, VASCAR, Aircraft)
- [ ] Road Zone (select: Normal, School Zone, Construction Zone, Residential)

**DUI (4 fields):**
- [ ] BAC Level (number, step: 0.01, helpText: "CDL threshold is 0.04%")
- [ ] Substance Type (select: Alcohol, Marijuana, Amphetamine, Cocaine, Opioid, Other, Refusal to Test)
- [ ] Test Type (select: Breath, Blood, Urine, Refusal)
- [ ] Hazmat at Time (toggle, helpText: "Triggers 3-year vs 1-year disqualification")

**HOS/Logbook (4 fields):**
- [ ] Violation Subtype (select: 11-Hour Driving Limit, 14-Hour Window, 30-Min Rest Break, 60/70-Hour Weekly, ELD Malfunction, False Log)
- [ ] Hours Over Limit (number, step: 0.5)
- [ ] ELD Manufacturer (text, helpText: "e.g., KeepTrucking, Samsara, Omnitracs")
- [ ] Regulation Code (text, helpText: "e.g., 395.3(a)(1)")

**Other type (0 fields):**
- [ ] No conditional fields section rendered — only common fields + description

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `submit-ticket.component.ts` | `submit-ticket.component.spec.ts` | VT-8 |

## Dependencies

- Depends on: VT-2 (registry), VT-3 (models), VT-4 (backend accepts JSONB), VT-5 (chip selection)
- Blocked by: VT-2, VT-5
- Blocks: None

## Notes

- The conditional fields section replaces the old hardcoded `isSpeedingType` / `allegedSpeed` pattern with a generic, registry-driven approach
- The existing `allegedSpeed` form control in `ticketDetailsForm` should be removed — speed fields now come from conditional fields
- The `fineAmount` field remains in common fields (not conditional) since it applies to all types
- Boolean toggles reuse the Sprint 069 notification preference toggle styling (teal pill, `role="switch"`)
- Help text is particularly important for CDL-specific fields where drivers may not know exact terminology
- The review step needs to resolve select option values to labels (e.g., `'radar'` → `'Radar'`)
- Max ~4 conditional fields per type keeps the form manageable on mobile

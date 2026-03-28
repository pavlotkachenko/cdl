# Story: VT-7 — OCR Type Mapping Expansion

**Sprint:** sprint_074
**Priority:** P2
**Status:** TODO

## User Story

As a CDL driver,
I want the ticket scanner to automatically detect the expanded set of violation types from my uploaded ticket image,
So that the correct type and fields are pre-populated without manual selection.

## Scope

### Files to Modify
- `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts` (OCR_TYPE_MAP)
- `frontend/src/app/core/services/ocr.service.ts` (if type-specific field extraction needed)

### Database Changes
- None

## Acceptance Criteria

### OCR_TYPE_MAP Expansion

- [ ] Existing mappings preserved:
  ```
  speeding, speed → speeding
  logbook, hours of service, hos → hos_logbook
  inspection, dot → dot_inspection
  suspension, suspended → suspension
  csa → csa_score
  dqf, disqualification → dqf
  ```
- [ ] New mappings added:
  ```
  dui, dwi, driving under influence, intoxicated, bac → dui
  reckless, reckless driving, careless driving → reckless_driving
  overweight, oversize, gross weight, axle weight, bridge formula → overweight_oversize
  equipment, brake, tire, light, defect, vehicle maintenance → equipment_defect
  hazmat, hazardous, placard, shipping paper, dangerous goods → hazmat
  railroad, rail crossing, grade crossing, train → railroad_crossing
  seatbelt, seat belt, cell phone, texting, handheld → seatbelt_cell_phone
  ```

### OCR Result Handling

- [ ] `applyOcrResults` method updated to attempt mapping `type_specific_data` fields from OCR extracted text:
  - If OCR detects speed values (e.g., "82 mph in a 65 mph zone"), populate `alleged_speed` and `posted_speed_limit`
  - If OCR detects BAC (e.g., "BAC 0.06"), populate `bac_level`
  - If OCR detects inspection level (e.g., "Level I"), populate `inspection_level`
  - If OCR detects weight (e.g., "Actual: 82,000 lbs"), populate `actual_weight`
- [ ] OCR type-specific field extraction is best-effort — does not block form submission if extraction fails
- [ ] After type is auto-detected and set, conditional fields form is rebuilt (triggers VT-6 form group recreation)
- [ ] OCR-extracted type-specific values patched into `conditionalFieldsForm` after it's created

### Fallback Behavior

- [ ] If OCR cannot determine violation type, no chip is pre-selected (user selects manually)
- [ ] If OCR extracts a type keyword not in the map, falls back to `'other'`
- [ ] Toast notification: "Ticket scanned — please verify the detected information" (unchanged)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `submit-ticket.component.ts` | `submit-ticket.component.spec.ts` | VT-8 |

## Dependencies

- Depends on: VT-5 (chips), VT-6 (conditional fields form)
- Blocked by: VT-6
- Blocks: None

## Notes

- OCR keyword matching is case-insensitive and uses `toLowerCase().trim()` on raw extracted text
- The OCR service itself (`ocr.service.ts`) may need minor updates to return more structured data for type-specific field extraction, but the primary intelligence is in the component's `applyOcrResults` method
- Type-specific field extraction from OCR text is regex-based and approximate — e.g., `/(\d+)\s*mph/i` for speed values
- This story has lower priority (P2) since manual type selection works fine as a fallback
- Future improvement: use AI/ML for more accurate ticket parsing (deferred to V2)

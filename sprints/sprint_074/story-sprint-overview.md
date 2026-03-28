# Sprint 074 — Violation Type System & Enhanced Submission

**Sprint Goal:** Expand the violation type data model from 7 active types to 14, create a shared type registry with conditional field definitions, update the submit-ticket form with dynamic per-type fields, and sync all layers (DB → backend → frontend models).

**Start Date:** 2026-03-26
**Status:** TODO

## Stories

| ID | Title | Priority | Status | Assignee |
|----|-------|----------|--------|----------|
| VT-1 | Database Migration 028 — Violation Type Expansion | P0 | TODO | Dev Lead |
| VT-2 | Violation Type Registry (Shared Constants) | P0 | TODO | Dev Lead |
| VT-3 | Frontend Model Sync | P0 | TODO | Dev Lead |
| VT-4 | Backend Validation & API Updates | P0 | TODO | Dev Lead |
| VT-5 | Submit Ticket — Type Chips & Categories | P1 | TODO | Dev Lead |
| VT-6 | Submit Ticket — Conditional Fields per Type | P1 | TODO | Dev Lead |
| VT-7 | OCR Type Mapping Expansion | P2 | TODO | Dev Lead |
| VT-8 | Tests | P0 | TODO | QA |

## Architecture Notes

### JSONB Strategy
Type-specific violation data stored in `cases.type_specific_data JSONB DEFAULT '{}'` rather than 60+ nullable columns. Validated at application layer using the shared Violation Type Registry.

### Violation Type Registry
Single source of truth (`violation-type-registry.ts` + `violation-types.js`) defining:
- Field schemas per type (key, label, input type, required, options, validation)
- Metadata: icon, category, severity, CSA BASIC, regulation reference, fine range
- Used by: submit-ticket form rendering, backend JSONB validation, case-detail display (Sprint 075)

### Enum Expansion
```
DB total: 16 types (11 existing + 5 new)
UI active: 14 (hide parking, traffic_signal as legacy)
New types: overweight_oversize, equipment_defect, hazmat, railroad_crossing, seatbelt_cell_phone
Restored to UI: dui, reckless_driving (existed in DB, were hidden in submit-ticket)
```

### Chip Category Layout (Mobile-First)
14 active chips grouped into 4 categories for mobile usability:
- **Moving Violations:** Speeding, DUI, Reckless Driving, Seatbelt/Cell Phone
- **CDL-Specific:** HOS/Logbook, DOT Inspection, DQF, Suspension, CSA Score
- **Vehicle & Cargo:** Equipment Defect, Overweight/Oversize, Hazmat, Railroad Crossing
- **Other:** Other

## Dependencies

- No external dependencies
- Builds on: Migration 027 (driver profile fields), Sprint 072 (case detail redesign)
- Feeds into: Sprint 075 (case detail violation display)

## Deferred Items

- Case detail violation display → Sprint 075
- Severity banner & regulation badge display → Sprint 075
- Penalty impact card → Sprint 075
- CSA impact card → Sprint 075
- Disqualification timeline → Sprint 075
- Multi-role view integration → Sprint 075

## Definition of Done

- [ ] All 8 stories marked DONE
- [ ] Migration 028 applied without errors
- [ ] Backend accepts all 16 violation types with JSONB validation
- [ ] Frontend ViolationType includes all 16 types
- [ ] Submit ticket renders 14 active chips in 4 categories
- [ ] Conditional fields render and validate per violation type
- [ ] OCR maps new keywords to new types
- [ ] `npx ng test --no-watch` passes (all existing + new tests)
- [ ] `cd backend && npm test` passes (all existing + new tests)

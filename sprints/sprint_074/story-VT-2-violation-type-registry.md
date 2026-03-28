# Story: VT-2 — Violation Type Registry (Shared Constants)

**Sprint:** sprint_074
**Priority:** P0
**Status:** TODO

## User Story

As a platform developer,
I want a single source of truth defining all violation types with their metadata, conditional fields, severity, and categorization,
So that frontend form rendering, backend validation, and case display all derive from the same configuration.

## Scope

### Files to Create
- `frontend/src/app/core/constants/violation-type-registry.ts`
- `backend/src/constants/violation-types.js`

### Database Changes
- None

## Acceptance Criteria

### Frontend Registry (`violation-type-registry.ts`)

- [ ] `ViolationTypeConfig` interface exported with fields: `value`, `label`, `icon`, `category`, `severity`, `csaBasic?`, `regulationRef?`, `conditionalFields`, `fineRange`, `disqualificationRisk`, `defenseStrategies`
- [ ] `ConditionalField` interface exported with fields: `key`, `label`, `type` (text|number|select|date|boolean), `required`, `options?`, `validation?`, `helpText?`
- [ ] `ViolationCategory` type exported: `'moving' | 'cdl_specific' | 'vehicle_cargo' | 'other'`
- [ ] `ViolationSeverity` type exported: `'critical' | 'serious' | 'standard' | 'minor'`
- [ ] `VIOLATION_TYPE_REGISTRY` constant exported as `Record<string, ViolationTypeConfig>` with entries for all 14 active types
- [ ] `ACTIVE_VIOLATION_TYPES` exported — array of configs excluding `parking`, `traffic_signal`
- [ ] `LEGACY_VIOLATION_TYPES` exported — `['parking', 'traffic_signal']`
- [ ] `VIOLATION_CATEGORIES` exported — ordered array of `{ key, label, types[] }` for UI grouping

#### Per-Type Definitions (14 active types)

**Moving Violations:**
- [ ] `speeding` — fields: `alleged_speed` (number, required), `posted_speed_limit` (number, required), `speed_detection_method` (select: radar/lidar/pacing/vascar/aircraft), `road_zone` (select: normal/school/construction/residential) — severity: serious, fineRange: $150–$2,500
- [ ] `dui` — fields: `bac_level` (number), `substance_type` (select: alcohol/marijuana/amphetamine/cocaine/opioid/other/refusal_to_test), `test_type` (select: breath/blood/urine/refusal), `hazmat_at_time` (boolean) — severity: critical, disqualificationRisk: true, fineRange: $2,500–$10,000
- [ ] `reckless_driving` — fields: `incident_description` (text), `injuries_involved` (boolean), `cmv_at_time` (boolean), `witnesses` (boolean) — severity: serious, fineRange: $500–$5,000
- [ ] `seatbelt_cell_phone` — fields: `violation_subtype` (select: seatbelt/cell_phone/texting), `device_type` (select: handheld/hands_free, conditional on cell_phone), `hands_free_available` (boolean) — severity: minor, fineRange: $100–$500

**CDL-Specific:**
- [ ] `hos_logbook` — fields: `violation_subtype` (select: driving_limit_11hr/window_14hr/rest_break_30min/weekly_60_70hr/eld_malfunction/false_log), `hours_over_limit` (number), `eld_manufacturer` (text), `violation_regulation_code` (text, helpText: "e.g., 395.3(a)(1)") — severity: serious, fineRange: $1,000–$16,000
- [ ] `dot_inspection` — fields: `inspection_level` (select: I/II/III/IV/V/VI), `inspection_report_number` (text, required), `cvsa_decal_issued` (boolean), `vehicle_oos` (boolean), `driver_oos` (boolean) — severity: standard, fineRange: $0–$16,000
- [ ] `dqf` — fields: `document_type` (select: medical_certificate/mvr/employment_application/road_test_certificate/annual_review/drug_test_records), `violation_regulation_code` (text), `document_expiration_date` (date), `audit_type` (select: roadside/compliance_review/new_entrant/complaint) — severity: serious, fineRange: $1,000–$16,000
- [ ] `suspension` — fields: `suspension_reason` (select: serious_traffic_violations/major_offense/dui/leaving_scene/felony_with_cmv/medical_disqualification/unpaid_fines), `disqualification_duration` (select: 60_day/120_day/1_year/3_year/lifetime), `disqualification_end_date` (date), `reinstatement_status` (select: disqualified/eligible/pending/reinstated) — severity: critical, disqualificationRisk: true, fineRange: $2,500–$25,000
- [ ] `csa_score` — fields: `basic_category` (select: unsafe_driving/crash_indicator/hos/vehicle_maintenance/controlled_substances/hazmat/driver_fitness), `severity_weight` (number, 1-10), `current_percentile` (number, 0-100), `projected_percentile` (number, 0-100) — severity: standard, fineRange: $0–$0

**Vehicle & Cargo:**
- [ ] `equipment_defect` — fields: `equipment_category` (select: brakes/tires/lights/coupling/frame/steering/exhaust/windshield/mirrors/other), `responsible_party` (select: driver/carrier/both), `vehicle_oos` (boolean), `pre_trip_inspection_done` (boolean) — severity: standard, fineRange: $500–$16,000
- [ ] `overweight_oversize` — fields: `actual_weight` (number), `permitted_weight` (number), `violation_subtype` (select: gross_weight/axle_weight/bridge_formula/oversize_height/oversize_width/oversize_length), `weigh_method` (select: scale_house/portable_scale/wim) — severity: standard, fineRange: $100–$50,000
- [ ] `hazmat` — fields: `hazmat_class` (select: 1-9), `un_number` (text, helpText: "4-digit UN number"), `violation_subtype` (select: placarding/shipping_papers/packaging/marking_labeling/loading_segregation/security_plan/training/endorsement), `hazmat_endorsement_valid` (boolean) — severity: critical, fineRange: $450–$75,000
- [ ] `railroad_crossing` — fields: `violation_subtype` (select: failure_to_stop/insufficient_clearance/failure_to_obey_signal/failure_to_negotiate_safely/insufficient_undercarriage_clearance), `prior_rr_offenses` (number, 0-5), `crossing_type` (select: grade_crossing/drawbridge), `signal_type` (select: gates_and_lights/lights_only/crossbucks_only/none) — severity: critical, disqualificationRisk: true, fineRange: $500–$11,000

**Other:**
- [ ] `other` — no conditional fields, severity: standard, fineRange: $0–$10,000

### Backend Registry (`violation-types.js`)

- [ ] `VIOLATION_TYPES` constant exported with same type values and conditional field schemas
- [ ] `ACTIVE_TYPES` array exported (14 active)
- [ ] `ALL_TYPES` array exported (16 total including legacy)
- [ ] `getFieldSchema(violationType)` function exported — returns conditional field definitions for a given type
- [ ] `validateTypeSpecificData(violationType, data)` function exported — returns `{ valid, errors }` for JSONB validation
- [ ] Field schemas match frontend registry exactly

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `violation-type-registry.ts` | `violation-type-registry.spec.ts` | VT-8 |
| `violation-types.js` | `violation-types.test.js` | VT-8 |

## Dependencies

- Depends on: VT-1 (enum values must exist)
- Blocked by: None (can develop in parallel with VT-1)
- Blocks: VT-4, VT-5, VT-6

## Notes

- The registry is the single source of truth — all field rendering (VT-6), validation (VT-4), and display (Sprint 075) derive from it
- `defenseStrategies` is informational only — shown in Sprint 075 case detail, not used for validation
- Fine ranges are approximate national averages — actual fines vary by state
- `regulationRef` stores primary CFR section (e.g., "49 CFR 395.3") — used for regulation badge in Sprint 075
- Category order matters: Moving → CDL-Specific → Vehicle & Cargo → Other (matches mobile chip layout)

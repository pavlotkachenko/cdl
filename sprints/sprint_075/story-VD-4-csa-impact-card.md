# Story: VD-4 — CSA Impact Card

**Sprint:** sprint_075
**Priority:** P1
**Status:** DONE

## User Story

As a CDL driver (especially one employed by a carrier),
I want to see how this violation could affect my carrier's CSA score,
So that I understand the broader impact beyond just my personal penalties and can communicate with my carrier.

## Scope

### Files to Create
- `frontend/src/app/shared/components/csa-impact-card/csa-impact-card.component.ts` (inline template/styles)

### Files to Modify
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`
- `frontend/src/app/features/driver/case-detail/case-detail.component.ts`

### Database Changes
- None

## Acceptance Criteria

### Component: `CsaImpactCardComponent`

- [x] Standalone component with inline template and styles
- [x] Inputs: `violationType` (required string), `typeSpecificData` (optional Record), `violationDate` (optional string)
- [x] Reads CSA data from `VIOLATION_TYPE_REGISTRY[violationType]`
- [x] OnPush change detection

### Card Structure

- [x] Card header: `<span aria-hidden="true">📊</span> CSA Score Impact`
- [x] Placed in right column, below Penalty Impact Card
- [x] Only shown if the violation type has a `csaBasic` value in the registry (not all types affect CSA)

### BASIC Category Display

- [x] Show which CSA BASIC category this violation falls under:
  - Unsafe Driving → speeding, reckless_driving, seatbelt_cell_phone
  - HOS Compliance → hos_logbook
  - Vehicle Maintenance → equipment_defect, dot_inspection
  - Controlled Substances → dui
  - Hazmat Compliance → hazmat
  - Driver Fitness → dqf, suspension
  - Crash Indicator → (if applicable)
- [x] BASIC name displayed as colored badge matching category
- [x] Intervention threshold shown: "Threshold: 65th percentile" (or 80th for Crash/Hazmat)

### Severity Weight Display

- [x] If `type_specific_data.severity_weight` exists (operator/attorney entered): show exact value
- [x] Otherwise: show estimated range from registry: e.g., "Estimated severity: 5-7 points"
- [x] Visual: horizontal bar showing severity on 1-10 scale with marker
- [x] Bar color gradient: green (1-3) → yellow (4-6) → orange (7-8) → red (9-10)

### Time Weight Calculation

- [x] Calculate time weight based on `violation_date` relative to today:
  - 0-6 months ago → **3x** weight (red badge: "Recent — Maximum Impact")
  - 6-12 months ago → **2x** weight (orange badge: "Moderate Impact")
  - 12-24 months ago → **1x** weight (green badge: "Reduced Impact")
  - >24 months → **0x** (gray badge: "Expired — No CSA Impact")
- [x] If no violation_date, show "Date needed for time weight calculation"

### Percentile Display (if data available)

- [x] If `type_specific_data.current_percentile` and `projected_percentile` exist:
  - Show gauge or bar: "Current: 52nd → Projected: 67th percentile"
  - If projected exceeds 65 (or 80 for Crash/Hazmat): red warning "Above intervention threshold"
- [x] If percentile data not available: show informational text:
  - "CSA percentiles are calculated by FMCSA based on your carrier's full inspection history"
  - "Ask your carrier for their current BASIC scores"

### OOS Bonus Points

- [x] If `type_specific_data.vehicle_oos === true` OR `driver_oos === true`:
  - Show "+2 OOS bonus points" in red text
  - "Out-of-service violations carry additional severity points"

### Informational Footer

- [x] "CSA scores affect carrier safety ratings and can trigger FMCSA interventions"
- [x] "Contesting this violation may prevent CSA points from being recorded"
- [x] Link: "Learn more about CSA scores" → internal help page (or external FMCSA link)

### Visibility Rules

- [x] Card shown for all violation types that have a `csaBasic` mapping (most CDL violations)
- [x] Card hidden for `seatbelt_cell_phone` if subtype is personal vehicle (not CMV)
- [x] Card hidden for `other` type (no BASIC mapping)

### Responsive Design

- [x] Desktop: right column card
- [x] Mobile: full-width, positioned after Penalty Impact Card
- [x] Severity bar has minimum height 8px with rounded corners
- [x] Percentile gauge adapts to card width

### Accessibility

- [x] Severity bar has `role="meter"` with `aria-valuenow`, `aria-valuemin="1"`, `aria-valuemax="10"`
- [x] Time weight badge has `aria-label` with full description
- [x] Percentile comparison has `aria-label`: "Current percentile: 52, Projected: 67"
- [x] Color-coded elements have text labels (not color-only)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `csa-impact-card.component.ts` | `csa-impact-card.component.spec.ts` | VD-8 |

## Dependencies

- Depends on: Sprint 074 (VT-2 registry with csaBasic), VD-3 (establishes right-column card pattern)
- Blocked by: Sprint 074 completion
- Blocks: None

## Notes

- CSA score calculation is complex — this card provides estimates and education, not authoritative scores
- Actual carrier CSA percentiles come from FMCSA SMS — integration with FMCSA API deferred to V2
- The `current_percentile` and `projected_percentile` fields are operator/attorney-entered estimates; most cases won't have them initially
- The card's primary value is educational — helping drivers understand why contesting matters for their carrier
- Time weight calculation is straightforward and can be done entirely client-side from violation_date
- For CSA Score (`csa_score`) violation type, the user may have entered percentile data directly — use it
- OOS bonus (+2 points) is a significant penalty multiplier — worth highlighting prominently

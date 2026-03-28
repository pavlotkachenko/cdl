# Story: VD-5 — Disqualification Timeline

**Sprint:** sprint_075
**Priority:** P2
**Status:** DONE

## User Story

As a CDL driver facing a DUI, railroad crossing, or suspension violation,
I want to see a visual timeline of my disqualification period with reinstatement steps,
So that I can plan ahead and take the necessary steps to get my CDL reinstated.

## Scope

### Files to Create
- `frontend/src/app/shared/components/disqualification-timeline/disqualification-timeline.component.ts` (inline template/styles)

### Files to Modify
- `frontend/src/app/features/driver/case-detail/case-detail.component.html`
- `frontend/src/app/features/driver/case-detail/case-detail.component.ts`

### Database Changes
- None

## Acceptance Criteria

### Component: `DisqualificationTimelineComponent`

- [ ] Standalone component with inline template and styles
- [ ] Inputs: `violationType` (required string), `typeSpecificData` (optional Record), `violationDate` (optional string)
- [ ] OnPush change detection
- [ ] Only renders when `violationType` is one of: `dui`, `railroad_crossing`, `suspension`

### Timeline Structure

- [ ] Vertical timeline with left-aligned markers and right-aligned content
- [ ] Timeline nodes (top to bottom):
  1. **Offense Date** — violation_date, marker: red circle
  2. **Disqualification Begins** — computed or from type_specific_data, marker: red circle
  3. **Disqualification Period** — duration bar between begin and end dates, red background
  4. **Reinstatement Eligible** — computed end date, marker: orange circle (or green if past)
  5. **Reinstatement Complete** — if `reinstatement_status === 'reinstated'`, marker: green circle with checkmark

### Duration Calculation

- [ ] **DUI:**
  - Default: 1 year from offense date
  - If `type_specific_data.hazmat_at_time === true`: 3 years
  - If `type_specific_data.prior_dui_offenses >= 1`: lifetime (with 10-year petition note)
- [ ] **Railroad Crossing:**
  - `prior_rr_offenses === 0`: 60 days
  - `prior_rr_offenses === 1`: 120 days
  - `prior_rr_offenses >= 2`: 1 year
- [ ] **Suspension:**
  - From `type_specific_data.disqualification_duration`:
    - `60_day` → 60 days
    - `120_day` → 120 days
    - `1_year` → 365 days
    - `3_year` → 1095 days
    - `lifetime` → show "Lifetime — petition for reinstatement after 10 years"
  - If duration not set: show "Duration pending — contact your attorney"

### Reinstatement Requirements Checklist

- [ ] Below the timeline, show requirements based on type:
  - **DUI:** SAP evaluation, return-to-duty testing, follow-up testing plan, state reinstatement fee, CDL skills test (some states)
  - **Railroad:** Completion of disqualification period, state reinstatement fee, Operation Lifesaver training (recommended)
  - **Suspension:** Resolution of underlying issues, state reinstatement fee, possible CDL retesting
- [ ] Each requirement is a checklist item (not interactive — informational only)
- [ ] Checked/unchecked based on `type_specific_data` fields where available (e.g., `sap_enrollment_status === 'completed'`)

### Status Indicators

- [ ] Active disqualification (current date within period): pulsing red dot, "DISQUALIFIED" badge
- [ ] Eligible for reinstatement (past end date, not reinstated): orange badge "ELIGIBLE FOR REINSTATEMENT"
- [ ] Reinstated: green badge "REINSTATED" with date
- [ ] Pending (no dates calculated): gray badge "PENDING — Contact Attorney"

### Visual Design

- [ ] Timeline line: 2px solid, color matches severity (red for active, gray for past)
- [ ] Timeline nodes: 12px circles with status-appropriate colors
- [ ] Duration bar: fills space between start and end nodes, red with 50% opacity
- [ ] Dates formatted as `MMM d, yyyy`
- [ ] Card background: light red tint for active disqualification, light green for reinstated

### Card Integration

- [ ] Card header: `<span aria-hidden="true">⏳</span> Disqualification Timeline`
- [ ] Placed in right column, below CSA Impact Card (or below Penalty Impact if no CSA card)
- [ ] Card only visible for `dui`, `railroad_crossing`, `suspension` violation types
- [ ] If violation is contested and case is active, show note: "If this violation is successfully contested, disqualification may be avoided"

### Accessibility

- [ ] Timeline has `role="list"` with `role="listitem"` for each node
- [ ] Status badges have `aria-label` with full text
- [ ] Duration period has screen-reader text: "Disqualification period: [start] to [end], [N] days"
- [ ] Active/pulsing indicators have `aria-live="polite"` for status changes
- [ ] Checklist items are not interactive — use `<li>` not `<input type="checkbox">`

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `disqualification-timeline.component.ts` | `disqualification-timeline.component.spec.ts` | VD-8 |

## Dependencies

- Depends on: Sprint 074 (VT-2 registry, VT-1 DB columns for type_specific_data)
- Depends on: VD-3 (right-column card pattern)
- Blocked by: Sprint 074 completion
- Blocks: None

## Notes

- The timeline is primarily informational/educational — it helps drivers understand the timeline they're facing
- Actual disqualification dates are managed by state DMVs, not this platform — all dates are estimates
- The reinstatement checklist provides guidance but is not exhaustive — requirements vary by state
- For lifetime disqualifications, show the 10-year petition pathway as a long-term timeline node
- The "successfully contested" note is a key value prop — it reinforces why they're using the platform
- SAP enrollment status tracking (`sap_enrollment_status`) is a future enhancement — for now, checklist items are informational
- Component is P2 since most cases won't be DUI/railroad/suspension — but it's high value for those that are

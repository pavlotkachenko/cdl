# Story: VD-8 — Tests

**Sprint:** sprint_075
**Priority:** P0
**Status:** DONE

## User Story

As a developer,
I want comprehensive tests for the case detail violation display enhancements,
So that regressions are caught and all new UI components are verified.

## Scope

### Files to Create
- `frontend/src/app/shared/components/penalty-impact-card/penalty-impact-card.component.spec.ts`
- `frontend/src/app/shared/components/csa-impact-card/csa-impact-card.component.spec.ts`
- `frontend/src/app/shared/components/disqualification-timeline/disqualification-timeline.component.spec.ts`

### Files to Modify
- `frontend/src/app/features/driver/case-detail/case-detail.component.spec.ts`
- `frontend/src/app/features/operator/case-detail/operator-case-detail.component.spec.ts`
- `frontend/src/app/features/attorney/attorney-case-detail/attorney-case-detail.component.spec.ts`
- `frontend/src/app/features/admin/case-management/case-management.component.spec.ts`
- `frontend/src/app/features/carrier/carrier-cases/carrier-cases.component.spec.ts`
- `frontend/src/app/features/driver/tickets/tickets.component.spec.ts`

### Database Changes
- None

## Acceptance Criteria

### Violation Detail Card Tests (case-detail.component.spec.ts)

- [ ] Card renders when `type_specific_data` has values
- [ ] Card hidden when `type_specific_data` is empty `{}`
- [ ] Speeding: shows speed comparison "82 mph in a 65 mph zone"
- [ ] Speeding: shows "mph over" with correct calculation and color coding
- [ ] Speeding: school zone shows warning icon
- [ ] DUI: shows BAC with threshold comparison
- [ ] DUI: hazmat warning shown when `hazmat_at_time === true`
- [ ] DOT Inspection: shows inspection level badge
- [ ] DOT Inspection: OOS status highlighted in red
- [ ] Overweight: shows weight comparison with pounds over
- [ ] Select field values resolved to human-readable labels
- [ ] Boolean values shown as Yes/No badges
- [ ] Date values formatted correctly
- [ ] Fine amount displayed with dollar formatting
- [ ] Missing type_specific_data fields show "Not provided"

### Severity Banner Tests (case-detail.component.spec.ts)

- [ ] Critical severity: red banner with "CDL at risk" text
- [ ] Serious severity: orange banner
- [ ] Standard severity: blue banner
- [ ] Minor severity: teal banner
- [ ] Banner uses `violation_severity` from case data when present
- [ ] Banner falls back to registry severity when case data lacks severity
- [ ] Banner has `role="status"` attribute
- [ ] Banner hidden when no violation type set

### Regulation Badge Tests (case-detail.component.spec.ts)

- [ ] Badge renders with regulation code from case data
- [ ] Badge falls back to registry `regulationRef` when case data lacks regulation code
- [ ] Badge links to correct eCFR.gov URL
- [ ] Link opens in new tab (`target="_blank"`)
- [ ] Badge hidden when no regulation code available
- [ ] Badge has correct `aria-label`

### Penalty Impact Card Tests (penalty-impact-card.component.spec.ts)

- [ ] Card renders with violation type input
- [ ] Fine amount displayed when provided
- [ ] Fine range shown from registry when no fine amount
- [ ] Disqualification risk section shown for DUI/railroad/suspension
- [ ] Disqualification risk section hidden for speeding/other
- [ ] DUI with hazmat shows 3-year duration
- [ ] DUI without hazmat shows 1-year duration
- [ ] Railroad with prior_rr_offenses=1 shows 120-day
- [ ] License points section shows estimated range
- [ ] Attorney CTA button rendered
- [ ] Component handles missing typeSpecificData gracefully

### CSA Impact Card Tests (csa-impact-card.component.spec.ts)

- [ ] Card renders for violation types with csaBasic
- [ ] Card hidden for types without csaBasic (e.g., `other`)
- [ ] BASIC category badge shows correct category name
- [ ] Severity weight bar renders with correct value
- [ ] Time weight calculated correctly: 0-6mo=3x, 6-12mo=2x, 12-24mo=1x, >24mo=0x
- [ ] OOS bonus points shown when vehicle_oos=true
- [ ] Percentile display works when data available
- [ ] Percentile section shows informational text when data unavailable
- [ ] Intervention threshold shown correctly (65 or 80 depending on BASIC)
- [ ] Severity bar has `role="meter"` with correct aria attributes

### Disqualification Timeline Tests (disqualification-timeline.component.spec.ts)

- [ ] Component renders only for dui, railroad_crossing, suspension types
- [ ] Component hidden for speeding, hos_logbook, other types
- [ ] DUI: 1-year default duration calculated
- [ ] DUI with hazmat: 3-year duration
- [ ] DUI with prior offense: lifetime shown
- [ ] Railroad: 60-day for first offense
- [ ] Railroad: 120-day for second offense
- [ ] Suspension: reads duration from type_specific_data
- [ ] Timeline shows correct number of nodes
- [ ] Active disqualification shows pulsing red indicator
- [ ] Past disqualification shows green indicator
- [ ] Reinstatement checklist renders correct items per type
- [ ] Timeline has `role="list"` accessibility
- [ ] Missing violation_date shows informational message

### Operator/Attorney Edit Tests

- [ ] Operator: edit button visible on Violation Details card
- [ ] Operator: edit mode renders form inputs for type-specific fields
- [ ] Operator: save sends PATCH with type_specific_data
- [ ] Operator: cancel reverts to read-only
- [ ] Operator: type change shows confirmation dialog
- [ ] Attorney: same edit capabilities as operator
- [ ] Attorney: regulation code input visible in edit mode
- [ ] Driver: no edit button on Violation Details card

### Multi-Role View Tests

- [ ] Admin case table: severity badge renders
- [ ] Admin case table: severity filter dropdown renders with 4 options
- [ ] Carrier cases: severity badge in driver rows
- [ ] Carrier cases: CSA BASIC category shown
- [ ] Driver tickets: 14 type options in filter (not 7)
- [ ] Driver tickets: severity badge on case cards
- [ ] Violation type displays with emoji icon and label from registry

### Test Counts

- [ ] Violation detail card: ~15 test cases
- [ ] Severity banner: ~8 test cases
- [ ] Regulation badge: ~6 test cases
- [ ] Penalty impact card: ~11 test cases
- [ ] CSA impact card: ~11 test cases
- [ ] Disqualification timeline: ~13 test cases
- [ ] Operator/attorney edit: ~8 test cases
- [ ] Multi-role views: ~7 test cases
- [ ] **Total: ~79 new test cases**
- [ ] All existing tests continue to pass

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-detail.component.ts` | `case-detail.component.spec.ts` | this story |
| `penalty-impact-card.component.ts` | `penalty-impact-card.component.spec.ts` | this story |
| `csa-impact-card.component.ts` | `csa-impact-card.component.spec.ts` | this story |
| `disqualification-timeline.component.ts` | `disqualification-timeline.component.spec.ts` | this story |
| `operator-case-detail.component.ts` | `operator-case-detail.component.spec.ts` | this story |
| `attorney-case-detail.component.ts` | `attorney-case-detail.component.spec.ts` | this story |
| `case-management.component.ts` | `case-management.component.spec.ts` | this story |
| `carrier-cases.component.ts` | `carrier-cases.component.spec.ts` | this story |
| `tickets.component.ts` | `tickets.component.spec.ts` | this story |

## Dependencies

- Depends on: VD-1 through VD-7 (tests verify all other stories)
- Blocked by: None (tests can be written TDD-style)

## Notes

- Use `vi.fn()` for mocking, `of()` for observable mocks
- For shared components (penalty-impact, csa-impact, disqualification-timeline), test as standalone with `@Input()` bindings
- Mock `VIOLATION_TYPE_REGISTRY` in tests to control field definitions
- Time weight tests need date mocking — use `vi.useFakeTimers()` to set "today" for reliable calculations
- The disqualification timeline duration tests are critical — incorrect duration calculations would mislead drivers
- Target: ~79 new test cases across 9 test files

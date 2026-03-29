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

- [x] Card renders when `type_specific_data` has values
- [x] Card hidden when `type_specific_data` is empty `{}`
- [x] Speeding: shows speed comparison "82 mph in a 65 mph zone"
- [x] Speeding: shows "mph over" with correct calculation and color coding
- [x] Speeding: school zone shows warning icon
- [x] DUI: shows BAC with threshold comparison
- [x] DUI: hazmat warning shown when `hazmat_at_time === true`
- [x] DOT Inspection: shows inspection level badge
- [x] DOT Inspection: OOS status highlighted in red
- [x] Overweight: shows weight comparison with pounds over
- [x] Select field values resolved to human-readable labels
- [x] Boolean values shown as Yes/No badges
- [x] Date values formatted correctly
- [x] Fine amount displayed with dollar formatting
- [x] Missing type_specific_data fields show "Not provided"

### Severity Banner Tests (case-detail.component.spec.ts)

- [x] Critical severity: red banner with "CDL at risk" text
- [x] Serious severity: orange banner
- [x] Standard severity: blue banner
- [x] Minor severity: teal banner
- [x] Banner uses `violation_severity` from case data when present
- [x] Banner falls back to registry severity when case data lacks severity
- [x] Banner has `role="status"` attribute
- [x] Banner hidden when no violation type set

### Regulation Badge Tests (case-detail.component.spec.ts)

- [x] Badge renders with regulation code from case data
- [x] Badge falls back to registry `regulationRef` when case data lacks regulation code
- [x] Badge links to correct eCFR.gov URL
- [x] Link opens in new tab (`target="_blank"`)
- [x] Badge hidden when no regulation code available
- [x] Badge has correct `aria-label`

### Penalty Impact Card Tests (penalty-impact-card.component.spec.ts)

- [x] Card renders with violation type input
- [x] Fine amount displayed when provided
- [x] Fine range shown from registry when no fine amount
- [x] Disqualification risk section shown for DUI/railroad/suspension
- [x] Disqualification risk section hidden for speeding/other
- [x] DUI with hazmat shows 3-year duration
- [x] DUI without hazmat shows 1-year duration
- [x] Railroad with prior_rr_offenses=1 shows 120-day
- [x] License points section shows estimated range
- [x] Attorney CTA button rendered
- [x] Component handles missing typeSpecificData gracefully

### CSA Impact Card Tests (csa-impact-card.component.spec.ts)

- [x] Card renders for violation types with csaBasic
- [x] Card hidden for types without csaBasic (e.g., `other`)
- [x] BASIC category badge shows correct category name
- [x] Severity weight bar renders with correct value
- [x] Time weight calculated correctly: 0-6mo=3x, 6-12mo=2x, 12-24mo=1x, >24mo=0x
- [x] OOS bonus points shown when vehicle_oos=true
- [x] Percentile display works when data available
- [x] Percentile section shows informational text when data unavailable
- [x] Intervention threshold shown correctly (65 or 80 depending on BASIC)
- [x] Severity bar has `role="meter"` with correct aria attributes

### Disqualification Timeline Tests (disqualification-timeline.component.spec.ts)

- [x] Component renders only for dui, railroad_crossing, suspension types
- [x] Component hidden for speeding, hos_logbook, other types
- [x] DUI: 1-year default duration calculated
- [x] DUI with hazmat: 3-year duration
- [x] DUI with prior offense: lifetime shown
- [x] Railroad: 60-day for first offense
- [x] Railroad: 120-day for second offense
- [x] Suspension: reads duration from type_specific_data
- [x] Timeline shows correct number of nodes
- [x] Active disqualification shows pulsing red indicator
- [x] Past disqualification shows green indicator
- [x] Reinstatement checklist renders correct items per type
- [x] Timeline has `role="list"` accessibility
- [x] Missing violation_date shows informational message

### Operator/Attorney Edit Tests

- [x] Operator: edit button visible on Violation Details card
- [x] Operator: edit mode renders form inputs for type-specific fields
- [x] Operator: save sends PATCH with type_specific_data
- [x] Operator: cancel reverts to read-only
- [x] Operator: type change shows confirmation dialog
- [x] Attorney: same edit capabilities as operator
- [x] Attorney: regulation code input visible in edit mode
- [x] Driver: no edit button on Violation Details card

### Multi-Role View Tests

- [x] Admin case table: severity badge renders
- [x] Admin case table: severity filter dropdown renders with 4 options
- [x] Carrier cases: severity badge in driver rows
- [x] Carrier cases: CSA BASIC category shown
- [x] Driver tickets: 14 type options in filter (not 7)
- [x] Driver tickets: severity badge on case cards
- [x] Violation type displays with emoji icon and label from registry

### Test Counts

- [x] Violation detail card: ~15 test cases
- [x] Severity banner: ~8 test cases
- [x] Regulation badge: ~6 test cases
- [x] Penalty impact card: ~11 test cases
- [x] CSA impact card: ~11 test cases
- [x] Disqualification timeline: ~13 test cases
- [x] Operator/attorney edit: ~8 test cases
- [x] Multi-role views: ~7 test cases
- [x] **Total: ~79 new test cases**
- [x] All existing tests continue to pass

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

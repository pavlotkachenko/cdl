# Story: VD-7 — Multi-Role View Integration

**Sprint:** sprint_075
**Priority:** P2
**Status:** DONE

## User Story

As an admin, carrier manager, or operator viewing case lists,
I want to see violation severity badges and type details in case tables,
So that I can quickly prioritize and filter cases by severity and violation type.

## Scope

### Files to Modify
- `frontend/src/app/features/admin/case-management/case-management.component.ts`
- `frontend/src/app/features/admin/case-management/case-management.component.html`
- `frontend/src/app/features/carrier/carrier-cases/carrier-cases.component.ts`
- `frontend/src/app/features/carrier/carrier-cases/carrier-cases.component.html`
- `frontend/src/app/features/driver/tickets/tickets.component.ts`
- `frontend/src/app/features/driver/tickets/tickets.component.html`

### Database Changes
- None

## Acceptance Criteria

### Severity Badge in Case Tables

- [ ] All case table/list views show a severity badge next to the violation type:
  - Critical: small red pill badge
  - Serious: small orange pill badge
  - Standard: small blue pill badge
  - Minor: small teal pill badge
- [ ] Badge text is the severity level: "Critical", "Serious", "Standard", "Minor"
- [ ] Badge uses 10px font, 4px 8px padding, 4px border-radius
- [ ] Severity derived from `case.violation_severity` if set, otherwise from `VIOLATION_TYPE_REGISTRY[case.violation_type].severity`

### Violation Type Column Enhancement

- [ ] Violation type shown with emoji icon from registry: e.g., "🚗 Speeding" instead of just "speeding"
- [ ] Display uses `VIOLATION_TYPE_REGISTRY[type].label` for human-readable name
- [ ] Existing type display logic (raw enum value) replaced with registry-derived label

### Admin Case Management

- [ ] Severity filter added to filter panel: dropdown with "All", "Critical", "Serious", "Standard", "Minor"
- [ ] Filter applies to case list (client-side filtering of loaded data)
- [ ] `violation_regulation_code` shown in expanded row detail (if available)
- [ ] Stats row updated: add "By Severity" breakdown (Critical: N, Serious: N, ...)

### Carrier Cases

- [ ] Severity badge displayed in driver case rows
- [ ] CSA BASIC category shown for each violation: e.g., "Unsafe Driving" badge
- [ ] Fleet-level severity summary at top: "3 Critical, 5 Serious, 2 Standard violations"

### Driver Tickets List

- [ ] `typeOptions` in filter panel updated to include all 14 active types (from registry)
- [ ] Severity badge shown on each case card (mobile) and table row (desktop)
- [ ] Type chips in filter panel use registry icons and labels

### Responsive Considerations

- [ ] Mobile case cards: severity badge shown in card header alongside status badge
- [ ] Desktop tables: severity as a dedicated column (sortable)
- [ ] Severity column width: 90px fixed

### Accessibility

- [ ] Severity badges have `aria-label`: e.g., "Violation severity: Critical"
- [ ] Filter dropdowns have `<label>` elements
- [ ] Screen reader can distinguish severity from status badges

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `case-management.component.ts` | `case-management.component.spec.ts` | VD-8 |
| `carrier-cases.component.ts` | `carrier-cases.component.spec.ts` | VD-8 |
| `tickets.component.ts` | `tickets.component.spec.ts` | VD-8 |

## Dependencies

- Depends on: Sprint 074 (VT-2 registry, VT-3 model updates)
- Blocked by: Sprint 074 completion
- Blocks: None

## Notes

- This story ensures the violation type expansion is visible across all role views, not just the driver case detail
- Severity filtering is client-side for now — backend filter support (`?severity=critical`) can be added later if needed
- The carrier view's CSA BASIC category display is particularly valuable for fleet managers monitoring compliance
- Driver tickets list currently has `typeOptions` with 7 entries including some non-matching values (`cdl_violation`, `traffic`, `accident`, `weight_station`) — these should be replaced with the 14 registry-based options
- Admin stats breakdown by severity provides operational visibility into the platform's case mix
- This story is P2 since it's primarily a presentation enhancement — core functionality works without it

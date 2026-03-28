# Story: VT-3 — Frontend Model Sync

**Sprint:** sprint_074
**Priority:** P0
**Status:** TODO

## User Story

As a platform developer,
I want the frontend TypeScript models to accurately reflect the expanded violation type system,
So that type safety is maintained across all components consuming case data.

## Scope

### Files to Modify
- `frontend/src/app/core/models/index.ts`

### Database Changes
- None

## Acceptance Criteria

### ViolationType Union Update
- [ ] `ViolationType` expanded from 6 to 16 values:
  ```typescript
  export type ViolationType =
    | 'speeding' | 'dui' | 'reckless_driving' | 'seatbelt_cell_phone'    // Moving
    | 'hos_logbook' | 'dot_inspection' | 'dqf' | 'suspension' | 'csa_score' // CDL-Specific
    | 'equipment_defect' | 'overweight_oversize' | 'hazmat' | 'railroad_crossing' // Vehicle & Cargo
    | 'parking' | 'traffic_signal'                                         // Legacy (hidden)
    | 'other';                                                             // Other
  ```

### ViolationSeverity Type
- [ ] New type exported:
  ```typescript
  export type ViolationSeverity = 'critical' | 'serious' | 'standard' | 'minor';
  ```

### Case Interface Updates
- [ ] `type_specific_data?: Record<string, unknown>` field added
- [ ] `violation_regulation_code?: string` field added
- [ ] `violation_severity?: ViolationSeverity` field added
- [ ] `citation_number?: string` field already exists (verified)
- [ ] `fine_amount?: number` field added (was missing from interface but existed in DB)
- [ ] `alleged_speed?: number` field added (was missing from interface but existed in DB)

### SubmitTicketForm Interface Update
- [ ] `type_specific_data?: Record<string, unknown>` field added
- [ ] `violation_regulation_code?: string` field added
- [ ] `fine_amount?: number` field added
- [ ] `alleged_speed?: number` field added
- [ ] `citation_number?: string` field added
- [ ] `court_date?: string` field added

### CaseStatus Update
- [ ] `'resolved'` added to `CaseStatus` union (exists in DB from migration 021 but missing from type)

### No Breaking Changes
- [ ] All existing type usages remain valid (new types are additive)
- [ ] All existing Case interface fields unchanged
- [ ] Aliases (camelCase/snake_case) maintained for backward compatibility

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `index.ts` | Type checking via `npx ng test --no-watch` | VT-8 |

## Dependencies

- Depends on: VT-1 (schema reference)
- Blocked by: None (can develop in parallel)
- Blocks: VT-5, VT-6

## Notes

- The `ViolationType` union was significantly out of sync — frontend had 6 types while DB had 11. This story fixes the gap and adds the 5 new types.
- `type_specific_data` is typed as `Record<string, unknown>` at the model level. Type-narrowing per violation type happens in the consuming components using the registry.
- `fine_amount` and `alleged_speed` existed as DB columns (migration 025) and were used in submit-ticket, but were never added to the Case interface — this story corrects that.
- `resolved` status exists in migration 021 but was missing from `CaseStatus` type.

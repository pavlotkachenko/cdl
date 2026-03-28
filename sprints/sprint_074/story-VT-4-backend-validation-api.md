# Story: VT-4 — Backend Validation & API Updates

**Sprint:** sprint_074
**Priority:** P0
**Status:** TODO

## User Story

As a platform developer,
I want the backend to accept the expanded violation types, validate type-specific JSONB data per violation type, and expose a violation type metadata endpoint,
So that the API enforces data integrity for all violation types and the frontend can dynamically render type-specific forms.

## Scope

### Files to Create
- `backend/src/middleware/violation-validation.middleware.js`
- `backend/src/routes/violation-type.routes.js`
- `backend/src/controllers/violation-type.controller.js`

### Files to Modify
- `backend/src/routes/case.routes.js`
- `backend/src/controllers/case.controller.js`
- `backend/src/routes/index.js` (register new route)

### Database Changes
- None (migration in VT-1)

## Acceptance Criteria

### Validation Middleware (`violation-validation.middleware.js`)

- [ ] `validateTypeSpecificData` middleware exported
- [ ] Reads `violation_type` and `type_specific_data` from `req.body`
- [ ] If `type_specific_data` present, validates against field schema from `violation-types.js` registry (VT-2)
- [ ] Validation checks per field: required presence, type correctness, enum value inclusion, min/max ranges
- [ ] Returns 400 with `{ error: { code: 'INVALID_TYPE_SPECIFIC_DATA', message, fields: [...] } }` on failure
- [ ] Passes through if `type_specific_data` is absent or empty `{}`
- [ ] Ignores unknown fields in `type_specific_data` (forward compatibility)

### Route Validation Updates (`case.routes.js`)

- [ ] `createCaseValidation` updated to accept all 16 violation types:
  ```javascript
  body('violation_type').optional().isIn([
    'speeding', 'dui', 'reckless_driving', 'seatbelt_cell_phone',
    'hos_logbook', 'dot_inspection', 'dqf', 'suspension', 'csa_score',
    'equipment_defect', 'overweight_oversize', 'hazmat', 'railroad_crossing',
    'parking', 'traffic_signal', 'other'
  ])
  ```
- [ ] `body('type_specific_data').optional().isObject()` added to create validation
- [ ] `body('violation_regulation_code').optional().isString().isLength({ max: 50 })` added
- [ ] `body('violation_severity').optional().isIn(['critical', 'serious', 'standard', 'minor'])` added
- [ ] `validateTypeSpecificData` middleware added after express-validator checks
- [ ] Same fields added to `updateCaseValidation`

### Controller Updates (`case.controller.js`)

- [ ] `createCase` extracts `type_specific_data`, `violation_regulation_code`, `violation_severity` from `req.body`
- [ ] `createCase` includes these in `insertPayload` when present
- [ ] `createCase` auto-populates `violation_severity` from registry if not provided
- [ ] `updateCase` allows updating `type_specific_data`, `violation_regulation_code`, `violation_severity`
- [ ] `updateCase` runs `validateTypeSpecificData` on JSONB updates
- [ ] Driver role restriction: drivers can edit `type_specific_data` only during case creation (status === 'new')
- [ ] Operator/attorney/admin can edit `type_specific_data` at any status

### New Endpoint: `GET /api/violation-types`

- [ ] Route registered at `GET /api/violation-types` (public, no auth required)
- [ ] Returns JSON array of active violation types with metadata:
  ```json
  {
    "types": [
      {
        "value": "speeding",
        "label": "Speeding",
        "icon": "🚗",
        "category": "moving",
        "severity": "serious",
        "conditionalFields": [...]
      }
    ],
    "categories": [
      { "key": "moving", "label": "Moving Violations", "types": ["speeding", "dui", ...] }
    ]
  }
  ```
- [ ] Excludes legacy types (`parking`, `traffic_signal`) from response
- [ ] Caches response (metadata is static) — set `Cache-Control: public, max-age=86400`
- [ ] Includes `conditionalFields` array for each type (enabling dynamic form rendering)

### Backward Compatibility

- [ ] `alleged_speed` still accepted as a top-level field for speeding (backward compat)
- [ ] If `alleged_speed` provided at top level for speeding, it's ALSO stored in `type_specific_data.alleged_speed`
- [ ] Existing `fine_amount` and `citation_number` validation unchanged
- [ ] Old API clients sending only `violation_type` without `type_specific_data` still work

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `violation-validation.middleware.js` | `backend/src/__tests__/violation-types.test.js` | VT-8 |
| `case.controller.js` | `backend/src/__tests__/case.controller.test.js` | VT-8 |
| `violation-type.controller.js` | `backend/src/__tests__/violation-types.test.js` | VT-8 |
| `case.routes.js` | `backend/src/__tests__/case.routes.test.js` | VT-8 |

## Dependencies

- Depends on: VT-1 (migration), VT-2 (registry/constants)
- Blocked by: VT-2 (needs field schemas for validation)
- Blocks: VT-6 (frontend needs API to accept JSONB)

## Notes

- The validation middleware uses the backend registry (`violation-types.js`) as the source of truth for field schemas — if the registry adds a field, validation automatically supports it
- The `/api/violation-types` endpoint is intentionally public (no auth) to support the public ticket submission form
- `validateTypeSpecificData` is permissive on unknown fields — this allows gradual expansion without breaking old clients
- Auto-populating `violation_severity` from registry means the frontend doesn't need to send it explicitly — but can override if needed
- Driver edit restriction on `type_specific_data` is relaxed for `status === 'new'` to allow correcting ticket details before operator review

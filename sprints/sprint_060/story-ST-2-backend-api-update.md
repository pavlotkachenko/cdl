# Story ST-2: Backend API — createCase Endpoint Update

## Status: DONE

## Description
Update the `createCase` endpoint to accept new form fields (`citation_number`, `fine_amount`, `alleged_speed`) and validate against the expanded `violation_type` enum.

## Changes Required

### `backend/src/routes/case.routes.js`
Update `createCaseValidation` array:
- Add `citation_number` — optional, string, max 50 chars
- Add `fine_amount` — optional, numeric, min 0
- Add `alleged_speed` — optional, integer, min 1, max 300
- Update `violation_type` `.isIn()` whitelist to include: `hos_logbook`, `dot_inspection`, `suspension`, `csa_score`, `dqf`

### `backend/src/controllers/case.controller.js`
Update `createCase` handler:
- Destructure new fields from `req.body`: `citation_number`, `fine_amount`, `alleged_speed`
- Include in Supabase insert payload
- `alleged_speed` should only be accepted when `violation_type === 'speeding'` (strip otherwise)

### Frontend Payload Mapping
The frontend sends camelCase; the backend expects snake_case. Current mapping gaps:
- `citationNumber` → `citation_number` (NEW — not currently sent)
- `fineAmount` → `fine_amount` (NEW)
- `allegedSpeed` → `alleged_speed` (NEW)
- `description` → `violation_details` (EXISTING — verify this mapping works)
- `location` → `town` (EXISTING — frontend uses `location`, DB has `town`/`county`)
- `type` → `violation_type` (EXISTING — verify)

Either the frontend or backend must handle this mapping. Prefer backend middleware or controller-level normalization.

## Acceptance Criteria
- [ ] createCase accepts `citation_number`, `fine_amount`, `alleged_speed`
- [ ] Validation rejects `alleged_speed` > 300 or < 1
- [ ] Validation rejects `fine_amount` < 0
- [ ] New violation_type values accepted by validation
- [ ] `alleged_speed` is stripped if violation_type is not `speeding`
- [ ] Existing createCase flow (without new fields) still works
- [ ] Backend tests updated

## Files to Modify
- `backend/src/routes/case.routes.js`
- `backend/src/controllers/case.controller.js`
- `backend/src/__tests__/case.controller.test.js`

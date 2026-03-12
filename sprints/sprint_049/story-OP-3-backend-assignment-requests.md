# Story OP-3: Backend — Operator-Scoped Cases + Assignment Requests

## Status: DONE

## Description
Rewrite backend operator endpoints to scope cases to the logged-in operator and add an
assignment request workflow where operators request assignment to unassigned cases (admin
must approve).

## Changes
- **`operator.controller.js`**:
  - `getOperatorCases`: Now filters by `assigned_operator_id = req.user.id` (was: all cases by status)
  - `getUnassignedCases`: New — returns cases with `assigned_operator_id IS NULL`, marks which ones the operator has already requested
  - `requestAssignment`: New — creates assignment_request record, notifies admins
- **`operator.routes.js`**: Added `GET /unassigned`, `POST /cases/:caseId/request-assignment`
- **`migrations/020_assignment_requests.sql`**: New table with RLS policies

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/operator/cases | Operator's own assigned cases |
| GET | /api/operator/unassigned | Unassigned cases queue |
| POST | /api/operator/cases/:caseId/request-assignment | Request assignment (admin approval required) |
| GET | /api/operator/attorneys | Available attorneys (unchanged) |

## Acceptance Criteria
- [x] Operator only sees their own assigned cases via GET /cases
- [x] Unassigned queue shows cases with no operator
- [x] Request assignment creates record + notifies admins
- [x] Duplicate request returns 400
- [x] Already-assigned case returns 400

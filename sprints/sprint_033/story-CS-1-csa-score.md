# Story CS-1 — CSA Score Display (Carrier Dashboard)

**Sprint:** 033 — Notification Hygiene + CSA Score
**Priority:** P1
**Status:** DONE

## User Story

As Sarah (carrier safety director),
I want to see a CSA impact score on my dashboard,
so I can report risk to the CEO at a glance without logging into FMCSA.

## Scope

### `backend/src/controllers/carrier.controller.js` — UPDATED

New function `getCsaScore(req, res)`:
- Queries open cases for the carrier
- Calculates a risk score using violation severity weights:
  - HOS (Hours of Service) violations: weight 3
  - Vehicle maintenance violations: weight 2
  - Speeding (11+ mph over): weight 2
  - Speeding (1-10 mph over): weight 1
  - Other: weight 1
- Formula: `csaScore = Σ(violation_weight × is_open) / max_expected × 100` (0–100 scale)
- Returns: `{ csaScore: 67, riskLevel: 'medium', openViolations: 12, breakdown: {...} }`
- Risk levels: `low` (0–33), `medium` (34–66), `high` (67–100)

### `backend/src/routes/carrier.routes.js` — UPDATED

New route: `GET /api/carriers/csa-score`

### `frontend/src/app/core/services/carrier.service.ts` — UPDATED

New method `getCsaScore(): Observable<CsaScoreResponse>`

### `frontend/src/app/features/carrier/dashboard/carrier-dashboard.component.ts` — UPDATED

- Load CSA score on init alongside existing dashboard metrics
- New signal: `csaScore()`
- Template: add CSA score widget card above existing stats:
  - Large number (0–100)
  - Color indicator: green (<34), yellow (34–66), red (67+)
  - Label: "CSA Risk Score" with tooltip explaining it
  - Sub-line: "Based on N open violations"

## Acceptance Criteria

- [x] CSA score widget appears on carrier dashboard
- [x] Score color-coded: green/yellow/red
- [x] Score computed from actual open cases (not hardcoded)
- [x] Tooltip explains what CSA score means
- [x] Score updates when cases are resolved

## Test Coverage Matrix

| Source File | Test File | Status |
|---|---|---|
| `carrier.controller.js` (getCsaScore) | `carrier.csa.test.js` | DONE |
| `carrier-dashboard.component.ts` | `carrier-dashboard.component.spec.ts` | DONE |

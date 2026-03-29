# Sprint 075 — Case Detail Violation Display & Enrichment

**Sprint Goal:** Display type-specific violation data richly in the case detail view with severity indicators, penalty information, CSA impact predictions, disqualification timelines, and extend type-aware editing and display to all user roles.

**Start Date:** TBD (after Sprint 074 complete)
**Status:** DONE

## Stories

| ID | Title | Priority | Status | Assignee |
|----|-------|----------|--------|----------|
| VD-1 | Violation Detail Card | P0 | DONE | Dev Lead |
| VD-2 | Severity Banner & Regulation Badge | P0 | DONE | Dev Lead |
| VD-3 | Penalty Impact Card | P1 | DONE | Dev Lead |
| VD-4 | CSA Impact Card | P1 | DONE | Dev Lead |
| VD-5 | Disqualification Timeline | P2 | DONE | Dev Lead |
| VD-6 | Operator & Attorney Edit Support | P1 | DONE | Dev Lead |
| VD-7 | Multi-Role View Integration | P2 | DONE | Dev Lead |
| VD-8 | Tests | P0 | DONE | QA |

## Architecture Notes

### New UI Cards (Case Detail — Left Column)
- **Violation Detail Card** — renders `type_specific_data` fields with labels from registry, placed between "Case Information" and "Documents" cards

### New UI Cards (Case Detail — Right Column)
- **Penalty Impact Card** — fine range, points, disqualification risk per type
- **CSA Impact Card** — BASIC category, severity weight, percentile impact (carrier-relevant)
- **Disqualification Timeline** — visual timeline for DUI/railroad/suspension types

### Hero Enhancements
- Severity banner (color-coded strip)
- Regulation reference badge (clickable CFR section pill)

### Shared Components Created
- `penalty-impact-card` — reusable across driver/operator/attorney views
- `csa-impact-card` — reusable, shown for carrier-linked cases
- `disqualification-timeline` — reusable for types with disqual risk

### Data Flow
All display components read from `caseData().type_specific_data` and derive display config from `VIOLATION_TYPE_REGISTRY`. No additional API calls needed — all metadata is client-side from the registry.

## Dependencies

- **Requires:** Sprint 074 complete (violation type registry, JSONB column, backend API)
- Builds on: Sprint 072 (case detail redesign — template structure, card pattern, teal design system)

## Deferred Items

- State-specific fine calculator (requires state fine database — V2)
- Defense strategy recommendations (AI-powered — V3)
- Attorney case notes on violation details (separate sprint)
- Carrier fleet-wide violation analytics (separate sprint)

## Definition of Done

- [x] All 8 stories marked DONE
- [x] Violation detail card renders type-specific data for all 14 active types
- [x] Severity banner displays in case hero with correct color coding
- [x] Regulation badge links to eCFR.gov
- [x] Penalty impact card shows fine range, points, disqual risk
- [x] CSA impact card shows BASIC category and severity weight
- [x] Disqualification timeline renders for DUI, railroad, suspension types
- [x] Operators and attorneys can edit type-specific fields
- [x] Admin/carrier/operator case tables show severity badges
- [x] `npx ng test --no-watch` passes (all existing + new tests)
- [x] `cd backend && npm test` passes (all existing + new tests)
- [x] WCAG 2.1 AA compliance verified for all new components

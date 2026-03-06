# Sprint 021 — Carrier Fleet Analytics

**Epic:** Carrier Portal — V1 Analytics
**Sprint:** 021
**Priority:** HIGH
**Status:** COMPLETE

## Goal

Give Sarah (Carrier Safety Director) fleet-wide visibility: trends, violation breakdowns, per-driver risk scores, and a one-click CSV export for DOT audits. Traces to `04_FUNCTIONAL_REQUIREMENTS.md` §1.2 Sarah stories 1–10 and Roadmap V1 "Analytics dashboard".

## Stories

| Story | Title | Priority | Status |
|---|---|---|---|
| [CA-1](story-CA-1-backend-analytics.md) | Backend: analytics + export endpoints | HIGH | TODO |
| [CA-2](story-CA-2-analytics-component.md) | Frontend: CarrierAnalyticsComponent | HIGH | TODO |
| [CA-3](story-CA-3-csv-export.md) | Frontend: CSV export button | MEDIUM | TODO |
| [CA-4](story-CA-4-dashboard-enhancements.md) | Frontend: Dashboard + Drivers enhancements | MEDIUM | TODO |
| [CA-5](story-CA-5-tests.md) | Tests: backend + frontend coverage | HIGH | TODO |

## Definition of Done (Sprint)

- [x] All 5 stories completed
- [ ] `/carrier/analytics` page renders real data from backend
- [ ] CSV export downloads a valid file
- [ ] Dashboard has "Analytics" quick action
- [ ] Drivers list shows per-driver open-case badge
- [ ] All tests pass: `cd frontend && npx ng test --no-watch` + `cd backend && npm test`
- [x] Sprint folder complete, all story statuses updated to DONE
- [ ] PR created and link posted to user

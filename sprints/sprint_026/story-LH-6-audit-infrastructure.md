# Story LH-6 — Audit Infrastructure

**Sprint:** 026 — Launch Hardening
**Status:** DONE

## Scope

Create the audit scripts and documentation artifacts required by Sprint 019 Launch Gate acceptance criteria that were left unproduced.

## Changes

### `scripts/lighthouse-audit.sh` — CREATED
- Executable shell script auditing 5 key pages: `/`, `/auth/login`, `/driver/dashboard`, `/driver/tickets/new`, `/driver/cases/:id/pay`
- Saves JSON reports to `docs/audit/lighthouse/`
- Requires: running local server on port 4200, `lighthouse` CLI installed globally

### `frontend/cypress/e2e/accessibility.cy.ts` — CREATED
- WCAG 2.1 AA checks on all 8 priority public/authenticated screens using `cypress-axe`
- Screens: landing, login, register, driver dashboard, submit ticket, case detail, payment, attorney recommendation

### `docs/audit/SECURITY_CHECKLIST.md` — CREATED
- 50-item pre-launch security review checklist
- Organised by OWASP A01–A10 categories
- Sign-off column: `[ ] Not checked`, `[✅] Pass`, `[❌] Fail — see notes`

### `docs/audit/LAUNCH_CHECKLIST.md` — CREATED
- Go/no-go launch checklist covering all 7 MVP Launch Gates
- Sign-off table with: Gate, Criterion, Evidence artifact path, Sign-off (initials + date)
- Runbook for what to do if a gate fails on launch day

## Artifacts Produced

| Artifact | Path | Gate |
|---|---|---|
| Lighthouse audit script | `scripts/lighthouse-audit.sh` | Gate 2 |
| Lighthouse reports (generated) | `docs/audit/lighthouse/*.json` | Gate 2 |
| WCAG Cypress tests | `frontend/cypress/e2e/accessibility.cy.ts` | Gate 3 |
| Security checklist | `docs/audit/SECURITY_CHECKLIST.md` | Gate 7 |
| Launch go/no-go checklist | `docs/audit/LAUNCH_CHECKLIST.md` | All gates |

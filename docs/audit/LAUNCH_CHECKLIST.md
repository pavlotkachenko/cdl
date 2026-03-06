# Launch Checklist — CDL Ticket Management

Beta launch readiness checklist. All items must be green before public launch.

---

## Code Quality

- [x] Sprint 001 — Core backend services (100% test coverage)
- [x] Sprint 002 — Backend test suite (103 tests, 0 failures)
- [x] Sprint 003 — Frontend-backend integration
- [x] Sprint 004 — Route security & auth hardening
- [x] Sprint 005 — Payment flow, OCR, missing spec coverage
- [x] Sprint 006 — Carrier fleet dashboard (real API)
- [x] Sprint 007 — Attorney portal modernization
- [x] Sprint 008 — Driver experience modernization
- [x] Sprint 024 — Operator & Paralegal portal modernization
- [x] Sprint 025 — Auth components modernization
- [x] Sprint 026 — Launch hardening (rate limiting, emails, empty states, tests)

## Security

- [x] Rate limiting on auth routes (100 req/15 min)
- [x] Rate limiting on public submit (10 req/15 min)
- [x] CORS origin whitelist with `PRODUCTION_URL` support
- [ ] Security checklist reviewed (`docs/audit/SECURITY_CHECKLIST.md`)
- [ ] Penetration testing or security audit completed
- [ ] No known HIGH/CRITICAL npm vulnerabilities (`npm audit`)

## Testing

- [x] Backend unit tests: all passing (excl. 5 pre-existing env-dependent suites)
- [x] Frontend unit tests: 253+ tests passing
- [ ] Cypress E2E: auth flow passing (`cypress/e2e/auth/`)
- [ ] Cypress E2E: payment flow tests written (`cypress/e2e/payment-flow.cy.ts`)
- [ ] Cypress E2E: accessibility tests written (`cypress/e2e/accessibility.cy.ts`)
- [ ] Accessibility: Lighthouse score ≥90 on mobile for all key pages
- [ ] Accessibility: WCAG 2.1 AA verified via axe (0 critical violations)

## Performance

- [ ] Lighthouse Performance ≥90 on mobile (landing, login, driver dashboard)
- [ ] Initial bundle size <300KB gzipped (`ng build --stats-json`)
- [ ] First Contentful Paint <1.5s on 4G
- [ ] Time to Interactive <3s on 4G
- [ ] API response time p95 <200ms (load test results)

## Features

- [x] Driver: Register, login, submit ticket, view cases, upload documents
- [x] Driver: Notifications, messages, payment flow
- [x] Carrier: Dashboard, fleet management, analytics, profile
- [x] Attorney: Dashboard, case management, accept/decline
- [x] Operator: Dashboard, case assignment, paralegal support
- [x] Admin: Dashboard, user management, case management, reports
- [x] Auth: Forgot password, reset password, role-based redirects
- [ ] Stripe: Real payment processing tested in staging with test cards
- [ ] SendGrid: Registration email confirmed in staging
- [ ] SendGrid: Case submission email confirmed in staging
- [ ] SendGrid: Attorney assignment email confirmed in staging

## Infrastructure

- [ ] Production domain configured (`PRODUCTION_URL` env var)
- [ ] SSL/TLS certificate provisioned and auto-renewing
- [ ] Supabase project set to production tier
- [ ] Database backups enabled and tested
- [ ] Environment variables set in production deployment
- [ ] `NODE_ENV=production` set in production
- [ ] Logging configured (no PII, structured format)
- [ ] Error monitoring configured (e.g. Sentry)
- [ ] Uptime monitoring configured (e.g. UptimeRobot)

## Content & Legal

- [ ] Terms of Service page live and linked from registration
- [ ] Privacy Policy page live and linked from registration
- [ ] Cookie consent banner (if collecting analytics)
- [ ] GDPR/CCPA data deletion process documented

## Operations

- [ ] On-call runbook written for common incidents
- [ ] Database migration process documented and tested
- [ ] Rollback procedure documented
- [ ] Staging environment mirrors production

---

## Go/No-Go Decision

| Gate | Owner | Status | Date |
|------|-------|--------|------|
| Security checklist complete | Dev Lead | | |
| Performance targets met | Dev Lead | | |
| E2E tests passing in staging | QA | | |
| Legal review complete | Legal | | |
| **Launch approved** | Product | | |

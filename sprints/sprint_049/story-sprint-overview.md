# Sprint 049 — Operator Experience: Login Fix, Dashboard, Assignment Requests

## Goal
Fix operator login flow (stuck on login / redirected to landing page) and implement a full
operator dashboard with scoped case visibility and assignment request workflow.

## Stories

| # | Story | Status |
|---|-------|--------|
| OP-1 | Fix operator login: auth service, routes, sidebar | DONE |
| OP-2 | Operator i18n keys (en, es, fr) | DONE |
| OP-3 | Backend: operator-scoped cases + assignment request endpoints | DONE |
| OP-4 | Frontend: operator dashboard rewrite (admin-like, scoped) | DONE |
| OP-5 | Operator routing: additional pages | DONE |

## Files Changed

### Backend
- `backend/src/controllers/operator.controller.js` — rewrote getOperatorCases (scoped to operator), added getUnassignedCases, requestAssignment
- `backend/src/routes/operator.routes.js` — added GET /unassigned, POST /cases/:caseId/request-assignment
- `backend/src/migrations/020_assignment_requests.sql` — new table for assignment requests

### Frontend
- `frontend/src/app/core/services/auth.service.ts` — added 'operator' to UserRole, navigateByRole()
- `frontend/src/app/core/guards/auth.guard.ts` — operatorGuard already existed
- `frontend/src/app/app.routes.ts` — added operator route with operatorGuard
- `frontend/src/app/core/layout/sidebar/sidebar.component.ts` — added operatorNavigation array
- `frontend/src/app/core/services/case.service.ts` — added getUnassignedCases(), requestAssignment()
- `frontend/src/app/features/operator/operator-dashboard/operator-dashboard.component.ts` — full rewrite
- `frontend/src/app/features/operator/operator-routing.module.ts` — added cases, queue, notifications, profile routes
- `frontend/src/assets/i18n/en.json` — added OPR.* keys (~40)
- `frontend/src/assets/i18n/es.json` — added OPR.* keys (Spanish)
- `frontend/src/assets/i18n/fr.json` — added OPR.* keys (French)

# Sprint 052 — Operator Case Management: Active Workflow Capabilities

## Goal
Give operators the tools to **actively manage** cases — not just view them. When this sprint is
done, an operator can: edit case data inline, attach and preview files, advance cases through a
validated status workflow with visual pipeline feedback, view their caseload as a Kanban board,
and access read-only team/archive boards for situational awareness. This sprint also fixes
critical backend defects discovered during the gap analysis.

## Context & Relationship to Sprint 051
Sprint 051 builds the operator's **viewing** infrastructure: case detail page, attorney assignment,
queue enrichment, messaging, batch OCR, and real-time notifications. Sprint 052 builds the
**active management** layer on top of that foundation.

**Key dependency:** Stories CM-3, CM-4, and CM-2 (frontend parts) assume the case detail
component from sprint 051 OC-1 exists. CM-1 (backend fixes) has NO dependency on sprint 051
and should be implemented first — it fixes a security-relevant middleware bug.

## Scope
- **Backend:** 1 middleware fix, 1 migration (enum), authorization patches, status transition
  engine, new document upload authorization
- **Frontend:** 4 new components (edit form, file manager, status pipeline, Kanban board),
  1 new service (status workflow), dashboard navigation enhancements
- **Testing:** Co-located `.spec.ts` for every new component/service, backend Jest tests for
  transition engine and authorization fixes
- **i18n:** ~60 new translation keys across en/es/fr

## Stories

| # | Story | Priority | Status |
|---|-------|----------|--------|
| CM-1 | Backend fixes: canAccessCase middleware, document upload auth, status enum, error format | P0 | DONE |
| CM-2 | Status workflow engine & pipeline UI (transition rules + visual stepper + quick actions) | P0 | DONE |
| CM-3 | Case data edit form (inline editing on case detail page) | P0 | DONE |
| CM-4 | Operator file management (upload, list, preview, delete on case detail) | P0 | DONE |
| CM-5 | Kanban board view (status-grouped columns with drag-and-drop) | P1 | DONE |
| CM-6 | Multi-board navigation & team visibility (All Cases, Closed Archive tabs) | P1 | DONE |
| CM-7 | i18n, accessibility & comprehensive test coverage | P2 | DONE |

## Critical Bug Discovered
**`canAccessCase` middleware** (`backend/src/middleware/auth.js:145`) selects
`created_by, operator_id, attorney_id` from the `cases` table, but the actual columns are
`driver_id, assigned_operator_id, assigned_attorney_id`. There is no `created_by` column on
`cases`. This means the middleware likely **always fails** for non-admin users hitting
endpoints that use it (`GET /api/cases/:id`, `PATCH /api/cases/:id`,
`POST /api/cases/:id/status`, etc.). CM-1 fixes this as the highest-priority item.

## Story Dependency Graph
```
CM-1 (backend fixes) ←─── EVERYTHING depends on this
  │
  ├──▶ CM-2 (status workflow) ──▶ CM-5 (Kanban — uses transition rules for drag-drop)
  │        │
  │        └──▶ CM-3 (case edit — needs status pipeline on same page)
  │
  ├──▶ CM-4 (file management — needs auth fix for document upload)
  │
  └──▶ CM-6 (multi-board — needs canAccessCase fix for team view)

CM-7 (polish) ←─── runs after all feature stories
```

## Implementation Order (recommended)
1. **Wave 0 (blocker fix):** CM-1 — must land first, everything else depends on it
2. **Wave 1 (core management):** CM-2, CM-3, CM-4 (parallel, all enhance case detail page)
3. **Wave 2 (dashboard features):** CM-5, CM-6 (parallel, both are dashboard-level)
4. **Wave 3 (polish):** CM-7

## Files Changed (summary — see individual stories for details)

### Backend (Modified)
- `middleware/auth.js` — fix `canAccessCase` column names
- `routes/case.routes.js` — add `operator` to document upload authorization
- `controllers/case.controller.js` — add transition validation to `changeStatus`, complete
  `uploadDocument` access for operators
- `controllers/operator.controller.js` — complete STATUS_LABELS coverage

### Backend (New)
- `services/status-workflow.service.js` — transition map, validation logic
- `migrations/017_add_resolved_status.sql` — add `resolved` to `case_status` enum
- `__tests__/status-workflow.service.test.js`

### Frontend (New)
- `features/operator/case-edit/case-edit-form.component.ts` + `.spec.ts`
- `features/operator/file-manager/file-manager.component.ts` + `.spec.ts`
- `features/operator/status-pipeline/status-pipeline.component.ts` + `.spec.ts`
- `features/operator/kanban/operator-kanban.component.ts` + `.spec.ts`
- `core/services/status-workflow.service.ts` + `.spec.ts`

### Frontend (Modified)
- `features/operator/operator-dashboard/operator-dashboard.component.ts` — add view toggle,
  multi-board tabs
- `features/operator/operator-routing.module.ts` — Kanban route
- `assets/i18n/en.json`, `es.json`, `fr.json` — ~60 new OPR.* keys

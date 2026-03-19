# Story CD-3: Frontend — Route Consolidation

## Meta

- **Sprint:** 065
- **Priority:** P0
- **Status:** DONE
- **Batch:** 1 (no dependencies)

## User Story

**As** a developer,
**I want** a single canonical route for the case detail page (`/driver/cases/:caseId`),
**So that** navigation is consistent, the route param bug is fixed, and deep links from payment/attorney flows work correctly.

## Problem

Two routes currently point to `CaseDetailComponent`:
- `/driver/tickets/:id` — param named `:id`
- `/driver/cases/:caseId` — param named `:caseId`

The component reads `params['id']` (line 122), so `/driver/cases/:caseId` silently fails — `this.caseId` is `undefined`. This is a live bug affecting navigation from payment success, attorney recommendation, and any `/driver/cases/` URLs.

Additionally, 20+ references across the app use `/driver/tickets` for both the list page and detail links. The list page (`/driver/tickets` → `TicketsComponent`) should remain, but detail links must consolidate to `/driver/cases/:caseId`.

## Scope

### Files to modify

| File | Action | Change |
|------|--------|--------|
| `frontend/src/app/features/driver/driver-routing.module.ts` | Modify | Remove `/driver/tickets/:id` route, add redirect from `tickets/:id` → `cases/:id` for backward compat |
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | Modify | Read `params['caseId']` instead of `params['id']` |
| `frontend/src/app/features/driver/case-detail/case-detail.component.spec.ts` | Modify | Update param mock from `{ id: 'case-1' }` to `{ caseId: 'case-1' }` |
| `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts` | Modify | Change `navigate(['/driver/tickets', id])` → `navigate(['/driver/cases', id])` |
| `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.spec.ts` | Modify | Update expected navigation path |
| `frontend/src/app/features/driver/dashboard/driver-dashboard.component.ts` | Review | `viewAllCases()` goes to `/driver/tickets` (list page) — keep as-is |
| `frontend/src/app/shared/components/notification-bell/notification-bell.component.ts` | Modify | Change `navigate(['/driver/tickets', caseId])` → `navigate(['/driver/cases', caseId])` |
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | Modify | `goBack()` changes from `/driver/tickets` to `/driver/cases` or stays `/driver/tickets` (list route) |
| `frontend/cypress/e2e/driver/case-management.cy.ts` | Review/Update | May reference `/driver/tickets/:id` for detail views |
| `frontend/src/assets/sitemap/index.html` | Update | Change sitemap entry |

### Navigation Reference Inventory

**Detail links (MUST change to `/driver/cases/:caseId`):**
- `submit-ticket.component.ts:374` — `navigate(['/driver/tickets', this.ticketId()])`
- `notification-bell.component.ts:71` — `navigate(['/driver/tickets', notification.data.caseId])`

**List links (KEEP as `/driver/tickets`):**
- `sidebar.component.ts:64` — nav link to list
- `layout.component.html:100` — header link to list
- `dashboard/driver-dashboard.component.ts:206` — viewAllCases to list
- `help/help.component.html:139` — link to list
- `help/help.component.ts:78` — link data

**Back navigation (KEEP — goes to list page):**
- `case-detail.component.ts:471` — `goBack()` → `/driver/tickets` (this is the list page, keep)

### Route Config Changes

```typescript
// BEFORE:
{ path: 'tickets/:id', component: CaseDetailComponent }
{ path: 'cases/:caseId', component: CaseDetailComponent }

// AFTER:
{ path: 'tickets/:id', redirectTo: 'cases/:id' }          // backward compat redirect
{ path: 'cases/:caseId', component: CaseDetailComponent }  // canonical route
```

## Acceptance Criteria

- [ ] `/driver/cases/:caseId` is the single canonical route for case detail
- [ ] `/driver/tickets/:id` redirects to `/driver/cases/:id` (backward compatibility)
- [ ] Component reads `params['caseId']` correctly
- [ ] `submit-ticket` navigates to `/driver/cases/:id` after submission
- [ ] `notification-bell` navigates to `/driver/cases/:caseId` on case notification click
- [ ] `goBack()` still navigates to `/driver/tickets` (list page — unchanged)
- [ ] `/driver/tickets` list page continues to work
- [ ] All existing tests updated and passing
- [ ] Cypress case management tests still pass
- [ ] Payment success "View My Case" still navigates correctly
- [ ] Attorney recommendation flow still navigates correctly
- [ ] All tests pass: `cd frontend && npx ng test --no-watch`

## Test Coverage Matrix

| Source File | Test File | Action |
|------------|-----------|--------|
| `frontend/src/app/features/driver/case-detail/case-detail.component.ts` | `case-detail.component.spec.ts` | Update param mock |
| `frontend/src/app/features/driver/submit-ticket/submit-ticket.component.ts` | `submit-ticket.component.spec.ts` | Update expected nav path |
| `frontend/src/app/features/driver/dashboard/driver-dashboard.component.ts` | `driver-dashboard.component.spec.ts` | Verify unchanged |

## Test Cases Required

1. Component initializes with `caseId` from route params (not `id`)
2. Redirect from `/driver/tickets/:id` to `/driver/cases/:id` works
3. `submit-ticket` viewTicket() navigates to `/driver/cases/:id`
4. `notification-bell` navigates to `/driver/cases/:caseId`
5. `goBack()` still navigates to `/driver/tickets` (list page)
6. Payment success "View My Case" arrives at case detail correctly

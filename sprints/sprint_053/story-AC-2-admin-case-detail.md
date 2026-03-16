# Story AC-2: Admin Case Detail Page with Component Reuse

## Status: DONE

## Priority: P0

## Depends On: AC-1 (backend case detail endpoint)

## Description
Create a dedicated admin case detail page at `/admin/cases/:id` that provides the same rich
case management experience operators have. Reuse the standalone components built in sprint 052
(StatusPipelineComponent, CaseEditFormComponent, FileManagerComponent) rather than rebuilding
them. The admin case detail is the primary screen where admins inspect, edit, and advance
individual cases.

## Current State
- Route `/admin/cases/:id` exists in `admin-routing.module.ts` but loads the same
  `CaseManagementComponent` (a list view) — the `:id` param is **ignored**
- Admin has no way to see a full case detail — only an inline expandable row in the list
- The inline expansion shows basic fields but has no activity log, no file access, no status
  pipeline, and no inline editing
- Sprint 052 operator components (`StatusPipelineComponent`, `CaseEditFormComponent`,
  `FileManagerComponent`) are standalone, role-agnostic, and use `CaseService` /
  `StatusWorkflowService` which admin is already authorized to call

## Design

### Page Layout
```
┌─────────────────────────────────────────────────────┐
│ ← Back to Cases    Case #CDL-2024-0042    [Assign]  │
│                                                      │
│ ┌─── Status Pipeline ──────────────────────────────┐ │
│ │ Intake ──● Assignment ──● Processing ──○ Payment │ │
│ │ Current: Assigned to Attorney                     │ │
│ │ [Send Info] [Wait for Driver] [Call Court]       │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─── Case Details (inline edit) ───────────────────┐ │
│ │ Violation Type: Speeding     State: NY           │ │
│ │ Court Date: 2026-04-15       Fine: $350          │ │
│ │ ... [Edit]                                        │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─── Assignment Info ──────────────────────────────┐ │
│ │ Operator: Lisa M.  [Reassign]                    │ │
│ │ Attorney: James H. [Change]                      │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─── Files ────────────────────────────────────────┐ │
│ │ [Upload] ticket.jpg  court-order.pdf             │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─── Activity Log ─────────────────────────────────┐ │
│ │ 2026-03-10 10:00 — Status changed to assigned    │ │
│ │ 2026-03-09 15:30 — Case created by operator Lisa │ │
│ └──────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Component Structure
```
AdminCaseDetailComponent (new)
├── StatusPipelineComponent (reused from sprint 052)
├── CaseEditFormComponent (reused from sprint 052)
├── AdminAssignmentSection (inline section, not separate component)
│   ├── Operator reassignment dropdown
│   └── Attorney reassignment dropdown
├── FileManagerComponent (reused from sprint 052)
└── Activity log section (inline, similar to operator case detail)
```

### Data Flow
1. Component reads `caseId` from `ActivatedRoute.params`
2. Calls `GET /api/admin/cases/:id` (AC-1) to get case + activity + staff names
3. Passes `caseData` to `CaseEditFormComponent` via `input()`
4. Passes `caseId` + `currentStatus` to `StatusPipelineComponent` via `input()`
5. Passes `caseId` to `FileManagerComponent` via `input()`
6. On `statusChanged` output, reloads case data to reflect new status
7. On `saved` output from edit form, updates local case data signal

### Assignment Section
- **Operator dropdown:** Fetches operators from `GET /api/admin/operators` (AC-1), displays
  current assignment, allows reassignment via `POST /api/cases/:id/assign-operator`
- **Attorney dropdown:** Fetches attorneys from `GET /api/operator/attorneys` (already exists),
  displays current assignment, allows reassignment via `POST /api/cases/:id/assign-attorney`
- On assignment change, create activity log entry and show snackbar confirmation

### Activity Log
- Rendered as a vertical timeline showing actions chronologically (newest first)
- Each entry shows: timestamp, action description, actor name
- Loaded from `activity` array in the case detail response

## Implementation

### New Files
- `frontend/src/app/features/admin/case-detail/admin-case-detail.component.ts`
- `frontend/src/app/features/admin/case-detail/admin-case-detail.component.spec.ts`

### Modified Files
- `frontend/src/app/features/admin/admin-routing.module.ts` — point `/admin/cases/:id` to new
  `AdminCaseDetailComponent` instead of `CaseManagementComponent`
- `frontend/src/app/core/services/admin.service.ts` — add `getAdminCaseDetail(id)`,
  `assignOperator(caseId, operatorId)`, `getOperators()` methods

### Component Inputs/Outputs
The reused sprint 052 components are already input/output driven:
- `StatusPipelineComponent`: `input: currentStatus, caseId` / `output: statusChanged`
- `CaseEditFormComponent`: `input: caseData, readonly` / `output: saved, cancelled`
- `FileManagerComponent`: `input: caseId, readonly, currentUserId`

The admin case detail component orchestrates these by:
- Feeding them data from the admin case detail API
- Listening to their outputs to refresh state
- Adding admin-specific sections (assignment, activity log)

### Routing Update
```typescript
// In admin-routing.module.ts, change:
{ path: 'cases/:id', loadComponent: () => import('./case-management/...') }
// To:
{ path: 'cases/:id', loadComponent: () => import('./case-detail/admin-case-detail.component')
    .then(m => m.AdminCaseDetailComponent) }
```

## Non-Functional Requirements

### Accessibility
- Back button has `aria-label="Back to cases list"`
- Assignment dropdowns have `aria-label` describing the action
- Activity log entries use semantic `<time>` elements
- All interactive elements meet 44x44px touch target minimum
- Focus returns to trigger element after dropdown close

### Performance
- Case detail loads in single API call (joins on backend)
- Lazy-load FileManagerComponent's file list on scroll into view (optional)
- No unnecessary re-renders — OnPush + signals throughout

### Mobile
- Sections stack vertically on screens < 768px
- Assignment dropdowns are full-width on mobile
- Activity log scrollable with max-height

## Tests

### Unit Tests (admin-case-detail.component.spec.ts)
- Reads caseId from route params and calls adminService.getAdminCaseDetail
- Renders StatusPipelineComponent with correct currentStatus and caseId
- Renders CaseEditFormComponent with caseData
- Renders FileManagerComponent with caseId
- Shows activity log entries in reverse chronological order
- Shows operator assignment with current name
- Shows attorney assignment with current name
- Reassign operator calls assignOperator and reloads case
- Reassign attorney calls assignAttorney and reloads case
- StatusChanged output triggers case reload
- Saved output from edit form updates local case data
- Shows loading spinner while fetching
- Shows error message on fetch failure
- Back button navigates to /admin/cases
- Minimum 15 tests

## Acceptance Criteria
- [x] `/admin/cases/:id` renders a dedicated detail page (not the list view)
- [x] StatusPipelineComponent renders with current status and allows transitions
- [x] CaseEditFormComponent renders in view mode, allows inline editing and saving
- [x] FileManagerComponent renders file list, allows upload/preview/delete
- [x] Activity log shows all case events with timestamps and actor names
- [x] Operator can be reassigned via dropdown (calls real backend)
- [x] Attorney can be reassigned via dropdown (calls real backend)
- [x] Status changes from pipeline trigger case data reload
- [x] Back button returns to `/admin/cases` list
- [x] Loading and error states handled gracefully
- [x] Page is fully responsive (mobile stacks sections vertically)
- [x] All interactive elements meet WCAG 2.1 AA (keyboard, contrast, touch targets)
- [x] Unit tests pass with ≥15 test cases (19 tests)
- [x] Build succeeds with no errors

# Story AC-5: Admin Status Workflow Integration

## Status: DONE

## Priority: P1

## Depends On: AC-1 (backend updateCaseStatus with workflow validation), AC-2 (case detail page)

## Description
The admin case management list (`case-management.component.ts`) currently changes case
statuses via quick buttons that call `PATCH /api/admin/cases/:id/status` **without validation**.
There is no check for allowed transitions — admin can set any status to any other status,
which corrupts the workflow state machine (e.g., jumping from "new" directly to "attorney_paid"
would skip the entire assignment and processing flow).

This story integrates the `StatusWorkflowService` (built in sprint 052 CM-2) into the admin
case management list so that:
1. Quick-action buttons only show **valid next statuses** (not all statuses)
2. Status changes requiring a note prompt the admin for one
3. Admin retains the ability to **override** the workflow (force any transition) with an
   explicit confirmation and audit trail entry

## Current State

### Case Management Quick Status Buttons
```typescript
// Current: hardcoded status buttons that bypass workflow
quickStatuses = [
  { key: 'ADMIN.STATUS_ASSIGNED', value: 'assigned_to_attorney' },
  { key: 'ADMIN.STATUS_IN_PROGRESS', value: 'in_progress' },
  { key: 'ADMIN.STATUS_RESOLVED', value: 'resolved' },
  { key: 'ADMIN.STATUS_CLOSED', value: 'closed' },
];

updateStatus(c: any, status: string): void {
  this.adminService.updateCaseStatus(c.id, status).subscribe(...);
}
```
**Problem:** These 4 buttons appear for every case regardless of current status. Admin can
click "Resolved" on a "new" case without warning. No note is collected for transitions that
require one (like closing a case).

### Backend (After AC-1)
The `PATCH /api/admin/cases/:id/status` endpoint (AC-1) will use
`statusWorkflowService.validateTransition()` by default and support an `override: true` flag
for admin force-transitions. This story is the **frontend counterpart** to that backend work.

## Design

### Valid-Next-Statuses Pattern
Replace the static `quickStatuses` array with a dynamic approach:

1. When a case row expands to show details, fetch next valid statuses:
   `GET /api/cases/:id/next-statuses` (already exists, admin authorized)
2. Render only the valid transitions as action buttons
3. If a transition requires a note, open the `StatusNoteDialogComponent` (reuse from sprint 052)
4. Send the status change with optional note

### Admin Override
Add an "Override" button that:
1. Shows a dropdown of **all statuses** (not just valid next ones)
2. When selected, shows a confirmation dialog:
   "This is a non-standard transition from '{current}' to '{target}'. A note is required for
   audit purposes."
3. Requires a note (mandatory for overrides)
4. Calls backend with `{ status, comment, override: true }`
5. Activity log records this as "Admin override: {from} → {to}" with the admin's name

### Visual Differentiation
- **Valid transitions:** Green-outlined buttons with status icon (same style as StatusPipeline)
- **Override button:** Gray button with lock/admin icon, labeled "Override Status"
- Override actions are visually distinct to discourage casual use

## Implementation

### Modified Files
- `frontend/src/app/features/admin/case-management/case-management.component.ts`:
  - Import `StatusWorkflowService` and `StatusNoteDialogComponent`
  - Replace static `quickStatuses` with dynamic next-status loading per expanded case
  - Add `nextStatuses` signal map (keyed by case ID)
  - Add `requiresNote` signal map (keyed by case ID)
  - On case expand, call `statusWorkflowService.getNextStatuses(caseId)`
  - Replace `updateStatus()` with `onStatusAction(caseId, targetStatus)` that checks
    `requiresNote` and opens dialog when needed
  - Add `onOverride(caseId)` method for admin override flow
  - Add override confirmation dialog (can use MatDialog with simple template)

- `frontend/src/app/features/admin/case-management/case-management.component.spec.ts`:
  - Update tests to mock StatusWorkflowService
  - Add tests for dynamic next-status loading, note dialog, override flow

- `frontend/src/app/core/services/admin.service.ts`:
  - Update `updateCaseStatus()` to accept `override?: boolean` parameter

### Template Changes
```html
<!-- Replace static quick-status buttons with dynamic ones -->
@if (expandedCaseId() === c.id) {
  <div class="status-actions">
    @if (loadingStatuses()[c.id]) {
      <mat-spinner diameter="20"></mat-spinner>
    } @else {
      @for (ns of nextStatuses()[c.id] || []; track ns) {
        <button mat-stroked-button
                class="status-action"
                [class.requires-note]="requiresNote()[c.id]?.[ns]"
                (click)="onStatusAction(c, ns)">
          <mat-icon>{{ getStatusIcon(ns) }}</mat-icon>
          {{ getStatusLabel(ns) | translate }}
        </button>
      }

      @if ((nextStatuses()[c.id] || []).length === 0) {
        <span class="terminal-status">{{ 'ADMIN.CASE.TERMINAL_STATUS' | translate }}</span>
      }

      <button mat-stroked-button class="override-btn" (click)="onOverride(c)">
        <mat-icon>admin_panel_settings</mat-icon>
        {{ 'ADMIN.CASE.OVERRIDE_STATUS' | translate }}
      </button>
    }
  </div>
}
```

### Override Dialog
Simple MatDialog with:
- Status dropdown (all statuses)
- Note textarea (required, min 10 chars)
- Warning message about non-standard transition
- Cancel / Confirm buttons

## Non-Functional Requirements

### Security
- Override flag is checked on backend — frontend cannot bypass validation without it
- Activity log clearly distinguishes standard transitions from admin overrides
- Override usage should be auditable (distinct activity type in log)

### Accessibility
- Status action buttons have `aria-label` including target status name
- Override button clearly labeled
- Note dialog follows same a11y patterns as StatusNoteDialogComponent
- Loading spinner has `role="status"`, `aria-busy="true"`

### UX
- Standard transitions are prominent (green, primary)
- Override is subdued (gray, secondary) — not the default path
- Note dialog pre-focuses the textarea
- Override dialog includes current status label for context

## Tests

### Unit Tests
- Expanded case fetches next statuses from StatusWorkflowService
- Only valid next statuses render as buttons
- Button click on status requiring note opens StatusNoteDialogComponent
- Button click on status not requiring note calls updateCaseStatus directly
- Cancel on note dialog does not change status
- Confirm on note dialog calls updateCaseStatus with note
- Override button opens override dialog with all statuses
- Override requires note (min 10 chars)
- Override calls updateCaseStatus with `override: true`
- Terminal status (no next statuses) shows appropriate message
- Loading state shown while fetching next statuses
- Error state on fetch failure
- Minimum 12 tests

## Acceptance Criteria
- [x] Quick-action buttons show only valid next statuses (not all statuses)
- [x] Statuses requiring a note open the note dialog before proceeding
- [x] Standard status changes call backend WITHOUT override flag
- [x] Override button provides access to ALL statuses regardless of workflow rules
- [x] Override requires a mandatory note (min 10 characters)
- [x] Override calls backend WITH `override: true` flag
- [x] Activity log distinguishes standard transitions from admin overrides
- [x] Terminal statuses (no valid next) show informative message
- [x] Loading state shown while fetching next statuses for expanded case
- [x] StatusWorkflowService and StatusNoteDialogComponent reused from sprint 052
- [x] All interactive elements meet WCAG 2.1 AA
- [x] Unit tests pass with ≥12 test cases (22 tests pass)
- [x] Build succeeds with no errors

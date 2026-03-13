# Story CM-7: i18n, Accessibility & Comprehensive Test Coverage

## Status: TODO

## Priority: P2

## Depends On: CM-1 through CM-6 (all feature stories)

## Description
Add translation keys for all new sprint 052 UI elements, run accessibility audits, fix any
violations, and ensure every new component and service has comprehensive test coverage per
the Sprint Testing Mandate.

## i18n Changes

### New Translation Keys (~60 keys)

**Case Edit (OPR.EDIT.*):**
- `TITLE`, `EDIT_BTN`, `SAVE_BTN`, `CANCEL_BTN`, `SAVING`, `SAVED`,
  `UNSAVED_CHANGES`, `DISCARD_CONFIRM`, `DISCARD_YES`, `DISCARD_NO`,
  `VIOLATION_TYPE`, `VIOLATION_DATE`, `VIOLATION_DETAILS`, `STATE`, `COUNTY`,
  `TOWN`, `COURT_DATE`, `NEXT_ACTION_DATE`, `FINE_AMOUNT`, `COURT_FEE`,
  `CARRIER`, `FIELD_REQUIRED`, `FIELD_TOO_LONG`, `INVALID_DATE`,
  `NON_EDITABLE`, `CHANGES_SAVED_FIELDS`

**File Management (OPR.FILES.*):**
- `TITLE`, `UPLOAD_BTN`, `DRAG_DROP`, `OR_BROWSE`, `UPLOADING`, `UPLOADED`,
  `PREVIEW`, `DOWNLOAD`, `DELETE`, `DELETE_CONFIRM`, `DELETE_CONFIRM_MSG`,
  `NO_FILES`, `FILE_TOO_LARGE`, `INVALID_TYPE`, `MAX_FILES_REACHED`,
  `UPLOAD_ERROR`, `FILE_TYPE_BADGE`, `UPLOADED_BY`, `UPLOADED_AT`

**Status Workflow (OPR.WORKFLOW.*):**
- `CURRENT_STATUS`, `NEXT_STEPS`, `CHANGE_STATUS`, `NOTE_REQUIRED`,
  `NOTE_PLACEHOLDER`, `NOTE_MIN_LENGTH`, `CONFIRM_CHANGE`, `STATUS_CHANGED`,
  `INVALID_TRANSITION`, `PIPELINE_COMPLETE`

**Status Labels (additions):**
- `OPR.STATUS_ATTORNEY_PAID`, `OPR.STATUS_CHECK_MANAGER`, `OPR.STATUS_PAY_ATTORNEY`,
  `OPR.STATUS_RESOLVED`

**Phase Labels (OPR.PHASE_*):**
- `PHASE_INTAKE`, `PHASE_ASSIGNMENT`, `PHASE_PROCESSING`, `PHASE_PAYMENT`, `PHASE_RESOLUTION`

**Kanban (OPR.KANBAN.*):**
- `TITLE`, `EMPTY`, `DRAG_HINT`, `INVALID_DROP`, `VIEW_LIST`, `VIEW_KANBAN`

**Multi-Board Tabs (OPR.TAB_*):**
- `TAB_MY_CASES`, `TAB_QUEUE`, `TAB_ALL_CASES`, `TAB_ARCHIVE`,
  `ALL_CASES_READONLY`, `MINE_BADGE`, `NO_CLOSED_CASES`

### Translation File Updates
Add all keys to:
- `frontend/src/assets/i18n/en.json` — English (primary)
- `frontend/src/assets/i18n/es.json` — Spanish
- `frontend/src/assets/i18n/fr.json` — French

## Accessibility Audit

### All New Components Must Pass
Run AXE audit (`npx axe` or Lighthouse) on each new component page:

| Component | Key A11y Concerns |
|-----------|------------------|
| CaseEditForm | Form labels, error announcements, focus on edit/save, disabled state communication |
| FileManager | Upload zone keyboard access (`Enter`/`Space`), drag-and-drop alternatives, preview focus trap, delete confirmation |
| StatusPipeline | Stepper `role="progressbar"` or `role="list"`, action button labels, note dialog focus management |
| KanbanBoard | CDK drag keyboard support (already built in), column `role="group"`, card `aria-label`, drop feedback |
| Multi-Board Tabs | MatTabGroup handles most a11y, verify tab panel `aria-labelledby`, lazy-loaded content announced |

### Specific A11y Fixes to Verify
- [ ] Upload zone: `role="button"`, `tabindex="0"`, `aria-label="Upload files"`
- [ ] File preview overlay: `role="dialog"`, `aria-modal="true"`, focus trapped, close on Escape
- [ ] Delete confirmation: `role="alertdialog"`, focus on confirm button
- [ ] Status pipeline: each phase has `aria-label` describing completion state
- [ ] Quick action buttons: `aria-label` includes target status name
- [ ] Note dialog: `aria-label`, required field has `aria-required="true"`
- [ ] Kanban cards: `aria-roledescription="draggable card"`, drop zones `aria-label`
- [ ] Kanban columns: `aria-label` includes column name and case count
- [ ] All color indicators paired with text or icon (not color-only communication)
- [ ] Touch targets ≥44×44px on all interactive elements
- [ ] Color contrast ≥4.5:1 on all text

## Test Coverage Matrix

Every file created or modified in sprint 052 must have a corresponding test:

### Backend Tests Required

| Source File | Test File | Tests |
|-------------|-----------|-------|
| `middleware/auth.js` (modified) | `__tests__/auth.middleware.test.js` | canAccessCase with correct columns |
| `services/status-workflow.service.js` (new) | `__tests__/status-workflow.service.test.js` | All transition validations |
| `controllers/case.controller.js` (modified) | `__tests__/case.controller.test.js` | Transition validation in changeStatus, operator document upload/delete |
| `controllers/operator.controller.js` (modified) | `__tests__/operator.controller.test.js` | Error format normalization |

### Frontend Tests Required

| Source File | Test File | Min Tests |
|-------------|-----------|-----------|
| `case-edit-form.component.ts` | `case-edit-form.component.spec.ts` | 12 |
| `file-manager.component.ts` | `file-manager.component.spec.ts` | 15 |
| `status-pipeline.component.ts` | `status-pipeline.component.spec.ts` | 10 |
| `operator-kanban.component.ts` | `operator-kanban.component.spec.ts` | 8 |
| `status-workflow.service.ts` | `status-workflow.service.spec.ts` | 6 |
| `file.service.ts` (if new) | `file.service.spec.ts` | 4 |
| `operator-dashboard.component.ts` (modified) | Update existing spec | +4 (tab tests) |

### Test Commands
```bash
# Backend
cd backend && npm test --no-coverage

# Frontend (all unit tests)
cd frontend && npx ng test --no-watch

# Verify no regressions
cd frontend && npx ng test --no-watch 2>&1 | tail -5
# Expected: "X/X tests passed"
```

## Acceptance Criteria
- [ ] All ~60 translation keys added to en.json, es.json, fr.json
- [ ] Language switch correctly reflects new translations on all sprint 052 screens
- [ ] AXE audit on CaseEditForm, FileManager, StatusPipeline, Kanban: zero violations
- [ ] Keyboard navigation works for: edit form, file upload, status change, Kanban drag
- [ ] Focus management correct for: dialog open/close, edit mode toggle, file preview
- [ ] All interactive elements ≥44×44px touch targets
- [ ] Color contrast ≥4.5:1 on all text elements
- [ ] Every new source file has a co-located test file
- [ ] Backend tests pass: `npm test` from `backend/`
- [ ] Frontend tests pass: `npx ng test --no-watch` from `frontend/`
- [ ] Zero test regressions (existing tests still pass)
- [ ] Build succeeds with no errors

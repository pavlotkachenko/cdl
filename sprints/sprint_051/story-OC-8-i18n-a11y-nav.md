# Story OC-8: i18n, Accessibility & Navigation Consolidation

## Status: DONE

## Priority: P2

## Depends On: OC-1, OC-2, OC-4, OC-5 (all new components must exist first)

## Description
Add translation keys for all new operator screens, ensure WCAG 2.1 AA compliance across the
operator module, and consolidate the operator sidebar navigation to include all new routes.

### User Stories
> As a **Spanish-speaking operator**, I want the case detail, attorney assignment, messaging,
> and batch OCR screens to display in my language.

> As an **operator using a screen reader**, I want all interactive elements to be properly
> labeled and navigable via keyboard so I can perform my job without a mouse.

## i18n Changes

### New Translation Keys
Add keys under the `OPR` namespace in `en.json`, `es.json`, `fr.json`:

**Case Detail (OPR.DETAIL.*):**
- `TITLE`, `BACK`, `TICKET_INFO`, `DRIVER_INFO`, `COURT_DATES`, `ATTORNEY`,
  `ASSIGN_ATTORNEY`, `STATUS`, `UPDATE_STATUS`, `ACTIVITY_LOG`, `NO_COURT_DATES`,
  `NO_ATTORNEY`, `NO_ACTIVITY`, `STATUS_NOTE_PLACEHOLDER`, `LOADING`,
  `VIOLATION_TYPE`, `VIOLATION_DATE`, `STATE_COUNTY`, `FINE_AMOUNT`, `CDL_NUMBER`,
  `PHONE`, `EMAIL`, `COURTHOUSE`, `COURT_TIME`

**Attorney Assignment (OPR.ASSIGN.*):**
- `TITLE`, `AUTO_ASSIGN`, `AUTO_ASSIGN_DESC`, `MANUAL_TITLE`, `RANK`, `NAME`,
  `SCORE`, `SPECIALIZATIONS`, `JURISDICTIONS`, `ACTIVE_CASES`, `SELECT`,
  `CONFIRM_ASSIGN`, `NO_ATTORNEYS`, `NO_ATTORNEYS_DESC`, `ASSIGNING`, `ASSIGNED_SUCCESS`,
  `SCORE_BREAKDOWN`, `WEIGHT_SPECIALIZATION`, `WEIGHT_LICENSE`, `WEIGHT_WORKLOAD`,
  `WEIGHT_SUCCESS_RATE`, `WEIGHT_AVAILABILITY`

**Messaging (OPR.MSG.*):**
- `TITLE`, `TEMPLATES`, `SEND`, `TYPE_MESSAGE`, `NO_MESSAGES`, `SENDING`,
  `TEMPLATE_PICKER_TITLE`, `USE_TEMPLATE`, `PREVIEW`, `VARIABLES`, `CTRL_ENTER_SEND`

**Batch OCR (OPR.OCR.*):**
- `TITLE`, `UPLOAD_ZONE`, `DRAG_DROP`, `OR_BROWSE`, `PROCESS_ALL`, `PROCESSING`,
  `RESULTS`, `SUCCESSFUL`, `FAILED`, `RETRY`, `CREATE_CASE`, `CREATE_ALL`,
  `FILE_LIMIT`, `SIZE_LIMIT`, `CONFIDENCE`, `REMOVE_FILE`, `SUMMARY`

**Queue Enrichment (OPR.*):**
- `COURT_DATE`, `FINE_AMOUNT`, `PRIORITY`, `PRIORITY_CRITICAL`, `PRIORITY_HIGH`,
  `PRIORITY_MEDIUM`, `PRIORITY_LOW`, `PRIORITY_LEGEND`

### Translation Counts
Approximately 70–80 new keys per language file. Follow existing patterns (flat namespace
under `OPR`).

## Accessibility Changes

### All New Components Must Pass
- **AXE automated audit** — zero violations
- **Keyboard navigation** — Tab order logical, Enter/Space to activate, Escape to close dialogs
- **Focus management** — When dialog opens, focus trapped inside. When dialog closes, focus
  returns to trigger element. When navigating to a new page, focus moves to main heading.
- **ARIA labels** — All icon-only buttons have `aria-label`. Data tables have `role="table"`
  or use native `<table>`. Status chips have `role="status"`. Progress bars have
  `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.
- **Color contrast** — All text meets 4.5:1 against background. Priority colors have
  sufficient contrast or use accompanying text/icon.
- **Touch targets** — All interactive elements ≥44×44px
- **Screen reader announcements:**
  - New message sent → `aria-live="polite"` region announces "Message sent"
  - OCR processing complete → announces "Processing complete: N successful, M failed"
  - Assignment complete → announces "Attorney [Name] assigned to case"

### Specific Component Audits

**Case Detail:**
- Heading hierarchy: h1 for case number, h2 for section titles
- Driver phone/email links have descriptive `aria-label` ("Call Marcus Rivera", "Email Marcus Rivera")
- Activity log is a `<ul>` with `role="list"`, each entry is `<li>`

**Attorney Assignment Dialog:**
- Dialog has `role="dialog"`, `aria-labelledby` pointing to title
- Attorney list is keyboard navigable: arrow keys to move, Enter to select
- Score tooltip accessible via focus (not hover-only)

**Messaging:**
- Message thread has `role="log"`, `aria-live="polite"` for new messages
- Template picker is keyboard navigable
- Send button has clear label, not just an icon

**Batch OCR:**
- Drop zone has `role="button"`, `aria-label="Upload ticket images"`
- File list uses `role="list"` with remove buttons labeled per file
- Results announced via `aria-live` region

## Navigation Consolidation

### Operator Sidebar/Nav Updates
The operator sidebar (managed by `LayoutComponent` or operator-specific nav) should include:
- Dashboard (existing)
- Cases (alias to dashboard, or dedicated list view)
- Batch OCR (new)
- Notifications (existing)
- Profile (existing)

Ensure active route is highlighted. Add icons for each nav item (Material Icons).

### Route Cleanup
In `operator-routing.module.ts`:
- `/operator/cases` → dashboard (existing, list view)
- `/operator/cases/:id` → case detail (OC-1)
- `/operator/cases/:id/messages` → messaging (OC-4)
- `/operator/cases/:id/assign-attorney` → attorney assignment dialog (or keep as dialog)
- `/operator/batch-ocr` → batch OCR (OC-5)
- `/operator/queue` → remove or alias to dashboard (redundant)
- `/operator/notifications` → existing
- `/operator/profile` → existing

## Acceptance Criteria
- [ ] All new OPR.* translation keys added to en.json, es.json, fr.json
- [ ] Language switch on any operator page correctly reflects translations
- [ ] AXE audit on every new operator component returns zero violations
- [ ] All interactive elements keyboard navigable (Tab, Enter, Escape)
- [ ] Focus management: dialog trap, return focus on close, page focus on navigate
- [ ] Screen reader announcements for key actions (message sent, OCR complete, assigned)
- [ ] Color contrast ≥4.5:1 on all text elements
- [ ] Touch targets ≥44×44px on all interactive elements
- [ ] Operator sidebar shows all routes with correct active state
- [ ] Redundant `/operator/queue` route removed or aliased
- [ ] Build succeeds with no errors

## Test Coverage
- Snapshot or visual regression test to verify translations render (spot check 3 keys per language)
- Keyboard navigation test: Tab through case detail, verify all sections reachable
- AXE integration test in Cypress for each new operator page

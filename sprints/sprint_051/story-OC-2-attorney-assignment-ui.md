# Story OC-2: Attorney Assignment UI (Auto + Manual with Ranking)

## Status: DONE

## Priority: P0

## Depends On: OC-1 (case detail component)

## Description
Build the attorney assignment interface that operators use to assign attorneys to cases. Supports
two modes: **auto-assign** (system picks the highest-ranked attorney) and **manual assignment**
(operator reviews a ranked list and picks one). This satisfies TC-OPR-002, TC-OPR-003,
TC-OPR-004, and TC-OPR-007.

### User Stories
> As an **operator**, I want to click "Auto-Assign" on a case so the system automatically selects
> the best-ranked attorney based on specialization, state license, workload, success rate, and
> availability.

> As an **operator**, I want to view a ranked list of available attorneys with their scores and
> manually select one, so I can use my judgment when the algorithm's top pick isn't ideal.

> As an **operator**, I want suspended attorneys to be filtered out of the assignment list so I
> never accidentally assign a case to an inactive attorney.

## Backend Changes

### Modify: `GET /api/operator/attorneys` → `GET /api/assignments/cases/:caseId/ranked-attorneys`
The existing `operator.controller.getAvailableAttorneys` returns attorneys without scoring.
The existing `assignment.controller.getRankedAttorneys` has the scoring algorithm but is
accessed via assignment routes. **Decision:** Use the assignment controller's ranked endpoint
(already has the scoring algorithm) and ensure it filters suspended attorneys.

**Changes to `assignment.service.js` → `rankAttorneys(caseId)`:**
- Add filter: exclude users where `is_active = false` (suspended)
- Ensure `availabilityStatus` is populated from user record
- Include `is_active` status in response for transparency

**Changes to `assignment.controller.js` → `getRankedAttorneys`:**
- Default `includeUnavailable` to `false` (already done)
- Add explicit `is_active` filter in the service query

**Changes to `assignment.controller.js` → `autoAssignCase`:**
- After selecting top attorney, verify `is_active = true` before assigning
- If no available attorneys, return `{ success: false, error: 'No attorneys available at this time' }`
  with 404 status (not 500)
- Create activity log entry after assignment
- Trigger notification to assigned attorney

**Changes to `assignment.controller.js` → `manualAssignCase`:**
- Verify selected attorney `is_active = true`, return 400 if suspended
- Create activity log entry
- Trigger notification to assigned attorney

### Ensure route access for operators
In `assignment.routes.js`, verify `authorize(['operator', 'admin'])` on:
- `GET /api/assignments/cases/:caseId/ranked-attorneys`
- `POST /api/assignments/cases/:caseId/auto-assign`
- `POST /api/assignments/cases/:caseId/manual-assign`

## Frontend Changes

### New Component: `AttorneyAssignmentComponent`
**Path:** `frontend/src/app/features/operator/attorney-assignment/attorney-assignment.component.ts`

This can be either a standalone page at `/operator/cases/:id/assign-attorney` or a dialog
opened from the case detail page. **Recommendation:** Dialog (MatDialog) keeps the user in
context and avoids a full page navigation.

**Signals:**
- `attorneys = signal<RankedAttorney[]>([])` — ranked list from API
- `loading = signal(true)`
- `assigning = signal(false)` — true while auto/manual assign in progress
- `selectedAttorneyId = signal<string | null>(null)` — for manual selection
- `noAttorneys = signal(false)` — true when list is empty (TC-OPR-004)
- `error = signal('')`

**Template:**
1. **Header:** "Assign Attorney for Case CDL-XXX"
2. **Auto-Assign button** — prominent primary action at top. Shows spinner while processing.
   On success: closes dialog, shows snackbar "Attorney [Name] assigned". On "no attorneys":
   shows inline warning message (TC-OPR-004)
3. **Ranked list** — table or card list showing:
   - Rank number (#1, #2, ...)
   - Attorney name
   - Score (e.g., "87/100") with tooltip showing breakdown (specialization, license, workload,
     success rate, availability)
   - Specializations as chips
   - Jurisdictions as chips
   - Active case count
   - "Select" radio button or click-to-select row highlight
4. **Confirm button** — enabled only when an attorney is selected. "Assign [Attorney Name]"
5. **Empty state** — when no attorneys available: illustration + "No attorneys available at
   this time. Case will be queued for later assignment." (TC-OPR-004)

**Styling:**
- Score column uses color gradient: green (≥70), amber (40–69), red (<40)
- Selected row has highlighted background
- Suspended attorneys are NOT shown (filtered server-side per TC-OPR-007)
- Responsive: table collapses to card layout on mobile
- Score tooltip shows the 5 scoring dimensions with weights

### Dialog Data Interface
```typescript
interface AttorneyAssignmentDialogData {
  caseId: string;
  caseNumber: string;
}

interface AttorneyAssignmentDialogResult {
  assigned: boolean;
  attorneyName?: string;
}
```

### Service Methods
In `case.service.ts` or `operator.service.ts`:
```typescript
getRankedAttorneys(caseId: string): Observable<{ attorneys: RankedAttorney[]; total: number }>
autoAssignCase(caseId: string): Observable<{ attorney: { id: string; name: string } }>
manualAssignCase(caseId: string, attorneyId: string): Observable<{ attorney: { id: string; name: string } }>
```

### Integration with Case Detail (OC-1)
The case detail component's "Assign Attorney" button opens this dialog:
```typescript
openAssignDialog() {
  const ref = this.dialog.open(AttorneyAssignmentComponent, {
    data: { caseId: this.caseId, caseNumber: this.caseData()?.case_number },
    width: '700px', maxWidth: '95vw'
  });
  ref.afterClosed().subscribe(result => {
    if (result?.assigned) this.loadCase(); // refresh
  });
}
```

## Acceptance Criteria
- [ ] Ranked attorney list loads from `GET /api/assignments/cases/:caseId/ranked-attorneys`
- [ ] Attorneys are sorted by score descending; each shows score, specializations, jurisdictions, active count
- [ ] Score tooltip shows the 5-dimension breakdown with weights
- [ ] "Auto-Assign" calls `POST .../auto-assign`, closes dialog on success with snackbar confirmation
- [ ] "Auto-Assign" shows "No attorneys available" message when none exist (TC-OPR-004)
- [ ] Manual selection highlights the row; "Assign [Name]" button enabled only with selection
- [ ] Manual assign calls `POST .../manual-assign` with selected `attorneyId`
- [ ] Suspended attorneys (`is_active = false`) are not shown in the list (TC-OPR-007)
- [ ] Backend rejects manual assignment to a suspended attorney with 400
- [ ] Activity log entry created for both auto and manual assignments
- [ ] Assigned attorney receives a notification
- [ ] Dialog closes and case detail refreshes after successful assignment
- [ ] All text uses TranslateModule with `OPR.ASSIGN.*` keys
- [ ] Keyboard navigable: Tab through list, Enter to select, Escape to close dialog
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests
- `rankAttorneys` excludes suspended attorneys (`is_active = false`)
- `autoAssignCase` selects highest-scored attorney and updates case
- `autoAssignCase` returns 404 with message when no attorneys available
- `autoAssignCase` skips suspended attorneys even if highest-scored
- `manualAssignCase` assigns the specified attorney
- `manualAssignCase` rejects assignment to suspended attorney with 400
- Both create activity log entries
- Both trigger attorney notifications

### Frontend Tests (`attorney-assignment.component.spec.ts`)
- Renders loading state initially
- Displays ranked attorney list after load
- Shows score, name, specializations for each attorney
- Auto-assign button calls service and emits result on success
- Auto-assign shows "no attorneys" message when list is empty
- Manual selection highlights row and enables confirm button
- Confirm button calls manualAssign with correct attorney ID
- Error state shown on API failure
- Dialog closeable with Escape key

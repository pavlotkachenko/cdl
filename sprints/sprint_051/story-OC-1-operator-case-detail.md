# Story OC-1: Operator Case Detail Component

## Status: DONE

## Priority: P0

## Depends On: OC-3 (enriched data model)

## Description
Create a dedicated case detail page for operators at `/operator/cases/:id`. This is the central
hub from which operators manage individual cases — viewing all case metadata, reading the activity
log, updating status, and navigating to attorney assignment or messaging.

The current routing sends `/operator/cases` to the dashboard component. This story adds a proper
case detail component that loads when a specific case ID is in the URL.

### User Story
> As an **operator**, I want to open a case and see all its details (ticket info, driver contact,
> court date, fine amount, assigned attorney, activity log) so I can make informed decisions
> about next steps.

## Backend Changes

### New Endpoint: `GET /api/operator/cases/:caseId`
Add to `operator.controller.js`:
- Fetch case by ID with joins: `driver` (name, phone, email, CDL), `assigned_attorney` (name,
  email, specializations), `court_dates` (all dates for this case), `assignment_requests` (pending)
- Fetch activity log: query `case_activity_log` or `notifications` table filtered by `case_id`,
  ordered descending
- Verify operator has access (case is assigned to them, or they are admin)
- Return enriched case object with nested relations

**Response shape:**
```json
{
  "case": {
    "id": "uuid", "case_number": "CDL-601", "status": "reviewed",
    "violation_type": "Speeding", "violation_date": "2026-02-15",
    "state": "TX", "county": "Harris", "fine_amount": 350,
    "customer_name": "Marcus Rivera", "created_at": "...",
    "driver": { "id": "...", "full_name": "...", "phone": "...", "email": "...", "cdl_number": "..." },
    "attorney": { "id": "...", "full_name": "...", "email": "...", "specializations": [...] } | null,
    "court_dates": [{ "id": "...", "date": "2026-04-10", "time": "09:00", "courthouse": "..." }],
    "assignment_request": { "id": "...", "status": "pending" } | null
  },
  "activity": [
    { "id": "...", "action": "status_change", "detail": "new → reviewed", "actor": "...", "created_at": "..." }
  ]
}
```

### New Endpoint: `PATCH /api/operator/cases/:caseId/status`
Add to `operator.controller.js`:
- Accept `{ status: string, note?: string }` body
- Validate status is a valid `case_status` enum value
- Update `cases.status`, set `updated_at`
- Insert activity log entry
- Trigger notification to driver if status is customer-visible
- Return updated case

**Route registration** in `operator.routes.js`:
```javascript
router.get('/cases/:caseId', authenticate, authorize(['operator', 'admin']), operatorController.getCaseDetail);
router.patch('/cases/:caseId/status', authenticate, authorize(['operator', 'admin']), operatorController.updateCaseStatus);
```

## Frontend Changes

### New Component: `OperatorCaseDetailComponent`
**Path:** `frontend/src/app/features/operator/case-detail/operator-case-detail.component.ts`

**Signals:**
- `caseData = signal<CaseDetail | null>(null)` — loaded case
- `activity = signal<ActivityEntry[]>([])` — activity log entries
- `loading = signal(true)`
- `error = signal('')`
- `statusUpdating = signal(false)`

**Template sections:**
1. **Header bar** — case number, status chip (color-coded), age badge, back button
2. **Info grid** (2-column on desktop, stacked on mobile):
   - Left: Ticket details (violation type, date, state/county, fine amount)
   - Right: Driver info (name, phone clickable `tel:`, email clickable `mailto:`, CDL number)
3. **Court dates** — timeline-style list of upcoming/past court dates with date, time, courthouse
4. **Attorney section** — if assigned: attorney card with name, email, specializations, active
   case count. If not assigned: prominent "Assign Attorney" button linking to OC-2 assignment UI
5. **Status management** — dropdown to change status with optional note field, "Update" button
6. **Activity log** — reverse-chronological list with actor avatar/initials, action description,
   timestamp. Scrollable container, max-height with overflow

**Styling:**
- Mobile-first, single column on screens <768px
- Card-based sections with `mat-card appearance="outlined"`
- Status chip colors match dashboard conventions
- Activity log uses a vertical timeline connector line
- WCAG 2.1 AA compliant: 44×44 touch targets, 4.5:1 contrast, keyboard navigable

### Routing Update
In `operator-routing.module.ts`, add:
```typescript
{
  path: 'cases/:id',
  loadComponent: () => import('./case-detail/operator-case-detail.component')
    .then(m => m.OperatorCaseDetailComponent)
}
```

### Service Update
In `case.service.ts` or new `operator.service.ts`:
```typescript
getOperatorCaseDetail(caseId: string): Observable<{ case: CaseDetail; activity: ActivityEntry[] }>
updateCaseStatus(caseId: string, status: string, note?: string): Observable<CaseDetail>
```

## Acceptance Criteria
- [ ] `GET /api/operator/cases/:caseId` returns enriched case with driver, attorney, court_dates, activity
- [ ] `PATCH /api/operator/cases/:caseId/status` updates status and creates activity log entry
- [ ] Non-assigned operator gets 403 when accessing another operator's case
- [ ] Admin can access any case via the same endpoint
- [ ] Frontend component renders all sections: ticket info, driver, court dates, attorney, status, activity
- [ ] Status dropdown shows valid transitions; update triggers loading state and refreshes data
- [ ] "Assign Attorney" button visible when no attorney is assigned
- [ ] Activity log is scrollable and shows actor, action, timestamp
- [ ] Back button returns to `/operator/dashboard`
- [ ] Component uses signals, OnPush, inject(), standalone
- [ ] All text uses TranslateModule with `OPR.DETAIL.*` keys
- [ ] Mobile layout stacks sections vertically at <768px
- [ ] Lighthouse accessibility score ≥ 95
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests (`backend/src/__tests__/operator.controller.test.js`)
- `getCaseDetail` returns enriched case for assigned operator
- `getCaseDetail` returns 403 for non-assigned operator
- `getCaseDetail` returns 404 for non-existent case
- `getCaseDetail` returns case for admin regardless of assignment
- `updateCaseStatus` changes status and creates activity entry
- `updateCaseStatus` rejects invalid status values
- `updateCaseStatus` triggers driver notification for customer-visible statuses

### Frontend Tests (`operator-case-detail.component.spec.ts`)
- Renders loading spinner initially
- Displays case details after data loads
- Shows driver contact information with clickable links
- Shows court dates in chronological order
- Shows attorney card when assigned, "Assign Attorney" button when not
- Status dropdown contains valid options
- Status update calls service and shows success feedback
- Activity log renders entries in reverse chronological order
- Error state displayed when API fails
- Back button navigates to dashboard

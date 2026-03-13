# Story OC-7: Admin Assignment Request Approval Flow

## Status: DONE

## Priority: P1

## Depends On: None (extends existing assignment_requests table from migration 020)

## Description
When operators request assignment to a case (existing feature from sprint 049), the request
goes into `assignment_requests` with status `pending` and a notification is sent to admins.
Currently there is no admin UI or API endpoint to approve or reject these requests. This story
closes that loop by adding backend endpoints and an admin UI panel.

### User Stories
> As an **admin**, I want to see pending operator assignment requests and approve or reject
> them, so operators can be assigned to cases they requested.

> As an **operator**, I want to be notified when my assignment request is approved or rejected,
> so I know whether to proceed with the case.

## Backend Changes

### New Endpoints in `admin.controller.js`

**`GET /api/admin/assignment-requests`**
- Query `assignment_requests` table where `status = 'pending'`
- Join: operator name (from `users`), case details (case_number, violation_type, state)
- Return list sorted by `created_at` ascending (FIFO)

**Response:**
```json
{
  "requests": [
    {
      "id": "req-uuid",
      "operator": { "id": "...", "full_name": "Lisa Chen" },
      "case": { "id": "...", "case_number": "CDL-610", "violation_type": "Speeding", "state": "TX" },
      "status": "pending",
      "created_at": "2026-03-10T14:00:00Z"
    }
  ]
}
```

**`POST /api/admin/assignment-requests/:requestId/approve`**
- Update `assignment_requests.status` to `approved`
- Update `cases.assigned_operator_id` to the requesting operator's ID
- Create notification for the operator: "Your request to handle case CDL-XXX has been approved"
- Emit Socket.io event `assignment:approved` to operator's room
- Create activity log entry on the case

**`POST /api/admin/assignment-requests/:requestId/reject`**
- Accept optional `{ reason: string }` body
- Update `assignment_requests.status` to `rejected`
- Create notification for the operator: "Your request to handle case CDL-XXX was declined. Reason: ..."
- Emit Socket.io event `assignment:rejected` to operator's room

**Route registration** in `admin.routes.js`:
```javascript
router.get('/assignment-requests', authenticate, authorize(['admin']), adminController.getAssignmentRequests);
router.post('/assignment-requests/:requestId/approve', authenticate, authorize(['admin']), adminController.approveAssignmentRequest);
router.post('/assignment-requests/:requestId/reject', authenticate, authorize(['admin']), adminController.rejectAssignmentRequest);
```

### Edge Cases
- Approve a request for a case that's already been assigned to another operator → return 409
  "Case has already been assigned to an operator"
- Approve a request that's already been approved/rejected → return 400 "Request already processed"
- Reject with no reason → allowed (reason is optional)

## Frontend Changes

### Admin Dashboard Panel
Add an "Assignment Requests" section/tab to the existing admin dashboard
(`features/admin/admin-dashboard/`):
- Badge showing pending count
- Table: Operator Name | Case Number | Violation | State | Requested At | Actions
- Actions column: "Approve" (green) and "Reject" (red) buttons
- Reject opens a small dialog asking for optional reason
- After approve/reject: row animates out, count badge updates

### Service Methods
In `admin.service.ts` (or wherever admin API calls live):
```typescript
getAssignmentRequests(): Observable<{ requests: AssignmentRequest[] }>
approveAssignmentRequest(requestId: string): Observable<void>
rejectAssignmentRequest(requestId: string, reason?: string): Observable<void>
```

## Acceptance Criteria
- [ ] `GET /api/admin/assignment-requests` returns pending requests with operator and case info
- [ ] `POST .../approve` assigns operator to case, creates notification, emits socket event
- [ ] `POST .../reject` updates status, creates notification with optional reason
- [ ] Already-assigned case → 409 on approve
- [ ] Already-processed request → 400
- [ ] Admin dashboard shows pending requests with approve/reject buttons
- [ ] Approve removes row from list, shows success snackbar
- [ ] Reject opens reason dialog (optional), removes row, shows confirmation
- [ ] Badge count on "Assignment Requests" tab reflects pending count
- [ ] Operator receives real-time notification on approval/rejection (via OC-6 socket)
- [ ] All text uses TranslateModule keys
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests (`backend/src/__tests__/admin.controller.test.js`)
- `getAssignmentRequests` returns pending requests with joins
- `approveAssignmentRequest` updates request status and assigns operator to case
- `approveAssignmentRequest` returns 409 for already-assigned case
- `approveAssignmentRequest` returns 400 for already-processed request
- `rejectAssignmentRequest` updates status and creates notification
- `rejectAssignmentRequest` includes reason in notification when provided

### Frontend Tests
- Admin dashboard renders assignment requests section
- Pending requests table shows operator name, case number, actions
- Approve button calls service and removes row
- Reject button opens dialog, submits reason, removes row
- Empty state shown when no pending requests

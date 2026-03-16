# Story CM-2: Status Workflow Engine & Pipeline UI

## Status: DONE

## Priority: P0

## Depends On: CM-1 (enum fix, canAccessCase fix)

## Description
Implement a status transition state machine that enforces valid case progressions, and build
a visual pipeline/stepper component that shows where a case is in the workflow. This replaces
the current "any status to any status" approach with structured, validated transitions and
gives the operator clear visual guidance on the next steps.

### User Stories
> As an **operator**, I want to see a visual pipeline showing where my case is in the workflow
> (New → Reviewed → Assigned → Court → Payment → Closed) so I instantly know its progress.

> As an **operator**, I want to click "Next Step" buttons that only offer valid status
> transitions, so I can't accidentally skip a step or move backward.

> As a **system**, I want to enforce transition rules server-side so no client bug or API call
> can put a case in an invalid state.

## Status Lifecycle Definition

Based on the `case_status` enum and business logic:

```
new ──▶ reviewed ──▶ assigned_to_attorney ──▶ send_info_to_attorney ──▶ waiting_for_driver
                            │                         │                        │
                            │                         ▼                        ▼
                            │                   call_court ◀─────────── (driver responds)
                            │                         │
                            ▼                         ▼
                    check_with_manager ──▶ pay_attorney ──▶ attorney_paid ──▶ resolved ──▶ closed
```

### Allowed Transitions Map
```javascript
const TRANSITIONS = {
  'new':                    ['reviewed'],
  'reviewed':               ['assigned_to_attorney', 'closed'],
  'assigned_to_attorney':   ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager', 'closed'],
  'send_info_to_attorney':  ['waiting_for_driver', 'call_court', 'check_with_manager'],
  'waiting_for_driver':     ['send_info_to_attorney', 'call_court', 'check_with_manager'],
  'call_court':             ['waiting_for_driver', 'pay_attorney', 'check_with_manager', 'resolved', 'closed'],
  'check_with_manager':     ['assigned_to_attorney', 'call_court', 'pay_attorney', 'closed'],
  'pay_attorney':           ['attorney_paid'],
  'attorney_paid':          ['resolved', 'closed'],
  'resolved':               ['closed'],
  'closed':                 []  // terminal — no transitions out
};
```

### Transitions Requiring Notes
```javascript
const REQUIRES_NOTE = ['closed', 'check_with_manager'];
```
When transitioning to these statuses, the user MUST provide a comment explaining why.

### Status Phase Grouping (for pipeline UI)
```javascript
const PHASES = [
  { key: 'intake',     label: 'OPR.PHASE_INTAKE',     statuses: ['new', 'reviewed'] },
  { key: 'assignment', label: 'OPR.PHASE_ASSIGNMENT',  statuses: ['assigned_to_attorney'] },
  { key: 'processing', label: 'OPR.PHASE_PROCESSING',  statuses: ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager'] },
  { key: 'payment',    label: 'OPR.PHASE_PAYMENT',     statuses: ['pay_attorney', 'attorney_paid'] },
  { key: 'resolution', label: 'OPR.PHASE_RESOLUTION',  statuses: ['resolved', 'closed'] },
];
```

## Backend Changes

### New Service: `status-workflow.service.js`
**Path:** `backend/src/services/status-workflow.service.js`

```javascript
const TRANSITIONS = { /* map above */ };
const REQUIRES_NOTE = ['closed', 'check_with_manager'];

/**
 * Check if a status transition is allowed
 * @param {string} from - Current status
 * @param {string} to - Target status
 * @returns {{ allowed: boolean, requiresNote: boolean, error?: string }}
 */
function validateTransition(from, to) { ... }

/**
 * Get allowed next statuses from current
 * @param {string} currentStatus
 * @returns {string[]}
 */
function getNextStatuses(currentStatus) { ... }

module.exports = { validateTransition, getNextStatuses, TRANSITIONS, REQUIRES_NOTE };
```

### Modify: `changeStatus` in `case.controller.js`
Replace the flat `validStatuses` array check with:
```javascript
const { validateTransition } = require('../services/status-workflow.service');

// Get current status
const { data: currentCase } = await supabase.from('cases').select('status').eq('id', id).single();
const validation = validateTransition(currentCase.status, status);

if (!validation.allowed) {
  return res.status(400).json({
    error: { code: 'INVALID_TRANSITION', message: validation.error }
  });
}

if (validation.requiresNote && !comment) {
  return res.status(400).json({
    error: { code: 'NOTE_REQUIRED', message: `A note is required when changing status to "${status}"` }
  });
}
```

### New Endpoint: `GET /api/cases/:id/next-statuses`
Add to `case.routes.js` — returns allowed transitions for the case's current status.
Useful for frontend to know which buttons to show without hardcoding the map client-side.

```javascript
router.get('/:id/next-statuses', authenticate, canAccessCase, caseController.getNextStatuses);
```

Response:
```json
{
  "currentStatus": "assigned_to_attorney",
  "nextStatuses": ["send_info_to_attorney", "waiting_for_driver", "call_court", "check_with_manager", "closed"],
  "requiresNote": { "closed": true, "check_with_manager": true }
}
```

## Frontend Changes

### New Service: `StatusWorkflowService`
**Path:** `frontend/src/app/core/services/status-workflow.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class StatusWorkflowService {
  private http = inject(HttpClient);

  /** Get allowed next statuses for a case */
  getNextStatuses(caseId: string): Observable<NextStatusesResponse> { ... }

  /** Client-side phase lookup */
  getPhaseForStatus(status: string): Phase { ... }

  /** Client-side phase index (for stepper progress) */
  getPhaseIndex(status: string): number { ... }

  /** Status display config (label key, color, icon) */
  getStatusConfig(status: string): StatusConfig { ... }
}
```

### New Component: `StatusPipelineComponent`
**Path:** `frontend/src/app/features/operator/status-pipeline/status-pipeline.component.ts`

A horizontal stepper/pipeline showing the 5 phases with the current phase highlighted.

**Inputs:**
- `currentStatus = input.required<string>()`
- `caseId = input.required<string>()`

**Outputs:**
- `statusChanged = output<string>()` — emits new status after successful change

**Signals:**
- `nextStatuses = signal<string[]>([])` — allowed transitions from API
- `changing = signal(false)` — loading state during transition
- `noteDialogOpen = signal(false)`

**Template:**
1. **Phase bar** — 5 connected steps (circles + connecting lines). Past phases are filled
   green, current phase is highlighted blue with pulse animation, future phases are grey
   outlines. Each phase circle shows the phase icon.
2. **Current status detail** — below the bar: "Current: [Status Label]" with color chip.
3. **Quick action buttons** — row of buttons for each allowed next status:
   - Each button shows the target status label + icon
   - Color-coded: green for forward progress, amber for lateral moves, red for close
   - If transition requires a note, clicking opens a dialog with textarea
   - Disabled while `changing()` is true
4. **Note dialog** — `MatDialog` with textarea (required, min 10 chars), "Confirm" and
   "Cancel" buttons. Triggered when moving to `closed` or `check_with_manager`.

**Styling:**
- Phase bar uses flexbox with `flex: 1` segments and connecting lines via `::after` pseudo-elements
- Responsive: on mobile (<600px), phases stack vertically as a timeline
- Pulse animation on current phase uses `@keyframes` (CSS, no external lib)
- Touch targets ≥44×44px on all buttons

### Integration with Case Detail (Sprint 051 OC-1)
The `StatusPipelineComponent` is embedded in the case detail page above the case info grid.
When `statusChanged` fires, the case detail component reloads data and activity log.

## Acceptance Criteria
- [ ] Backend `validateTransition()` enforces the transition map — invalid transitions return 400
- [ ] `changeStatus` rejects transitions not in the allowed map with error code `INVALID_TRANSITION`
- [ ] Transitions to `closed` or `check_with_manager` require a non-empty note
- [ ] `GET /api/cases/:id/next-statuses` returns allowed transitions + note requirements
- [ ] Pipeline component shows 5 phases with correct progress visualization
- [ ] Current phase is highlighted, past phases are complete, future phases are dimmed
- [ ] Quick action buttons appear only for valid next statuses
- [ ] Note dialog opens for transitions requiring notes; "Confirm" is disabled until 10+ chars
- [ ] Successful status change emits `statusChanged` event
- [ ] Terminal status (`closed`) shows no action buttons — pipeline is complete
- [ ] Responsive: vertical timeline on mobile <600px
- [ ] All text uses TranslateModule with `OPR.WORKFLOW.*` keys
- [ ] Keyboard navigable: Tab through action buttons, Enter to activate, Escape to close dialog
- [ ] Build succeeds with no errors

## Test Coverage

### Backend Tests (`backend/src/__tests__/status-workflow.service.test.js`)
- `validateTransition('new', 'reviewed')` returns `{ allowed: true }`
- `validateTransition('new', 'closed')` returns `{ allowed: false }` (can't skip)
- `validateTransition('closed', 'new')` returns `{ allowed: false }` (terminal)
- `validateTransition('call_court', 'closed')` returns `{ allowed: true, requiresNote: true }`
- `getNextStatuses('new')` returns `['reviewed']`
- `getNextStatuses('assigned_to_attorney')` returns 5 options
- `getNextStatuses('closed')` returns `[]`

### Backend Tests (`backend/src/__tests__/case.controller.test.js` — extend)
- `changeStatus` with invalid transition returns 400 INVALID_TRANSITION
- `changeStatus` to `closed` without note returns 400 NOTE_REQUIRED
- `changeStatus` to `closed` with note succeeds
- `getNextStatuses` returns correct list for given case status

### Frontend Tests (`status-pipeline.component.spec.ts`)
- Renders 5 phase circles
- Current status phase is highlighted
- Past phases show as complete
- Future phases show as dimmed
- Quick action buttons match `nextStatuses` signal
- Clicking action button calls status change service
- Note dialog opens for transitions requiring notes
- No buttons shown when status is `closed`

### Frontend Tests (`status-workflow.service.spec.ts`)
- `getPhaseForStatus('reviewed')` returns 'intake' phase
- `getPhaseForStatus('call_court')` returns 'processing' phase
- `getPhaseIndex('new')` returns 0
- `getStatusConfig` returns label key, color, and icon for each status

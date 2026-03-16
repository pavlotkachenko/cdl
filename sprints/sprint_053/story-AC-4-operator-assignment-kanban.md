# Story AC-4: Operator Assignment Kanban Board

## Status: DONE

## Priority: P1

## Depends On: AC-1 (operator list endpoint), AC-3 (real data wiring)

## Description
Build a Kanban board where **columns represent operators** (plus an "Unassigned" column) and
**cards represent cases**. Admins drag cases between columns to assign or reassign operators.
This is the admin's primary daily workflow tool for distributing workload across the operator
team.

The operator Kanban from sprint 052 (CM-5) groups cases by **status** with drag-and-drop to
change status. This admin Kanban groups cases by **operator** with drag-and-drop to change
assignment. The UX patterns are similar, but the data model and actions are different.

## Design

### Board Layout
```
┌────────────────────────────────────────────────────────────────────┐
│ Operator Assignment Board                           [Refresh] [?] │
├──────────┬──────────┬──────────┬──────────┬──────────┬────────────┤
│ Unassigned│ Lisa M. │ Alex T. │ Rachel A.│ Chris M.│            │
│ (5)      │ (12/20) │ (8/20)  │ (15/20) │ (3/20)  │◁ scroll ▷  │
│ ■■■■■■■  │ ■■■■■■■ │ ■■■■■■■ │ ■■■■■■■ │ ■■■■■■■ │            │
├──────────┼──────────┼──────────┼──────────┼──────────┤            │
│ CDL-042  │ CDL-039 │ CDL-041 │ CDL-035 │ CDL-044 │            │
│ Miguel S.│ Sarah K.│ Tom R.  │ Anna L. │ Wei C.  │            │
│ Speeding │ Logbook │ DUI     │ Red Lgt │ Equip.  │            │
│ 3d 2h    │ 1d 8h  │ 5d 1h  │ 2d 4h  │ 0d 6h  │            │
│          │         │         │         │         │            │
│ CDL-038  │ CDL-040 │ CDL-043 │ CDL-036 │         │            │
│ ...      │ ...     │ ...     │ ...     │         │            │
└──────────┴──────────┴──────────┴──────────┴──────────┴────────────┘
```

### Column Headers
Each operator column header displays:
- **Operator name**
- **Case count / capacity** (e.g., "12/20") with color coding:
  - Green: <70% capacity
  - Yellow: 70–90% capacity
  - Red: >90% capacity
- **Capacity bar** (visual progress bar)

The "Unassigned" column has a distinct color (amber/warning) and shows only the count (no
capacity metric).

### Cards
Each card shows the same information as the operator Kanban cards:
- Case number (linked, clickable → navigates to `/admin/cases/:id`)
- Customer name
- Violation type
- Case age (with urgent highlighting for >48h)
- Status badge (small colored chip)

### Drag-and-Drop Behavior
1. Admin drags a card from one column to another
2. On drop:
   - If moving from "Unassigned" to an operator → call `POST /api/cases/:id/assign-operator`
   - If moving between operators → call `POST /api/cases/:id/assign-operator` with new ID
   - If moving to "Unassigned" → call `PATCH /api/cases/:id` with `assigned_operator_id: null`
3. Show moving overlay (spinner) during API call
4. On success: update local state, show snackbar confirmation
5. On error: revert card position, show error snackbar
6. Optimistic update: move card immediately, revert on error

### Capacity Warning
If admin drops a case onto an operator who is at or above capacity (≥20 cases), show a
confirmation dialog: "Lisa M. has 20/20 active cases. Assign anyway?" with [Cancel] and
[Assign] buttons.

## Implementation

### New Component
`AdminOperatorKanbanComponent` — standalone, OnPush, signals

**Inputs:**
- None (fetches its own data)

**Signals:**
```typescript
operators = signal<OperatorColumn[]>([]);
unassignedCases = signal<any[]>([]);
loading = signal(true);
movingCaseId = signal<string | null>(null);
```

**Computed:**
```typescript
columns = computed(() => {
  const unassigned: KanbanColumn = {
    key: 'unassigned', label: 'Unassigned',
    operatorId: null, cases: this.unassignedCases(),
    capacity: 0, color: '#FF8F00'
  };
  const opCols = this.operators().map(op => ({
    key: op.id, label: op.name,
    operatorId: op.id, cases: op.cases,
    capacity: op.capacity, color: this.utilizationColor(op)
  }));
  return [unassigned, ...opCols];
});

columnKeys = computed(() => this.columns().map(c => c.key));
```

**Data Loading:**
```typescript
ngOnInit() {
  forkJoin({
    operators: this.adminService.getOperators(),
    cases: this.adminService.getAllCases({ limit: 500 }) // all active cases
  }).subscribe(({ operators, cases }) => {
    // Group cases by assigned_operator_id
    // Cases with null operator go to unassigned
    // Attach cases array to each operator
  });
}
```

**Drop Handler:**
```typescript
async onDrop(event: CdkDragDrop<KanbanColumn>) {
  const sourceCol = event.previousContainer.data;
  const targetCol = event.container.data;
  if (sourceCol.key === targetCol.key) return;

  const movedCase = event.item.data;
  const targetOperatorId = targetCol.operatorId; // null for unassigned

  // Capacity check
  if (targetOperatorId && targetCol.cases.length >= targetCol.capacity) {
    const confirmed = await this.confirmOverCapacity(targetCol.label, targetCol.capacity);
    if (!confirmed) return;
  }

  // Optimistic update
  this.movingCaseId.set(movedCase.id);
  // ... move card in local state ...

  // API call
  this.adminService.assignOperator(movedCase.id, targetOperatorId).subscribe({
    next: () => { /* success snackbar */ },
    error: () => { /* revert + error snackbar */ }
  });
}
```

### CDK Drag-Drop Imports
Reuse the same `DragDropModule` and CDK drag patterns from the operator Kanban (CM-5):
- `cdkDropListGroup` on the board container
- `cdkDropList` on each column body
- `cdkDrag` on each card
- `cdkDropListConnectedTo` linking all columns
- `*cdkDragPlaceholder` for the placeholder element

### Service Layer
Add to `admin.service.ts`:
```typescript
assignOperator(caseId: string, operatorId: string | null): Observable<any> {
  if (operatorId) {
    return this.http.post(`${this.apiUrl}/cases/${caseId}/assign-operator`, { operator_id: operatorId });
  } else {
    return this.http.patch(`${this.apiUrl}/cases/${caseId}`, { assigned_operator_id: null });
  }
}
```

### Routing
Add to `admin-routing.module.ts`:
```typescript
{ path: 'operator-kanban', loadComponent: () =>
    import('./operator-kanban/admin-operator-kanban.component')
      .then(m => m.AdminOperatorKanbanComponent) }
```

Also accessible as a tab in the multi-board navigation (AC-6).

## Non-Functional Requirements

### Accessibility
- Board container: `role="group"`, `aria-label="Operator assignment board"`
- Each column: `role="group"`, `aria-label` includes operator name and case count
- Each card: `role="button"`, `tabindex="0"`, `aria-roledescription="draggable card"`,
  `aria-label` includes case number and customer name
- CDK drag-drop provides keyboard support (Space to pick up, arrows to move, Space to drop)
- Capacity warning dialog: `role="alertdialog"`, focus on cancel button
- Color indicators always paired with text (capacity number shown alongside color bar)

### Performance
- Initial load: single `forkJoin` of operators + cases (2 parallel requests)
- Cases grouped client-side — no per-column API call
- Optimistic updates — card moves immediately, no wait for API
- Board supports up to ~200 cases across columns without jank (CDK handles virtualization)

### Mobile
- Columns scroll horizontally with `scroll-snap-type: x mandatory`
- Each column min-width: 260px (same as operator Kanban)
- On mobile (< 768px): columns take 85vw each

## Tests

### Unit Tests (admin-operator-kanban.component.spec.ts)
- Loads operators and cases on init
- Groups cases by assigned_operator_id into columns
- Unassigned cases appear in the "Unassigned" column
- Operator columns show name, case count, and capacity
- Capacity bar color is green/yellow/red based on utilization
- Drag from unassigned to operator calls assignOperator
- Drag between operators calls assignOperator with new ID
- Drag to unassigned calls patch with null operator
- Shows capacity warning dialog when target is at capacity
- Cancel on capacity warning prevents assignment
- Confirm on capacity warning proceeds with assignment
- Shows moving overlay during API call
- Reverts card on API error
- Shows success snackbar on successful assignment
- Card click navigates to /admin/cases/:id
- Loading state shown while fetching
- Empty unassigned column shows empty message
- Minimum 15 tests

## Acceptance Criteria
- [x] Board displays one "Unassigned" column + one column per active operator
- [x] Column headers show operator name, case count/capacity, and utilization color
- [x] Cases are correctly grouped by assigned_operator_id
- [x] Drag from Unassigned to operator calls `POST /api/cases/:id/assign-operator`
- [x] Drag between operators calls `POST /api/cases/:id/assign-operator`
- [x] Drag to Unassigned removes operator assignment
- [x] Capacity warning dialog appears when target operator is at/over capacity
- [x] Optimistic update: card moves immediately, reverts on error
- [x] Success and error snackbars shown appropriately
- [x] Cards are clickable and navigate to `/admin/cases/:id`
- [x] Board scrolls horizontally on mobile with snap behavior
- [x] CDK drag-drop keyboard support works (Space, arrows)
- [x] All accessibility requirements met (ARIA, contrast, touch targets)
- [x] Unit tests pass with ≥15 test cases (26 tests pass)
- [x] Build succeeds with no errors

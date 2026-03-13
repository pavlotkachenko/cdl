# Story CM-5: Kanban Board View

## Status: TODO

## Priority: P1

## Depends On: CM-2 (status workflow — transition validation for drag-and-drop)

## Description
Build a Kanban board view where operators see their assigned cases organized in columns by
status phase. Cases can be dragged between columns to change status, with transition
validation preventing invalid moves. The Kanban is an alternative to the existing list view
on the dashboard — operators toggle between the two.

### User Story
> As an **operator**, I want to see my cases arranged in columns by status so I can
> visually scan my workload, identify bottlenecks, and advance cases by dragging them
> to the next column.

## Frontend Changes

### New Component: `OperatorKanbanComponent`
**Path:** `frontend/src/app/features/operator/kanban/operator-kanban.component.ts`

Uses **Angular CDK DragDrop** (`@angular/cdk/drag-drop`) — already a dependency of
Angular Material, no new install needed.

**Signals:**
- `cases = signal<OperatorCase[]>([])` — all operator's assigned cases
- `loading = signal(true)`
- `columns = computed(() => this.buildColumns(this.cases()))` — derived grouping
- `movingCaseId = signal<string | null>(null)` — case currently being dropped

**Column definitions (5 columns based on CM-2 phases):**
```typescript
interface KanbanColumn {
  key: string;
  labelKey: string;       // i18n translation key
  statuses: string[];     // case_status values that belong here
  color: string;          // column header accent color
  icon: string;           // Material icon
  cases: OperatorCase[];  // populated by computed signal
}

const COLUMNS: Omit<KanbanColumn, 'cases'>[] = [
  { key: 'intake',     labelKey: 'OPR.PHASE_INTAKE',    statuses: ['new', 'reviewed'],                                       color: '#1565c0', icon: 'inbox' },
  { key: 'assignment', labelKey: 'OPR.PHASE_ASSIGNMENT', statuses: ['assigned_to_attorney'],                                  color: '#6a1b9a', icon: 'person_add' },
  { key: 'processing', labelKey: 'OPR.PHASE_PROCESSING', statuses: ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager'], color: '#e65100', icon: 'pending_actions' },
  { key: 'payment',    labelKey: 'OPR.PHASE_PAYMENT',    statuses: ['pay_attorney', 'attorney_paid'],                         color: '#2e7d32', icon: 'payments' },
  { key: 'resolution', labelKey: 'OPR.PHASE_RESOLUTION', statuses: ['resolved', 'closed'],                                   color: '#616161', icon: 'check_circle' },
];
```

**Template:**
```
<div class="kanban-board" cdkDropListGroup>
  @for (col of columns(); track col.key) {
    <div class="kanban-column"
         cdkDropList
         [cdkDropListData]="col.cases"
         (cdkDropListDropped)="onDrop($event, col)">

      <!-- Column header -->
      <div class="col-header" [style.border-color]="col.color">
        <mat-icon>{{ col.icon }}</mat-icon>
        <span>{{ col.labelKey | translate }}</span>
        <span class="col-count">{{ col.cases.length }}</span>
      </div>

      <!-- Case cards -->
      @for (c of col.cases; track c.id) {
        <div class="kanban-card" cdkDrag [cdkDragData]="c">
          <span class="card-number">{{ c.case_number }}</span>
          <span class="card-client">{{ c.customer_name }}</span>
          <div class="card-meta">
            <span class="card-type">{{ c.violation_type }}</span>
            <span class="card-age" [class.urgent]="c.ageHours >= 48">
              {{ formatAge(c.ageHours) }}
            </span>
          </div>
          <span class="card-status">{{ getStatusKey(c.status) | translate }}</span>
        </div>
      }

      <!-- Empty column -->
      @if (col.cases.length === 0) {
        <div class="col-empty">{{ 'OPR.KANBAN_EMPTY' | translate }}</div>
      }
    </div>
  }
</div>
```

**Drag-and-drop handler:**
```typescript
async onDrop(event: CdkDragDrop<OperatorCase[]>, targetCol: KanbanColumn) {
  if (event.previousContainer === event.container) return; // same column

  const movedCase = event.item.data as OperatorCase;
  const targetStatuses = targetCol.statuses;

  // Determine target status: use the first status in the target column
  // that is a valid transition from the current status
  const nextStatuses = await this.workflowService.getNextStatuses(movedCase.id);
  const validTarget = targetStatuses.find(s => nextStatuses.includes(s));

  if (!validTarget) {
    this.snackBar.open('Invalid status transition', 'OK', { duration: 3000 });
    return; // CDK will animate back
  }

  // If requires note, open dialog first
  if (REQUIRES_NOTE.includes(validTarget)) {
    const note = await this.openNoteDialog(validTarget);
    if (!note) return; // cancelled
    this.changeStatus(movedCase, validTarget, note);
  } else {
    this.changeStatus(movedCase, validTarget);
  }
}
```

**Styling:**
- Horizontal scrollable container for columns
- Each column: fixed width (280px), scrollable vertically, max-height: `calc(100vh - 200px)`
- Column header: colored top border (4px), icon + label + count badge
- Cards: white background, subtle shadow, rounded corners, compact layout
- Drag placeholder: dashed border ghost card
- CDK drag preview: slightly rotated card with shadow
- Mobile (<768px): columns are full-width, horizontally scrollable with snap scrolling

### View Toggle on Dashboard
Add a toggle to the operator dashboard header (next to the refresh button):

```html
<div class="view-toggle" role="tablist">
  <button mat-icon-button [class.active]="view() === 'list'" (click)="view.set('list')"
          role="tab" [attr.aria-selected]="view() === 'list'" aria-label="List view">
    <mat-icon>view_list</mat-icon>
  </button>
  <button mat-icon-button [class.active]="view() === 'kanban'" (click)="view.set('kanban')"
          role="tab" [attr.aria-selected]="view() === 'kanban'" aria-label="Kanban view">
    <mat-icon>view_kanban</mat-icon>
  </button>
</div>
```

When `view() === 'kanban'`, hide the "My Assigned Cases" list section and show the Kanban
board instead. The "Unassigned Queue" section remains visible below.

### Routing (optional)
The Kanban can be embedded in the dashboard (no new route) or have its own route
(`/operator/kanban`). **Recommendation:** Embed in dashboard with the toggle — avoids
route proliferation and keeps the queue visible.

## Acceptance Criteria
- [ ] Kanban board shows 5 columns based on status phases
- [ ] Each column lists cases belonging to that phase's statuses
- [ ] Column headers show icon, label, and case count badge
- [ ] Cases display: case number, customer name, violation type, age, status chip
- [ ] Cases can be dragged from one column to another
- [ ] Invalid drops (violating transition rules) show error snackbar and snap back
- [ ] Drops to `closed` or `check_with_manager` columns open note dialog
- [ ] Successful drop updates case status via API and moves card visually
- [ ] Empty columns show placeholder text
- [ ] Dashboard has list/Kanban toggle buttons
- [ ] Toggle persists between page loads (localStorage)
- [ ] Columns are horizontally scrollable on mobile with snap scrolling
- [ ] All text uses TranslateModule with `OPR.KANBAN.*` keys
- [ ] Keyboard: Tab into board, arrow keys between cards, Enter to pick up, arrows to move, Enter to drop
- [ ] Build succeeds with no errors

## Test Coverage

### Frontend Tests (`operator-kanban.component.spec.ts`)
- Renders 5 columns
- Cases grouped into correct columns based on status
- Column count badges show correct numbers
- Empty column shows placeholder
- `onDrop` with valid transition calls status change service
- `onDrop` with invalid transition shows error snackbar
- `onDrop` to column requiring note opens dialog
- View toggle switches between list and Kanban

### Integration Tests
- Drag a case from "Intake" to "Assignment" — status updates via API
- Drag a case from "Processing" to "Intake" — rejected (invalid backward move)

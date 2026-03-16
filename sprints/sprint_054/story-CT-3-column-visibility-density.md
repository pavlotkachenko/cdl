# Story CT-3: Column Visibility Controls & Density Selector with localStorage Persistence

## Status: DONE

## Priority: P1

## Depends On: CT-2 (CaseTableComponent must exist)

## Description
Build a `ColumnToggleComponent` (dropdown with grouped checkboxes) and a density selector
(3 toggle buttons) that control which of the 19 columns are visible and how dense the table
rows are. User preferences persist in `localStorage` so they survive page reloads and
sessions. Core columns (Customer Name, Case Number, Status) are always visible and cannot be
hidden.

## UX Design

### Column Toggle Dropdown
A toolbar button labeled with a `view_column` icon opens a dropdown panel. Inside:
- Columns grouped by category (Core, Case Info, Assignment, Contact, Financial, Meta)
- Core group is shown but checkboxes are disabled (locked on)
- Each group has a "toggle all" checkbox in the group header
- Changing any checkbox immediately updates the table (no "Apply" button)
- A "Reset to defaults" link at the bottom restores DEFAULT_VISIBLE_COLUMNS

Visual layout:
```
┌─ Columns ─────────────────────────┐
│  ☑ Core (always visible)          │
│    ☑ Customer Name      🔒        │
│    ☑ Case Number         🔒        │
│    ☑ Status              🔒        │
│                                    │
│  ☑ Case Info                       │
│    ☑ State                         │
│    ☑ Violation Type                │
│    ☑ Violation Date                │
│    ☑ Court Date                    │
│                                    │
│  ☑ Assignment                      │
│    ☑ Attorney Name                 │
│    ☑ Carrier                       │
│    ☑ Who Sent                      │
│                                    │
│  ☐ Contact                         │
│    ☐ Driver Phone                  │
│    ☐ Customer Type                 │
│                                    │
│  ☐ Financial                       │
│    ☐ Attorney Price                │
│    ☐ Price CDL                     │
│    ☐ Subscriber Paid               │
│    ☐ Court Fee                     │
│    ☐ Court Fee Paid By             │
│                                    │
│  ☐ Meta                            │
│    ☐ Next Action Date              │
│    ☐ Files                         │
│                                    │
│  ↻ Reset to defaults               │
└────────────────────────────────────┘
```

### Density Selector
Three icon buttons in a segmented toggle:
- **Compact** (≡ icon) — 36px rows, 0.8rem font
- **Default** (☰ icon) — 48px rows, default font
- **Comfortable** (▣ icon) — 56px rows, 0.95rem font

### localStorage Keys
- `case_table_columns` — JSON string array of visible column keys
  (e.g., `["customer_name","case_number","status","state","violation_type"]`)
- `case_table_density` — `"compact"` | `"default"` | `"comfortable"`

On init, read from localStorage. If absent, use defaults. On change, write immediately.

## Implementation

### File: `features/shared/case-table/column-toggle.component.ts`

```
@Component({
  selector: 'app-column-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatMenuModule,
    MatCheckboxModule, TranslateModule,
  ],
  template: `...`,
  styles: [`...`],
})
export class ColumnToggleComponent {
  allColumns    = input.required<ColumnDef[]>();
  visibleKeys   = input.required<string[]>();
  columnsChange = output<string[]>();

  // Group columns by category
  groups = computed(() => {
    const grouped = new Map<ColumnGroup, ColumnDef[]>();
    for (const col of this.allColumns()) {
      const list = grouped.get(col.group) || [];
      list.push(col);
      grouped.set(col.group, list);
    }
    return grouped;
  });

  // Group header labels (i18n keys)
  groupLabels: Record<ColumnGroup, string> = {
    core: 'TABLE.GROUP_CORE',
    case_info: 'TABLE.GROUP_CASE_INFO',
    assignment: 'TABLE.GROUP_ASSIGNMENT',
    contact: 'TABLE.GROUP_CONTACT',
    financial: 'TABLE.GROUP_FINANCIAL',
    meta: 'TABLE.GROUP_META',
  };

  isVisible(key: string): boolean {
    return this.visibleKeys().includes(key);
  }

  isGroupAllChecked(group: ColumnGroup): boolean { ... }
  isGroupIndeterminate(group: ColumnGroup): boolean { ... }

  toggleColumn(key: string): void {
    const current = [...this.visibleKeys()];
    const idx = current.indexOf(key);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(key);
    this.columnsChange.emit(current);
  }

  toggleGroup(group: ColumnGroup): void {
    const groupKeys = (this.groups().get(group) || []).map(c => c.key);
    const allChecked = this.isGroupAllChecked(group);
    let current = [...this.visibleKeys()];
    if (allChecked) {
      current = current.filter(k => !groupKeys.includes(k));
    } else {
      for (const k of groupKeys) {
        if (!current.includes(k)) current.push(k);
      }
    }
    this.columnsChange.emit(current);
  }

  resetToDefaults(): void {
    this.columnsChange.emit([...DEFAULT_VISIBLE_COLUMNS]);
  }
}
```

### Template: ColumnToggleComponent
```html
<button mat-icon-button [matMenuTriggerFor]="columnMenu"
        [attr.aria-label]="'TABLE.TOGGLE_COLUMNS' | translate"
        [matTooltip]="'TABLE.TOGGLE_COLUMNS' | translate">
  <mat-icon>view_column</mat-icon>
</button>

<mat-menu #columnMenu="matMenu" class="column-toggle-menu">
  @for (entry of groups() | keyvalue; track entry.key) {
    <div class="column-group">
      <!-- Group header with toggle-all -->
      <mat-checkbox
        [checked]="isGroupAllChecked(entry.key)"
        [indeterminate]="isGroupIndeterminate(entry.key)"
        [disabled]="entry.key === 'core'"
        (change)="toggleGroup(entry.key)"
        class="group-header">
        {{ groupLabels[entry.key] | translate }}
      </mat-checkbox>

      <!-- Individual columns -->
      @for (col of entry.value; track col.key) {
        <mat-checkbox
          [checked]="isVisible(col.key)"
          [disabled]="col.group === 'core'"
          (change)="toggleColumn(col.key)"
          class="column-item">
          {{ col.header | translate }}
          @if (col.group === 'core') {
            <mat-icon class="lock-icon">lock</mat-icon>
          }
        </mat-checkbox>
      }
    </div>
  }

  <button mat-button class="reset-link" (click)="resetToDefaults()">
    <mat-icon>restart_alt</mat-icon>
    {{ 'TABLE.RESET_COLUMNS' | translate }}
  </button>
</mat-menu>
```

### Density Selector
Integrated into the parent toolbar (admin case-management or operator all-cases), not a
separate component. Uses MatButtonToggleGroup:

```html
<mat-button-toggle-group [value]="density()" (change)="onDensityChange($event.value)"
                         [attr.aria-label]="'TABLE.DENSITY' | translate">
  <mat-button-toggle value="compact" [attr.aria-label]="'TABLE.DENSITY_COMPACT' | translate">
    <mat-icon>density_small</mat-icon>
  </mat-button-toggle>
  <mat-button-toggle value="default" [attr.aria-label]="'TABLE.DENSITY_DEFAULT' | translate">
    <mat-icon>density_medium</mat-icon>
  </mat-button-toggle>
  <mat-button-toggle value="comfortable" [attr.aria-label]="'TABLE.DENSITY_COMFORTABLE' | translate">
    <mat-icon>density_large</mat-icon>
  </mat-button-toggle>
</mat-button-toggle-group>
```

### Persistence Logic (in parent component)
```typescript
private readonly STORAGE_KEY_COLUMNS = 'case_table_columns';
private readonly STORAGE_KEY_DENSITY = 'case_table_density';

// On init
const savedCols = localStorage.getItem(this.STORAGE_KEY_COLUMNS);
const savedDensity = localStorage.getItem(this.STORAGE_KEY_DENSITY);
this.visibleColumns.set(savedCols ? JSON.parse(savedCols) : [...DEFAULT_VISIBLE_COLUMNS]);
this.density.set((savedDensity as TableDensity) || 'default');

// On change
onColumnsChange(columns: string[]): void {
  // Ensure core columns are always included
  const coreKeys = ALL_COLUMNS.filter(c => c.group === 'core').map(c => c.key);
  const merged = [...new Set([...coreKeys, ...columns])];
  this.visibleColumns.set(merged);
  localStorage.setItem(this.STORAGE_KEY_COLUMNS, JSON.stringify(merged));
}

onDensityChange(density: TableDensity): void {
  this.density.set(density);
  localStorage.setItem(this.STORAGE_KEY_DENSITY, density);
}
```

## Files Changed

### Frontend (New)
- `features/shared/case-table/column-toggle.component.ts` + `.spec.ts`

### Frontend (Modified)
- `features/shared/case-table/case-table.models.ts` — add `COLUMN_GROUPS` ordered array for
  consistent group rendering order

### Frontend Tests
- `column-toggle.component.spec.ts` (min 15 tests):
  - Renders all column groups
  - Core group checkboxes are disabled
  - Toggling a column emits updated visibleKeys array
  - Toggling group header checks/unchecks all columns in group
  - Group header shows indeterminate when partially checked
  - Core group toggle is disabled
  - Reset to defaults emits DEFAULT_VISIBLE_COLUMNS
  - Lock icon shown on core columns
  - Menu opens on button click
  - aria-label on toggle button
  - Unchecking a column removes it from emitted array
  - Checking a column adds it to emitted array
  - Group "toggle all" unchecks all when all are checked
  - Group "toggle all" checks all when none are checked
  - All group labels use i18n keys

## Acceptance Criteria
- [ ] Column toggle button opens dropdown with all 19 columns grouped by category
- [ ] Core columns (Customer Name, Case Number, Status) are always checked and disabled
- [ ] Lock icon visible on core columns
- [ ] Group header checkbox toggles all columns in the group
- [ ] Group header shows indeterminate state when partially checked
- [ ] Changing a column checkbox immediately updates the table
- [ ] "Reset to defaults" restores the default 10-column set
- [ ] Density selector shows 3 options (compact/default/comfortable)
- [ ] Changing density immediately updates row height and font size
- [ ] Column visibility persists in localStorage across page reloads
- [ ] Density preference persists in localStorage across page reloads
- [ ] If localStorage has invalid data, gracefully fall back to defaults
- [ ] Column toggle and density selector are keyboard-navigable
- [ ] All controls have appropriate aria-labels
- [ ] All 15+ unit tests pass

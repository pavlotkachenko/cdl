import {
  Component, ChangeDetectionStrategy, computed, input, output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import {
  ColumnDef, ColumnGroup,
  ALL_COLUMNS, DEFAULT_VISIBLE_COLUMNS, COLUMN_GROUPS, GROUP_LABELS,
} from './case-table.models';

@Component({
  selector: 'app-column-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCheckboxModule,
    MatTooltipModule,
    TranslateModule,
  ],
  styles: [`
    .column-group { padding: 4px 16px; }
    .group-header { font-weight: 500; }
    .column-item { display: block; padding-left: 24px; }
    .lock-icon { font-size: 14px; width: 14px; height: 14px; color: #9e9e9e; vertical-align: middle; margin-left: 4px; }
    .reset-link { width: 100%; justify-content: flex-start; }
  `],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="columnMenu"
            [attr.aria-label]="'TABLE.TOGGLE_COLUMNS' | translate"
            [matTooltip]="'TABLE.TOGGLE_COLUMNS' | translate">
      <mat-icon>view_column</mat-icon>
    </button>

    <mat-menu #columnMenu="matMenu" class="column-toggle-menu">
      @for (group of orderedGroups; track group) {
        <div class="column-group" (click)="$event.stopPropagation()">
          <mat-checkbox
            [checked]="isGroupAllChecked(group)"
            [indeterminate]="isGroupIndeterminate(group)"
            [disabled]="group === 'core'"
            (change)="toggleGroup(group)"
            class="group-header">
            {{ groupLabels[group] | translate }}
          </mat-checkbox>

          @for (col of getGroupColumns(group); track col.key) {
            <mat-checkbox
              [checked]="isVisible(col.key)"
              [disabled]="col.group === 'core'"
              (change)="toggleColumn(col.key)"
              class="column-item">
              {{ col.header | translate }}
              @if (col.group === 'core') {
                <mat-icon class="lock-icon" aria-hidden="true">lock</mat-icon>
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
  `,
})
export class ColumnToggleComponent {
  allColumns = input.required<ColumnDef[]>();
  visibleKeys = input.required<string[]>();
  columnsChange = output<string[]>();

  readonly orderedGroups = COLUMN_GROUPS;
  readonly groupLabels = GROUP_LABELS;

  private readonly groupedColumns = computed(() => {
    const map = new Map<ColumnGroup, ColumnDef[]>();
    for (const col of this.allColumns()) {
      const list = map.get(col.group) || [];
      list.push(col);
      map.set(col.group, list);
    }
    return map;
  });

  getGroupColumns(group: ColumnGroup): ColumnDef[] {
    return this.groupedColumns().get(group) || [];
  }

  isVisible(key: string): boolean {
    return this.visibleKeys().includes(key);
  }

  isGroupAllChecked(group: ColumnGroup): boolean {
    const cols = this.getGroupColumns(group);
    return cols.length > 0 && cols.every(c => this.isVisible(c.key));
  }

  isGroupIndeterminate(group: ColumnGroup): boolean {
    const cols = this.getGroupColumns(group);
    const checked = cols.filter(c => this.isVisible(c.key)).length;
    return checked > 0 && checked < cols.length;
  }

  toggleColumn(key: string): void {
    const current = [...this.visibleKeys()];
    const idx = current.indexOf(key);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(key);
    }
    this.columnsChange.emit(current);
  }

  toggleGroup(group: ColumnGroup): void {
    if (group === 'core') return;
    const groupKeys = this.getGroupColumns(group).map(c => c.key);
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

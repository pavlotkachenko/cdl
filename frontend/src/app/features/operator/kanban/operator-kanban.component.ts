import {
  Component, ChangeDetectionStrategy, inject, input, output, signal, computed, OnInit,
} from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { StatusWorkflowService } from '../../../core/services/status-workflow.service';
import { StatusNoteDialogComponent } from '../status-pipeline/status-note-dialog.component';

export interface KanbanColumn {
  key: string;
  labelKey: string;
  statuses: string[];
  color: string;
  icon: string;
  cases: any[];
}

const COLUMN_DEFS: Omit<KanbanColumn, 'cases'>[] = [
  { key: 'intake',     labelKey: 'OPR.PHASE_INTAKE',     statuses: ['new', 'reviewed'],                                                                    color: '#1565c0', icon: 'inbox' },
  { key: 'assignment', labelKey: 'OPR.PHASE_ASSIGNMENT',  statuses: ['assigned_to_attorney'],                                                               color: '#6a1b9a', icon: 'person_add' },
  { key: 'processing', labelKey: 'OPR.PHASE_PROCESSING',  statuses: ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager'],     color: '#e65100', icon: 'pending_actions' },
  { key: 'payment',    labelKey: 'OPR.PHASE_PAYMENT',     statuses: ['pay_attorney', 'attorney_paid'],                                                      color: '#2e7d32', icon: 'payments' },
  { key: 'resolution', labelKey: 'OPR.PHASE_RESOLUTION',  statuses: ['resolved', 'closed'],                                                                 color: '#616161', icon: 'check_circle' },
];

@Component({
  selector: 'app-operator-kanban',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, TranslateModule,
  ],
  template: `
    <div class="kanban-board" cdkDropListGroup>
      @for (col of columns(); track col.key) {
        <div class="kanban-column"
             role="group"
             [attr.aria-label]="(col.labelKey | translate) + ' (' + col.cases.length + ')'">
          <!-- Column header -->
          <div class="col-header" [style.border-top-color]="col.color">
            <mat-icon class="col-icon" [style.color]="col.color">{{ col.icon }}</mat-icon>
            <span class="col-label">{{ col.labelKey | translate }}</span>
            <span class="col-count" [style.background]="col.color">{{ col.cases.length }}</span>
          </div>

          <!-- Drop list -->
          <div class="col-body"
               cdkDropList
               [cdkDropListData]="col"
               [id]="col.key"
               [cdkDropListConnectedTo]="columnKeys()"
               (cdkDropListDropped)="onDrop($event)">

            @for (c of col.cases; track c.id) {
              <div class="kanban-card"
                   cdkDrag
                   [cdkDragData]="c"
                   [cdkDragDisabled]="movingCaseId() === c.id"
                   role="button"
                   tabindex="0"
                   (click)="openCase(c.id)"
                   (keydown.enter)="openCase(c.id)"
                   [attr.aria-label]="c.case_number + ' — ' + c.customer_name"
                   aria-roledescription="draggable card">
                <span class="card-number">{{ c.case_number }}</span>
                <span class="card-client">{{ c.customer_name }}</span>
                <div class="card-meta">
                  <span class="card-type">{{ c.violation_type }}</span>
                  <span class="card-age" [class.urgent]="(c.ageHours ?? 0) >= 48">
                    {{ formatAge(c.ageHours ?? 0) }}
                  </span>
                </div>

                <!-- Drag placeholder -->
                <div class="drag-placeholder" *cdkDragPlaceholder></div>
              </div>
            }

            @if (col.cases.length === 0) {
              <div class="col-empty">{{ 'OPR.KANBAN.EMPTY' | translate }}</div>
            }
          </div>
        </div>
      }
    </div>

    @if (movingCaseId()) {
      <div class="moving-overlay" role="status" aria-live="polite">
        <mat-spinner diameter="20"></mat-spinner>
        <span>{{ 'OPR.KANBAN.MOVING' | translate }}</span>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .kanban-board {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 12px;
      scroll-snap-type: x mandatory;
    }

    .kanban-column {
      flex: 0 0 260px;
      min-width: 260px;
      display: flex;
      flex-direction: column;
      scroll-snap-align: start;
    }

    .col-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-top: 4px solid;
      background: #fafafa;
      border-radius: 8px 8px 0 0;
    }
    .col-icon { font-size: 20px; width: 20px; height: 20px; }
    .col-label { font-size: 0.82rem; font-weight: 700; flex: 1; }
    .col-count {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; height: 22px; padding: 0 6px;
      border-radius: 11px; font-size: 0.72rem; font-weight: 700; color: #fff;
    }

    .col-body {
      flex: 1;
      min-height: 80px;
      max-height: calc(100vh - 320px);
      overflow-y: auto;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }

    .kanban-card {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      cursor: grab;
      transition: box-shadow 0.15s, transform 0.15s;
    }
    .kanban-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }
    .kanban-card:focus-visible {
      outline: 2px solid #1976d2;
      outline-offset: 2px;
    }
    .kanban-card:active { cursor: grabbing; }

    .card-number {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: #1565c0;
      margin-bottom: 2px;
    }
    .card-client {
      display: block;
      font-size: 0.82rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 6px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
      color: #888;
    }
    .card-type {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 60%;
    }
    .card-age { font-weight: 600; }
    .card-age.urgent { color: #b71c1c; }

    /* CDK drag styles */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
      background: #fff;
      padding: 10px 12px;
      transform: rotate(2deg);
    }
    .drag-placeholder {
      background: #e3f2fd;
      border: 2px dashed #90caf9;
      border-radius: 8px;
      min-height: 60px;
      margin-bottom: 8px;
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging .kanban-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .col-empty {
      text-align: center;
      padding: 24px 8px;
      color: #757575;
      font-size: 0.82rem;
      font-style: italic;
    }

    .moving-overlay {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      background: #333;
      color: #fff;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.85rem;
      z-index: 100;
    }

    @media (max-width: 768px) {
      .kanban-column { flex: 0 0 85vw; min-width: 85vw; }
    }
  `],
})
export class OperatorKanbanComponent implements OnInit {
  cases = input.required<any[]>();
  caseUpdated = output<void>();

  private workflowService = inject(StatusWorkflowService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private translate = inject(TranslateService);

  movingCaseId = signal<string | null>(null);

  columns = computed<KanbanColumn[]>(() => {
    const all = this.cases();
    return COLUMN_DEFS.map(def => ({
      ...def,
      cases: all.filter(c => def.statuses.includes(c.status)),
    }));
  });

  columnKeys = computed(() => COLUMN_DEFS.map(d => d.key));

  ngOnInit(): void {}

  async onDrop(event: CdkDragDrop<KanbanColumn>): Promise<void> {
    const sourceCol = event.previousContainer.data as KanbanColumn;
    const targetCol = event.container.data as KanbanColumn;

    if (sourceCol.key === targetCol.key) return;

    const movedCase = event.item.data;
    const caseId = movedCase.id;

    // Fetch valid next statuses from the backend
    let nextResponse: any;
    try {
      nextResponse = await firstValueFrom(this.workflowService.getNextStatuses(caseId));
    } catch {
      this.snackBar.open(this.translate.instant('OPR.KANBAN.TRANSITION_CHECK_FAILED'), 'OK', { duration: 3000 });
      return;
    }

    const validNextStatuses: string[] = nextResponse.nextStatuses || [];
    const requiresNote: Record<string, boolean> = nextResponse.requiresNote || {};

    // Find a valid target status in the target column
    const validTarget = targetCol.statuses.find(s => validNextStatuses.includes(s));
    if (!validTarget) {
      this.snackBar.open(this.translate.instant('OPR.KANBAN.INVALID_TRANSITION'), 'OK', { duration: 3000 });
      return;
    }

    // If note required, open dialog
    if (requiresNote[validTarget]) {
      const dialogRef = this.dialog.open(StatusNoteDialogComponent, {
        width: '400px',
        data: { targetStatus: validTarget },
      });
      const note = await firstValueFrom(dialogRef.afterClosed());
      if (!note) return; // cancelled
      this.executeMove(caseId, validTarget, note);
    } else {
      this.executeMove(caseId, validTarget);
    }
  }

  openCase(caseId: string): void {
    this.router.navigate(['/operator/cases', caseId]);
  }

  formatAge(hours: number): string {
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  private executeMove(caseId: string, targetStatus: string, note?: string): void {
    this.movingCaseId.set(caseId);
    this.workflowService.changeStatus(caseId, targetStatus, note).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('OPR.KANBAN.STATUS_UPDATED'), 'OK', { duration: 2000 });
        this.movingCaseId.set(null);
        this.caseUpdated.emit();
      },
      error: () => {
        this.snackBar.open(this.translate.instant('OPR.KANBAN.STATUS_FAILED'), 'OK', { duration: 3000 });
        this.movingCaseId.set(null);
      },
    });
  }
}

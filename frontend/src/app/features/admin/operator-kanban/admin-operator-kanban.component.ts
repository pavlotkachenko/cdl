import {
  Component, ChangeDetectionStrategy, OnInit, inject, signal, computed,
} from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { forkJoin, catchError, of } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';
import { CaseService } from '../../../core/services/case.service';

export interface OperatorColumn {
  key: string;
  label: string;
  operatorId: string | null;
  cases: any[];
  activeCaseCount: number;
  capacity: number;
}

const DEFAULT_CAPACITY = 20;

@Component({
  selector: 'app-admin-operator-kanban',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, TranslateModule,
  ],
  template: `
    @if (loading()) {
      <div class="loading-container" role="status" aria-busy="true">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ 'ADMIN.KANBAN.LOADING' | translate }}</p>
      </div>
    } @else if (error()) {
      <div class="error-container" role="alert">
        <mat-icon>error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-flat-button color="primary" (click)="loadData()">
          {{ 'ADMIN.RETRY' | translate }}
        </button>
      </div>
    } @else {
      <div class="board-header">
        <h2>{{ 'ADMIN.KANBAN.TITLE' | translate }}</h2>
        <button mat-stroked-button (click)="loadData()" aria-label="Refresh board">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <div class="kanban-board" cdkDropListGroup role="group" aria-label="Operator assignment board">
        @for (col of columns(); track col.key) {
          <div class="kanban-column"
               role="group"
               [attr.aria-label]="col.label + ' (' + col.cases.length + (col.operatorId ? '/' + col.capacity : '') + ')'">
            <!-- Column header -->
            <div class="col-header"
                 [class.col-unassigned]="!col.operatorId"
                 [class.col-green]="col.operatorId && utilization(col) < 70"
                 [class.col-yellow]="col.operatorId && utilization(col) >= 70 && utilization(col) < 90"
                 [class.col-red]="col.operatorId && utilization(col) >= 90">
              <mat-icon class="col-icon">{{ col.operatorId ? 'person' : 'inbox' }}</mat-icon>
              <span class="col-label">{{ col.label }}</span>
              <span class="col-count">
                {{ col.cases.length }}@if (col.operatorId) {/{{ col.capacity }}}
              </span>
            </div>

            <!-- Capacity bar -->
            @if (col.operatorId) {
              <div class="capacity-bar-track"
                   role="meter"
                   [attr.aria-label]="col.label + ' capacity'"
                   [attr.aria-valuenow]="col.cases.length"
                   [attr.aria-valuemin]="0"
                   [attr.aria-valuemax]="col.capacity">
                <div class="capacity-bar-fill"
                     [style.width.%]="Math.min(utilization(col), 100)"
                     [class.fill-green]="utilization(col) < 70"
                     [class.fill-yellow]="utilization(col) >= 70 && utilization(col) < 90"
                     [class.fill-red]="utilization(col) >= 90">
                </div>
              </div>
            }

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
                  <div class="card-footer">
                    <span class="card-state">{{ c.state }}</span>
                    <span [class]="'card-status status-' + c.status">{{ formatStatus(c.status) }}</span>
                  </div>
                  <div class="drag-placeholder" *cdkDragPlaceholder></div>
                </div>
              }

              @if (col.cases.length === 0) {
                <div class="col-empty">{{ 'ADMIN.KANBAN.EMPTY' | translate }}</div>
              }
            </div>
          </div>
        }
      </div>

      @if (movingCaseId()) {
        <div class="moving-overlay" role="status" aria-live="polite">
          <mat-spinner diameter="20"></mat-spinner>
          <span>{{ 'ADMIN.KANBAN.ASSIGNING' | translate }}</span>
        </div>
      }

      @if (confirmDialog()) {
        <div class="confirm-backdrop" (click)="cancelOverCapacity()"></div>
        <div class="confirm-dialog" role="alertdialog" aria-modal="true"
             aria-label="Capacity warning" (keydown.escape)="cancelOverCapacity()">
          <mat-icon class="confirm-icon">warning</mat-icon>
          <p class="confirm-text">
            {{ 'ADMIN.KANBAN.OVER_CAPACITY' | translate:{
              name: confirmDialog()!.operatorName,
              count: confirmDialog()!.currentCount,
              capacity: confirmDialog()!.capacity
            } }}
          </p>
          <div class="confirm-actions">
            <button mat-stroked-button (click)="cancelOverCapacity()">
              {{ 'ADMIN.KANBAN.CANCEL' | translate }}
            </button>
            <button mat-flat-button color="warn" (click)="confirmOverCapacity()">
              {{ 'ADMIN.KANBAN.ASSIGN_CONFIRM' | translate }}
            </button>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }

    .loading-container, .error-container {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 300px; gap: 16px;
    }
    .error-container mat-icon { font-size: 48px; width: 48px; height: 48px; color: #d32f2f; }

    .board-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px;
    }
    .board-header h2 { margin: 0; font-size: 1.2rem; font-weight: 700; }

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
      border-top: 4px solid #9e9e9e;
      background: #fafafa;
      border-radius: 8px 8px 0 0;
    }
    .col-header.col-unassigned { border-top-color: #FF8F00; background: #fff8e1; }
    .col-header.col-green { border-top-color: #388e3c; }
    .col-header.col-yellow { border-top-color: #f57c00; }
    .col-header.col-red { border-top-color: #d32f2f; }

    .col-icon { font-size: 20px; width: 20px; height: 20px; color: #555; }
    .col-label { font-size: 0.82rem; font-weight: 700; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .col-count {
      font-size: 0.75rem; font-weight: 700; color: #555; white-space: nowrap;
    }

    .capacity-bar-track {
      height: 4px; background: #e0e0e0; border-radius: 2px;
      margin: 0 12px;
    }
    .capacity-bar-fill {
      height: 100%; border-radius: 2px; transition: width 0.3s ease;
    }
    .fill-green { background: #388e3c; }
    .fill-yellow { background: #f57c00; }
    .fill-red { background: #d32f2f; }

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
      margin-bottom: 4px;
    }
    .card-type {
      white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; max-width: 60%;
    }
    .card-age { font-weight: 600; }
    .card-age.urgent { color: #b71c1c; }

    .card-footer {
      display: flex; justify-content: space-between;
      align-items: center; font-size: 0.68rem;
    }
    .card-state {
      font-weight: 700; color: #555;
      background: #eee; padding: 1px 6px; border-radius: 3px;
    }
    .card-status {
      font-weight: 600; padding: 1px 6px; border-radius: 3px;
    }
    .status-new { background: #e3f2fd; color: #1565c0; }
    .status-reviewed { background: #fff3e0; color: #e65100; }
    .status-assigned_to_attorney { background: #e8f5e9; color: #2e7d32; }
    .status-closed { background: #f5f5f5; color: #616161; }
    .status-resolved { background: #e8f5e9; color: #1b5e20; }

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

    /* Capacity confirmation dialog */
    .confirm-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.4);
      z-index: 200;
    }
    .confirm-dialog {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      max-width: 380px;
      width: 90vw;
      z-index: 201;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      text-align: center;
    }
    .confirm-icon { font-size: 48px; width: 48px; height: 48px; color: #f57c00; }
    .confirm-text { margin: 12px 0 20px; font-size: 0.95rem; line-height: 1.4; }
    .confirm-actions { display: flex; justify-content: center; gap: 12px; }

    @media (max-width: 768px) {
      .kanban-column { flex: 0 0 85vw; min-width: 85vw; }
    }
  `],
})
export class AdminOperatorKanbanComponent implements OnInit {
  private adminService = inject(AdminService);
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private translate = inject(TranslateService);

  loading = signal(true);
  error = signal('');
  movingCaseId = signal<string | null>(null);

  operatorList = signal<any[]>([]);
  allCases = signal<any[]>([]);

  confirmDialog = signal<{
    caseId: string;
    operatorId: string;
    operatorName: string;
    currentCount: number;
    capacity: number;
  } | null>(null);

  // Pending drop to execute after capacity confirmation
  private pendingDrop: { caseId: string; targetOperatorId: string | null; sourceCol: OperatorColumn; targetCol: OperatorColumn } | null = null;

  columns = computed<OperatorColumn[]>(() => {
    const ops = this.operatorList();
    const cases = this.allCases();

    const unassigned: OperatorColumn = {
      key: 'unassigned',
      label: this.translate.instant('ADMIN.CASE_DETAIL.UNASSIGNED') || 'Unassigned',
      operatorId: null,
      cases: cases.filter(c => !c.assigned_operator_id),
      activeCaseCount: 0,
      capacity: 0,
    };
    unassigned.activeCaseCount = unassigned.cases.length;

    const opCols: OperatorColumn[] = ops.map(op => {
      const opCases = cases.filter(c => c.assigned_operator_id === op.id);
      return {
        key: op.id,
        label: op.name,
        operatorId: op.id,
        cases: opCases,
        activeCaseCount: opCases.length,
        capacity: op.capacity ?? DEFAULT_CAPACITY,
      };
    });

    return [unassigned, ...opCols];
  });

  columnKeys = computed(() => this.columns().map(c => c.key));

  // Expose Math for template
  Math = Math;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      operators: this.adminService.getOperators(),
      cases: this.adminService.getAllCases({ limit: 500 }),
      attorneys: this.caseService.getAvailableAttorneys(),
    }).subscribe({
      next: ({ operators, cases }) => {
        this.operatorList.set(operators.operators || []);
        // Filter out closed/resolved cases for the board
        const activeCases = (cases.cases || []).filter(
          (c: any) => c.status !== 'closed' && c.status !== 'resolved',
        );
        this.allCases.set(activeCases);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('ADMIN.KANBAN.ASSIGN_FAILED'));
        this.loading.set(false);
      },
    });
  }

  onDrop(event: CdkDragDrop<OperatorColumn>): void {
    const sourceCol = event.previousContainer.data as OperatorColumn;
    const targetCol = event.container.data as OperatorColumn;

    if (sourceCol.key === targetCol.key) return;

    const movedCase = event.item.data;
    const targetOperatorId = targetCol.operatorId;

    // Capacity check for operator columns
    if (targetOperatorId && targetCol.cases.length >= targetCol.capacity) {
      this.pendingDrop = {
        caseId: movedCase.id,
        targetOperatorId,
        sourceCol,
        targetCol,
      };
      this.confirmDialog.set({
        caseId: movedCase.id,
        operatorId: targetOperatorId,
        operatorName: targetCol.label,
        currentCount: targetCol.cases.length,
        capacity: targetCol.capacity,
      });
      return;
    }

    this.executeAssignment(movedCase.id, targetOperatorId);
  }

  confirmOverCapacity(): void {
    if (!this.pendingDrop) return;
    const { caseId, targetOperatorId } = this.pendingDrop;
    this.confirmDialog.set(null);
    this.pendingDrop = null;
    this.executeAssignment(caseId, targetOperatorId);
  }

  cancelOverCapacity(): void {
    this.confirmDialog.set(null);
    this.pendingDrop = null;
  }

  openCase(caseId: string): void {
    this.router.navigate(['/admin/cases', caseId]);
  }

  formatAge(hours: number): string {
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      new: 'New', reviewed: 'Reviewed', assigned_to_attorney: 'Assigned',
      send_info_to_attorney: 'Info Sent', waiting_for_driver: 'Waiting',
      call_court: 'Call Court', check_with_manager: 'Check Mgr',
      pay_attorney: 'Pay Atty', attorney_paid: 'Atty Paid',
      resolved: 'Resolved', closed: 'Closed',
    };
    return map[status] ?? status;
  }

  utilization(col: OperatorColumn): number {
    if (!col.capacity) return 0;
    return (col.cases.length / col.capacity) * 100;
  }

  private executeAssignment(caseId: string, targetOperatorId: string | null): void {
    this.movingCaseId.set(caseId);

    // Optimistic update
    this.allCases.update(cases =>
      cases.map(c => c.id === caseId ? { ...c, assigned_operator_id: targetOperatorId } : c),
    );

    this.adminService.assignOperator(caseId, targetOperatorId).subscribe({
      next: () => {
        this.snackBar.open(
          this.translate.instant('ADMIN.KANBAN.ASSIGNED'),
          'OK',
          { duration: 2000 },
        );
        this.movingCaseId.set(null);
      },
      error: () => {
        // Revert optimistic update by reloading
        this.snackBar.open(
          this.translate.instant('ADMIN.KANBAN.ASSIGN_FAILED'),
          'OK',
          { duration: 3000 },
        );
        this.movingCaseId.set(null);
        this.loadData();
      },
    });
  }
}

import {
  Component, ChangeDetectionStrategy, inject, input, output, signal, computed, OnInit,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of, finalize } from 'rxjs';

import {
  StatusWorkflowService,
  NextStatusesResponse,
} from '../../../core/services/status-workflow.service';
import { StatusNoteDialogComponent } from './status-note-dialog.component';

@Component({
  selector: 'app-status-pipeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDialogModule, MatTooltipModule, TranslateModule,
  ],
  template: `
    <!-- Phase bar -->
    <div class="phase-bar" role="group" [attr.aria-label]="'OPR.WORKFLOW.PHASES' | translate">
      @for (phase of phases(); track phase.key; let i = $index; let last = $last) {
        <div class="phase-step"
             [class.phase-complete]="i < currentPhaseIndex()"
             [class.phase-current]="i === currentPhaseIndex()"
             [class.phase-future]="i > currentPhaseIndex()">
          <div class="phase-circle"
               [attr.aria-label]="(phase.label | translate) + (i === currentPhaseIndex() ? ' (' + ('OPR.WORKFLOW.CURRENT' | translate) + ')' : '')">
            @if (i < currentPhaseIndex()) {
              <mat-icon class="phase-icon">check</mat-icon>
            } @else {
              <span class="phase-number">{{ i + 1 }}</span>
            }
          </div>
          <span class="phase-label">{{ phase.label | translate }}</span>
        </div>
        @if (!last) {
          <div class="phase-connector"
               [class.connector-complete]="i < currentPhaseIndex()"></div>
        }
      }
    </div>

    <!-- Current status detail -->
    <div class="current-status">
      <span class="current-label">{{ 'OPR.WORKFLOW.CURRENT_STATUS' | translate }}:</span>
      <span class="status-chip" [style.background]="currentConfig().color">
        <mat-icon class="chip-icon">{{ currentConfig().icon }}</mat-icon>
        {{ currentConfig().label | translate }}
      </span>
    </div>

    <!-- Quick action buttons -->
    @if (nextStatuses().length > 0 && !changing()) {
      <div class="actions" role="group" [attr.aria-label]="'OPR.WORKFLOW.ACTIONS' | translate">
        @for (ns of nextStatuses(); track ns) {
          <button mat-stroked-button
                  class="action-btn"
                  [class.action-forward]="isForward(ns)"
                  [class.action-lateral]="isLateral(ns)"
                  [class.action-close]="ns === 'closed'"
                  (click)="onAction(ns)"
                  [disabled]="changing()">
            <mat-icon>{{ getConfig(ns).icon }}</mat-icon>
            {{ getConfig(ns).label | translate }}
          </button>
        }
      </div>
    }

    @if (nextStatuses().length === 0 && !loading()) {
      <p class="terminal-msg">{{ 'OPR.WORKFLOW.TERMINAL' | translate }}</p>
    }

    @if (changing()) {
      <div class="changing-indicator" role="status">
        <mat-spinner diameter="24"></mat-spinner>
        <span>{{ 'OPR.WORKFLOW.UPDATING' | translate }}</span>
      </div>
    }

    @if (loading()) {
      <div class="loading-indicator" role="status">
        <mat-spinner diameter="24"></mat-spinner>
      </div>
    }
  `,
  styles: [`
    :host { display: block; margin-bottom: 16px; }

    /* Phase bar */
    .phase-bar {
      display: flex; align-items: center; padding: 16px 0;
    }
    .phase-step {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      flex: 0 0 auto; min-width: 80px;
    }
    .phase-circle {
      width: 36px; height: 36px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.85rem; font-weight: 600;
      border: 2px solid #bdbdbd; background: #fff; color: #757575;
      transition: all 0.3s ease;
    }
    .phase-icon { font-size: 20px; width: 20px; height: 20px; }
    .phase-number { line-height: 1; }
    .phase-label { font-size: 0.75rem; color: #757575; text-align: center; max-width: 90px; }

    .phase-complete .phase-circle {
      background: #43A047; border-color: #43A047; color: #fff;
    }
    .phase-complete .phase-label { color: #43A047; font-weight: 500; }

    .phase-current .phase-circle {
      background: #1976D2; border-color: #1976D2; color: #fff;
      animation: pulse 2s ease-in-out infinite;
    }
    .phase-current .phase-label { color: #1976D2; font-weight: 600; }

    .phase-future .phase-circle { opacity: 0.5; }
    .phase-future .phase-label { opacity: 0.5; }

    .phase-connector {
      flex: 1; height: 2px; background: #e0e0e0; min-width: 12px;
    }
    .connector-complete { background: #43A047; }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(25, 118, 210, 0); }
    }

    /* Current status */
    .current-status {
      display: flex; align-items: center; gap: 8px; padding: 8px 0 12px;
    }
    .current-label { font-size: 0.9rem; color: #666; }
    .status-chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 12px; border-radius: 16px; font-size: 0.85rem; font-weight: 500;
    }
    .chip-icon { font-size: 16px; width: 16px; height: 16px; }

    /* Action buttons */
    .actions {
      display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 0;
    }
    .action-btn {
      min-height: 44px; min-width: 44px;
      display: inline-flex; align-items: center; gap: 4px;
    }
    .action-forward { --mdc-outlined-button-outline-color: #43A047; color: #2E7D32; }
    .action-lateral { --mdc-outlined-button-outline-color: #FF8F00; color: #E65100; }
    .action-close { --mdc-outlined-button-outline-color: #E53935; color: #C62828; }

    .terminal-msg {
      color: #757575; font-style: italic; font-size: 0.9rem; margin: 8px 0;
    }
    .changing-indicator, .loading-indicator {
      display: flex; align-items: center; gap: 8px; padding: 8px 0;
      color: #666; font-size: 0.9rem;
    }

    /* Mobile responsive: vertical timeline */
    @media (max-width: 600px) {
      .phase-bar { flex-direction: column; align-items: flex-start; gap: 0; }
      .phase-step { flex-direction: row; gap: 12px; min-width: unset; width: 100%; padding: 6px 0; }
      .phase-label { text-align: left; max-width: none; }
      .phase-connector { width: 2px; height: 16px; min-width: 2px; margin-left: 17px; }
      .actions { flex-direction: column; }
      .action-btn { width: 100%; justify-content: center; }
    }
  `],
})
export class StatusPipelineComponent implements OnInit {
  currentStatus = input.required<string>();
  caseId = input.required<string>();
  statusChanged = output<string>();

  private workflowService = inject(StatusWorkflowService);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  nextStatuses = signal<string[]>([]);
  requiresNote = signal<Record<string, boolean>>({});
  changing = signal(false);
  loading = signal(false);

  phases = computed(() => this.workflowService.getPhases());

  currentPhaseIndex = computed(() =>
    this.workflowService.getPhaseIndex(this.currentStatus()),
  );

  currentConfig = computed(() =>
    this.workflowService.getStatusConfig(this.currentStatus()),
  );

  ngOnInit(): void {
    this.loadNextStatuses();
  }

  getConfig(status: string) {
    return this.workflowService.getStatusConfig(status);
  }

  isForward(target: string): boolean {
    const targetPhase = this.workflowService.getPhaseIndex(target);
    return targetPhase > this.currentPhaseIndex() && target !== 'closed';
  }

  isLateral(target: string): boolean {
    if (target === 'closed') return false;
    const targetPhase = this.workflowService.getPhaseIndex(target);
    return targetPhase <= this.currentPhaseIndex();
  }

  onAction(target: string): void {
    if (this.requiresNote()[target]) {
      this.openNoteDialog(target);
    } else {
      this.doTransition(target);
    }
  }

  private openNoteDialog(target: string): void {
    const config = this.workflowService.getStatusConfig(target);
    const ref = this.dialog.open(StatusNoteDialogComponent, {
      data: { targetLabel: this.translate.instant(config.label) },
      width: '440px',
      maxWidth: '95vw',
    });
    ref.afterClosed().subscribe((note: string | undefined) => {
      if (note) {
        this.doTransition(target, note);
      }
    });
  }

  private doTransition(target: string, comment?: string): void {
    this.changing.set(true);
    this.workflowService.changeStatus(this.caseId(), target, comment).pipe(
      finalize(() => this.changing.set(false)),
      catchError(() => of(null)),
    ).subscribe(result => {
      if (result) {
        this.statusChanged.emit(target);
      }
    });
  }

  private loadNextStatuses(): void {
    this.loading.set(true);
    this.workflowService.getNextStatuses(this.caseId()).pipe(
      finalize(() => this.loading.set(false)),
      catchError(() => of(null)),
    ).subscribe(resp => {
      if (resp) {
        this.nextStatuses.set(resp.nextStatuses);
        this.requiresNote.set(resp.requiresNote);
      }
    });
  }
}

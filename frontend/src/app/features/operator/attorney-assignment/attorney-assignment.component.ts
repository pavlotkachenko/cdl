import {
  Component, OnInit, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of, finalize } from 'rxjs';

import { DecimalPipe } from '@angular/common';
import { CaseService } from '../../../core/services/case.service';

export interface AttorneyAssignmentDialogData {
  caseId: string;
  caseNumber: string;
}

export interface AttorneyAssignmentDialogResult {
  assigned: boolean;
  attorneyName?: string;
}

@Component({
  selector: 'app-attorney-assignment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, MatChipsModule,
    MatRadioModule, TranslateModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="title-icon">gavel</mat-icon>
      {{ 'OPR.ASSIGN.TITLE' | translate }} {{ data.caseNumber }}
    </h2>

    <mat-dialog-content>
      <!-- Loading -->
      @if (loading()) {
        <div class="loading-container" role="status">
          <mat-spinner diameter="40"></mat-spinner>
          <p>{{ 'OPR.ASSIGN.LOADING' | translate }}</p>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="error-container" role="alert">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
        </div>
      }

      <!-- No attorneys available -->
      @if (!loading() && !error() && noAttorneys()) {
        <div class="empty-state" role="status">
          <mat-icon class="empty-icon">person_off</mat-icon>
          <p class="empty-title">{{ 'OPR.ASSIGN.NO_ATTORNEYS' | translate }}</p>
          <p class="empty-subtitle">{{ 'OPR.ASSIGN.NO_ATTORNEYS_DETAIL' | translate }}</p>
        </div>
      }

      <!-- Attorney list -->
      @if (!loading() && !error() && !noAttorneys()) {
        <!-- Auto-assign button -->
        <div class="auto-assign-row">
          <button mat-flat-button color="primary" (click)="autoAssign()"
                  [disabled]="assigning()" class="auto-btn" data-cy="auto-assign-btn">
            @if (assigning()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>auto_fix_high</mat-icon>
              {{ 'OPR.ASSIGN.AUTO_ASSIGN' | translate }}
            }
          </button>
          <span class="auto-hint">{{ 'OPR.ASSIGN.AUTO_HINT' | translate }}</span>
        </div>

        <div class="divider-row">
          <span class="divider-text">{{ 'OPR.ASSIGN.OR_MANUAL' | translate }}</span>
        </div>

        <!-- Ranked list -->
        <div class="attorney-list" role="radiogroup" [attr.aria-label]="'OPR.ASSIGN.SELECT_ATTORNEY' | translate">
          @for (att of attorneys(); track att.userId; let i = $index) {
            <div class="attorney-row" data-cy="attorney-row" [class.selected]="selectedAttorneyId() === att.userId"
                 (click)="selectAttorney(att.userId)" (keydown.enter)="selectAttorney(att.userId)"
                 tabindex="0" role="radio" [attr.aria-checked]="selectedAttorneyId() === att.userId">
              <div class="rank-badge">#{{ i + 1 }}</div>
              <div class="attorney-info">
                <span class="attorney-name" data-cy="attorney-name">{{ att.name || (att.firstName + ' ' + att.lastName) }}</span>
                <div class="attorney-details">
                  @if (att.specializations?.length) {
                    <mat-chip-set aria-label="Specializations">
                      @for (spec of att.specializations; track spec) {
                        <mat-chip class="spec-chip">{{ spec }}</mat-chip>
                      }
                    </mat-chip-set>
                  }
                  @if (att.stateLicenses?.length) {
                    <span class="licenses">{{ att.stateLicenses.join(', ') }}</span>
                  }
                </div>
                <span class="attorney-cases">{{ att.currentCases }} {{ 'OPR.ASSIGN.ACTIVE_CASES' | translate }}</span>
              </div>
              <div class="score-col">
                <span class="score-value" data-cy="attorney-score" [class]="getScoreClass(att.score)"
                      [matTooltip]="getScoreTooltip(att)">
                  {{ att.score | number:'1.0-0' }}
                </span>
                <span class="score-label">/100</span>
              </div>
              <mat-radio-button [value]="att.userId" [checked]="selectedAttorneyId() === att.userId"
                                (click)="$event.stopPropagation()"></mat-radio-button>
            </div>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'OPR.ASSIGN.CANCEL' | translate }}</button>
      @if (!noAttorneys() && !loading()) {
        <button mat-flat-button color="primary"
                data-cy="confirm-assign-btn"
                [disabled]="!selectedAttorneyId() || assigning()"
                (click)="confirmManualAssign()">
          @if (assigning()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            {{ 'OPR.ASSIGN.CONFIRM' | translate }} {{ getSelectedAttorneyName() }}
          }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: block; }

    .title-icon { vertical-align: middle; margin-right: 8px; }

    .loading-container, .error-container, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 32px 16px; gap: 12px; text-align: center;
    }
    .error-container mat-icon { font-size: 40px; width: 40px; height: 40px; color: #E53935; }
    .empty-icon { font-size: 56px; width: 56px; height: 56px; color: #bdbdbd; }
    .empty-title { font-size: 1.1rem; font-weight: 500; margin: 0; }
    .empty-subtitle { color: #888; margin: 0; }

    .auto-assign-row {
      display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;
    }
    .auto-btn { min-height: 44px; }
    .auto-btn mat-icon { margin-right: 4px; }
    .auto-hint { font-size: 0.85rem; color: #888; }

    .divider-row {
      display: flex; align-items: center; margin: 8px 0 16px; gap: 12px;
    }
    .divider-row::before, .divider-row::after {
      content: ''; flex: 1; height: 1px; background: #e0e0e0;
    }
    .divider-text { font-size: 0.8rem; color: #999; text-transform: uppercase; white-space: nowrap; }

    .attorney-list { display: flex; flex-direction: column; gap: 8px; }
    .attorney-row {
      display: flex; align-items: center; gap: 12px; padding: 12px;
      border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .attorney-row:hover { background: #fafafa; }
    .attorney-row.selected { background: #E3F2FD; border-color: #1976D2; }
    .attorney-row:focus-visible { outline: 2px solid #1976D2; outline-offset: 2px; }

    .rank-badge {
      width: 32px; height: 32px; border-radius: 50%; background: #f0f0f0;
      display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 0.85rem; color: #666; flex-shrink: 0;
    }
    .attorney-info { flex: 1; min-width: 0; }
    .attorney-name { font-weight: 500; display: block; }
    .attorney-details { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 4px; }
    .spec-chip { font-size: 0.7rem; --mdc-chip-container-height: 24px; }
    .licenses { font-size: 0.8rem; color: #888; }
    .attorney-cases { font-size: 0.8rem; color: #888; display: block; margin-top: 2px; }

    .score-col { display: flex; align-items: baseline; gap: 2px; flex-shrink: 0; }
    .score-value { font-size: 1.25rem; font-weight: 700; cursor: help; }
    .score-label { font-size: 0.75rem; color: #999; }
    .score-high { color: #43A047; }
    .score-medium { color: #FB8C00; }
    .score-low { color: #E53935; }

    @media (max-width: 600px) {
      .attorney-row { flex-wrap: wrap; }
      .score-col { margin-left: auto; }
    }
  `],
})
export class AttorneyAssignmentComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AttorneyAssignmentComponent>);
  data: AttorneyAssignmentDialogData = inject(MAT_DIALOG_DATA);
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);

  attorneys = signal<any[]>([]);
  loading = signal(true);
  assigning = signal(false);
  selectedAttorneyId = signal<string | null>(null);
  noAttorneys = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.loadAttorneys();
  }

  loadAttorneys(): void {
    this.loading.set(true);
    this.error.set('');

    this.caseService.getRankedAttorneys(this.data.caseId).pipe(
      catchError(err => {
        this.error.set(err?.error?.error || 'Failed to load attorneys');
        return of(null);
      }),
    ).subscribe(result => {
      if (result?.data?.attorneys) {
        this.attorneys.set(result.data.attorneys);
        this.noAttorneys.set(result.data.attorneys.length === 0);
      } else if (result) {
        this.attorneys.set([]);
        this.noAttorneys.set(true);
      }
      this.loading.set(false);
    });
  }

  selectAttorney(id: string): void {
    this.selectedAttorneyId.set(id);
  }

  autoAssign(): void {
    if (this.assigning()) return;
    this.assigning.set(true);

    this.caseService.autoAssignCase(this.data.caseId).pipe(
      finalize(() => this.assigning.set(false)),
      catchError(err => {
        const msg = err?.error?.error || 'Auto-assign failed';
        if (msg.includes('No attorneys') || msg.includes('No eligible')) {
          this.noAttorneys.set(true);
          this.snackBar.open(msg, 'OK', { duration: 4000 });
        } else {
          this.snackBar.open(msg, 'OK', { duration: 4000, panelClass: 'snack-error' });
        }
        return of(null);
      }),
    ).subscribe(result => {
      if (result?.success) {
        const name = result.data?.assignedAttorney?.name || 'Attorney';
        this.snackBar.open(`Attorney ${name} assigned`, 'OK', { duration: 3000 });
        this.dialogRef.close({ assigned: true, attorneyName: name } as AttorneyAssignmentDialogResult);
      }
    });
  }

  confirmManualAssign(): void {
    const attorneyId = this.selectedAttorneyId();
    if (!attorneyId || this.assigning()) return;

    this.assigning.set(true);

    this.caseService.manualAssignCase(this.data.caseId, attorneyId).pipe(
      finalize(() => this.assigning.set(false)),
      catchError(err => {
        this.snackBar.open(err?.error?.error || 'Assignment failed', 'OK', { duration: 4000, panelClass: 'snack-error' });
        return of(null);
      }),
    ).subscribe(result => {
      if (result?.success) {
        const name = result.data?.assignedAttorney?.name || 'Attorney';
        this.snackBar.open(`Attorney ${name} assigned`, 'OK', { duration: 3000 });
        this.dialogRef.close({ assigned: true, attorneyName: name } as AttorneyAssignmentDialogResult);
      }
    });
  }

  getSelectedAttorneyName(): string {
    const id = this.selectedAttorneyId();
    if (!id) return '';
    const att = this.attorneys().find(a => a.userId === id);
    return att ? (att.name || `${att.firstName} ${att.lastName}`) : '';
  }

  getScoreClass(score: number): string {
    if (score >= 70) return 'score-high';
    if (score >= 40) return 'score-medium';
    return 'score-low';
  }

  getScoreTooltip(att: any): string {
    if (!att.scoreBreakdown) return `Score: ${att.score}`;
    const b = att.scoreBreakdown;
    return `Specialization: ${b.specialization}/100 (30%)\nState License: ${b.stateLicense}/100 (25%)\nWorkload: ${b.workload?.toFixed(0)}/100 (20%)\nSuccess Rate: ${b.successRate?.toFixed(0)}/100 (15%)\nAvailability: ${b.availability}/100 (10%)`;
  }
}

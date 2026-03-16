import { Component, ChangeDetectionStrategy, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { AdminService } from '../../../core/services/admin.service';
import { CaseService } from '../../../core/services/case.service';
import { AuthService } from '../../../core/services/auth.service';
import { StatusPipelineComponent } from '../../operator/status-pipeline/status-pipeline.component';
import { CaseEditFormComponent } from '../../operator/case-edit/case-edit-form.component';
import { FileManagerComponent } from '../../operator/file-manager/file-manager.component';

@Component({
  selector: 'app-admin-case-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatChipsModule,
    TranslateModule,
    StatusPipelineComponent,
    CaseEditFormComponent,
    FileManagerComponent,
  ],
  template: `
    <!-- Loading -->
    @if (loading()) {
      <div class="loading-container" role="status" aria-busy="true">
        <mat-spinner diameter="48"></mat-spinner>
        <p>{{ 'ADMIN.CASE_DETAIL.LOADING' | translate }}</p>
      </div>
    }

    <!-- Error -->
    @if (error()) {
      <div class="error-container" role="alert">
        <mat-icon>error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-flat-button color="primary" (click)="loadCase()">
          {{ 'ADMIN.CASE_DETAIL.RETRY' | translate }}
        </button>
        <a mat-button routerLink="/admin/cases"
           [attr.aria-label]="'ADMIN.CASE_DETAIL.BACK' | translate">
          {{ 'ADMIN.CASE_DETAIL.BACK' | translate }}
        </a>
      </div>
    }

    <!-- Case Detail -->
    @if (caseData() && !loading()) {
      <div class="case-detail-page">
        <!-- Header -->
        <div class="case-header">
          <a mat-button routerLink="/admin/cases" class="back-link"
             [attr.aria-label]="'ADMIN.CASE_DETAIL.BACK' | translate">
            <mat-icon>arrow_back</mat-icon> {{ 'ADMIN.CASE_DETAIL.BACK' | translate }}
          </a>
          <div class="case-title">
            <h1>{{ 'ADMIN.CASE_DETAIL.CASE_PREFIX' | translate }}{{ caseData()!.case_number }}</h1>
            <mat-chip-set [attr.aria-label]="'ADMIN.STATUS' | translate">
              <mat-chip [class]="'status-chip status-' + caseData()!.status">
                {{ caseData()!.status | titlecase }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>

        <!-- Status Pipeline -->
        <section class="section" [attr.aria-label]="'ADMIN.CASE_DETAIL.STATUS_PIPELINE' | translate">
          <h2>{{ 'ADMIN.CASE_DETAIL.STATUS_PIPELINE' | translate }}</h2>
          <app-status-pipeline
            [currentStatus]="caseData()!.status"
            [caseId]="caseId()"
            (statusChanged)="onStatusChanged($event)">
          </app-status-pipeline>
        </section>

        <!-- Case Details (inline edit) -->
        <section class="section" [attr.aria-label]="'ADMIN.CASE_DETAIL.CASE_DETAILS' | translate">
          <h2>{{ 'ADMIN.CASE_DETAIL.CASE_DETAILS' | translate }}</h2>
          <app-case-edit-form
            [caseData]="caseData()!"
            [readonly]="false"
            (saved)="onCaseSaved($event)"
            (cancelled)="onEditCancelled()">
          </app-case-edit-form>
        </section>

        <!-- Assignment Section -->
        <section class="section assignment-section"
                 [attr.aria-label]="'ADMIN.CASE_DETAIL.ASSIGNMENTS' | translate">
          <h2>{{ 'ADMIN.CASE_DETAIL.ASSIGNMENTS' | translate }}</h2>
          <div class="assignment-grid">
            <!-- Operator Assignment -->
            <div class="assignment-item">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'ADMIN.CASE_DETAIL.OPERATOR_LABEL' | translate }}</mat-label>
                <mat-select
                  [value]="caseData()!.assigned_operator_id || ''"
                  (selectionChange)="onOperatorChanged($event.value)"
                  [attr.aria-label]="'ADMIN.CASE_DETAIL.OPERATOR_LABEL' | translate">
                  <mat-option value="">{{ 'ADMIN.CASE_DETAIL.UNASSIGNED' | translate }}</mat-option>
                  @for (op of operators(); track op.id) {
                    <mat-option [value]="op.id">
                      {{ op.name }} ({{ op.activeCaseCount }} {{ 'ADMIN.CASE_DETAIL.ACTIVE_SUFFIX' | translate }})
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>

            <!-- Attorney Assignment -->
            <div class="assignment-item">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'ADMIN.CASE_DETAIL.ATTORNEY_LABEL' | translate }}</mat-label>
                <mat-select
                  [value]="caseData()!.assigned_attorney_id || ''"
                  (selectionChange)="onAttorneyChanged($event.value)"
                  [attr.aria-label]="'ADMIN.CASE_DETAIL.ATTORNEY_LABEL' | translate">
                  <mat-option value="">{{ 'ADMIN.CASE_DETAIL.UNASSIGNED' | translate }}</mat-option>
                  @for (att of attorneys(); track att.id) {
                    <mat-option [value]="att.id">
                      {{ att.full_name }} ({{ att.active_cases || 0 }} {{ 'ADMIN.CASE_DETAIL.ACTIVE_SUFFIX' | translate }})
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </section>

        <!-- Files -->
        <section class="section" [attr.aria-label]="'ADMIN.CASE_DETAIL.FILES' | translate">
          <h2>{{ 'ADMIN.CASE_DETAIL.FILES' | translate }}</h2>
          <app-file-manager
            [caseId]="caseId()"
            [readonly]="false"
            [currentUserId]="currentUserId()">
          </app-file-manager>
        </section>

        <!-- Activity Log -->
        <section class="section" [attr.aria-label]="'ADMIN.CASE_DETAIL.ACTIVITY_LOG' | translate">
          <h2>{{ 'ADMIN.CASE_DETAIL.ACTIVITY_LOG' | translate }}</h2>
          @if (activity().length === 0) {
            <p class="empty-text" role="status">{{ 'ADMIN.CASE_DETAIL.ACTIVITY_EMPTY' | translate }}</p>
          }
          <div class="activity-timeline" role="list">
            @for (entry of activity(); track entry.id) {
              <div class="activity-entry" role="listitem">
                <div class="activity-time">
                  <time [attr.datetime]="entry.created_at">
                    {{ entry.created_at | date:'medium' }}
                  </time>
                </div>
                <div class="activity-content">
                  <span class="activity-action">{{ formatAction(entry.action) }}</span>
                  @if (entry.user_name) {
                    <span class="activity-actor"> {{ 'ADMIN.CASE_DETAIL.ACTIVITY_BY' | translate }} {{ entry.user_name }}</span>
                  }
                  @if (entry.details?.comment) {
                    <p class="activity-comment">"{{ entry.details.comment }}"</p>
                  }
                  @if (entry.details?.from && entry.details?.to) {
                    <p class="activity-detail">
                      {{ entry.details.from }} → {{ entry.details.to }}
                    </p>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      </div>
    }
  `,
  styles: [`
    :host { display: block; padding: 24px; max-width: 960px; margin: 0 auto; }

    .loading-container, .error-container {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; min-height: 300px; gap: 16px;
    }
    .error-container mat-icon { font-size: 48px; width: 48px; height: 48px; color: #d32f2f; }

    .case-header { margin-bottom: 24px; }
    .back-link { margin-bottom: 8px; }
    .case-title { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .case-title h1 { margin: 0; font-size: 1.5rem; }

    .section { margin-bottom: 32px; }
    .section h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 12px; color: #333; }

    .assignment-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
    }
    @media (max-width: 768px) {
      :host { padding: 16px; }
      .assignment-grid { grid-template-columns: 1fr; }
    }
    .assignment-item mat-form-field { width: 100%; }

    .activity-timeline { display: flex; flex-direction: column; gap: 12px; }
    .activity-entry {
      display: flex; gap: 16px; padding: 12px; border-left: 3px solid #1976d2;
      background: #fafafa; border-radius: 0 4px 4px 0;
    }
    .activity-time { flex-shrink: 0; font-size: 0.8rem; color: #757575; min-width: 160px; }
    .activity-action { font-weight: 600; }
    .activity-actor { color: #757575; }
    .activity-comment { font-style: italic; margin: 4px 0 0 0; color: #555; }
    .activity-detail { margin: 4px 0 0 0; font-size: 0.85rem; color: #757575; }

    .empty-text { color: #757575; font-style: italic; }

    .status-chip { font-size: 0.75rem; }
    .status-new { background-color: #e3f2fd !important; color: #1565c0 !important; }
    .status-reviewed { background-color: #fff3e0 !important; color: #e65100 !important; }
    .status-assigned_to_attorney { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .status-closed { background-color: #f5f5f5 !important; color: #616161 !important; }
    .status-resolved { background-color: #e8f5e9 !important; color: #1b5e20 !important; }
  `],
})
export class AdminCaseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private caseService = inject(CaseService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  caseId = signal('');
  caseData = signal<any>(null);
  activity = signal<any[]>([]);
  operators = signal<any[]>([]);
  attorneys = signal<any[]>([]);
  loading = signal(true);
  error = signal('');

  currentUserId = computed(() => this.authService.currentUserValue?.id || '');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.caseId.set(id);
      this.loadCase();
    } else {
      this.error.set(this.translate.instant('ADMIN.CASE_DETAIL.NO_CASE_ID'));
      this.loading.set(false);
    }
  }

  loadCase(): void {
    this.loading.set(true);
    this.error.set('');

    forkJoin({
      detail: this.adminService.getAdminCaseDetail(this.caseId()),
      operators: this.adminService.getOperators(),
      attorneys: this.caseService.getAvailableAttorneys(),
    }).subscribe({
      next: ({ detail, operators, attorneys }) => {
        this.caseData.set(detail.case);
        this.activity.set(detail.activity || []);
        this.operators.set(operators.operators || []);
        this.attorneys.set(attorneys.attorneys || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('ADMIN.CASE_DETAIL.LOAD_FAILED'));
        this.loading.set(false);
      },
    });
  }

  onStatusChanged(newStatus: string): void {
    this.caseData.update(c => c ? { ...c, status: newStatus } : c);
    this.loadCase();
  }

  onCaseSaved(updated: any): void {
    this.caseData.set(updated);
    this.snackBar.open(
      this.translate.instant('ADMIN.CASE_DETAIL.CASE_UPDATED'),
      this.translate.instant('ADMIN.CASE_DETAIL.CLOSE'),
      { duration: 3000 },
    );
  }

  onEditCancelled(): void {
    // No action needed — form handles its own toggle
  }

  onOperatorChanged(operatorId: string): void {
    const opId = operatorId || null;
    this.adminService.assignOperator(this.caseId(), opId).subscribe({
      next: () => {
        this.caseData.update(c => c ? { ...c, assigned_operator_id: opId } : c);
        this.snackBar.open(
          this.translate.instant('ADMIN.CASE_DETAIL.OPERATOR_UPDATED'),
          this.translate.instant('ADMIN.CASE_DETAIL.CLOSE'),
          { duration: 3000 },
        );
        this.loadCase();
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('ADMIN.CASE_DETAIL.OPERATOR_FAILED'),
          this.translate.instant('ADMIN.CASE_DETAIL.CLOSE'),
          { duration: 5000 },
        );
      },
    });
  }

  onAttorneyChanged(attorneyId: string): void {
    if (!attorneyId) return;
    this.adminService.assignAttorney(this.caseId(), attorneyId).subscribe({
      next: () => {
        this.caseData.update(c => c ? { ...c, assigned_attorney_id: attorneyId } : c);
        this.snackBar.open(
          this.translate.instant('ADMIN.CASE_DETAIL.ATTORNEY_UPDATED'),
          this.translate.instant('ADMIN.CASE_DETAIL.CLOSE'),
          { duration: 3000 },
        );
        this.loadCase();
      },
      error: () => {
        this.snackBar.open(
          this.translate.instant('ADMIN.CASE_DETAIL.ATTORNEY_FAILED'),
          this.translate.instant('ADMIN.CASE_DETAIL.CLOSE'),
          { duration: 5000 },
        );
      },
    });
  }

  formatAction(action: string): string {
    const keyMap: Record<string, string> = {
      status_change: 'ADMIN.CASE_DETAIL.ACTION_STATUS_CHANGE',
      admin_status_override: 'ADMIN.CASE_DETAIL.ACTION_ADMIN_OVERRIDE',
      assignment_approved: 'ADMIN.CASE_DETAIL.ACTION_ASSIGNMENT_APPROVED',
      assignment_rejected: 'ADMIN.CASE_DETAIL.ACTION_ASSIGNMENT_REJECTED',
      case_created: 'ADMIN.CASE_DETAIL.ACTION_CASE_CREATED',
      document_uploaded: 'ADMIN.CASE_DETAIL.ACTION_DOCUMENT_UPLOADED',
      document_deleted: 'ADMIN.CASE_DETAIL.ACTION_DOCUMENT_DELETED',
      note_added: 'ADMIN.CASE_DETAIL.ACTION_NOTE_ADDED',
      operator_assigned: 'ADMIN.CASE_DETAIL.ACTION_OPERATOR_ASSIGNED',
      attorney_assigned: 'ADMIN.CASE_DETAIL.ACTION_ATTORNEY_ASSIGNED',
    };
    const key = keyMap[action];
    if (key) return this.translate.instant(key);
    return action.replace(/_/g, ' ');
  }
}

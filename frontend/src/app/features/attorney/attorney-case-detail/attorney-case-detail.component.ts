import {
  Component, OnInit, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';

import { AttorneyService, AttorneyCase, CaseDocument } from '../../../core/services/attorney.service';

@Component({
  selector: 'app-attorney-case-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatProgressSpinnerModule,
    MatSelectModule, MatFormFieldModule,
  ],
  template: `
    <div class="detail-page">
      <div class="detail-header">
        <button mat-icon-button (click)="goBack()" aria-label="Back to dashboard">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Case Detail</h1>
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (caseData()) {
        <mat-card>
          <mat-card-content>
            <div class="case-meta">
              <p class="case-num">{{ caseData()!.case_number }}</p>
              <span class="status-badge status-{{ caseData()!.status }}">
                {{ getStatusLabel(caseData()!.status) }}
              </span>
            </div>
            <mat-divider></mat-divider>
            <div class="info-grid">
              <div><span class="lbl">Driver</span><span>{{ caseData()!.driver_name }}</span></div>
              <div><span class="lbl">Violation</span><span>{{ caseData()!.violation_type }}</span></div>
              <div><span class="lbl">State</span><span>{{ caseData()!.state }}</span></div>
              @if (caseData()!.attorney_price) {
                <div><span class="lbl">Fee</span><span>\${{ caseData()!.attorney_price }}</span></div>
              }
            </div>

            @if (caseData()!.status === 'assigned_to_attorney') {
              <div class="accept-row">
                <button mat-raised-button color="primary" (click)="accept()" [disabled]="processing()">
                  @if (processing()) { <mat-spinner diameter="18"></mat-spinner> } @else { Accept Case }
                </button>
                <button mat-stroked-button color="warn" (click)="decline()" [disabled]="processing()">
                  Decline
                </button>
              </div>
            } @else {
              <div class="status-update">
                <mat-form-field appearance="outline" class="status-field">
                  <mat-label>Update Status</mat-label>
                  <mat-select [value]="selectedStatus()" (selectionChange)="selectedStatus.set($event.value)">
                    @for (s of UPDATABLE_STATUSES; track s.value) {
                      <mat-option [value]="s.value">{{ s.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <button mat-raised-button color="primary"
                        (click)="updateStatus()"
                        [disabled]="!selectedStatus() || processing()">
                  Update
                </button>
              </div>
            }
          </mat-card-content>
        </mat-card>

        @if (documents().length > 0) {
          <mat-card class="docs-card">
            <mat-card-header><mat-card-title>Documents</mat-card-title></mat-card-header>
            <mat-card-content>
              @for (doc of documents(); track doc.id) {
                <div class="doc-row">
                  <mat-icon aria-hidden="true">{{ getFileIcon(doc.file_type) }}</mat-icon>
                  <span class="doc-name">{{ doc.file_name }}</span>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .detail-page { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
    .detail-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .detail-header h1 { margin: 0; font-size: 1.4rem; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .case-meta { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; }
    .case-num { margin: 0; font-weight: 700; font-size: 1rem; }
    .status-badge { font-size: 0.75rem; padding: 3px 8px; border-radius: 10px; background: #e0e0e0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 12px 0; }
    .info-grid div { display: flex; flex-direction: column; gap: 2px; }
    .lbl { font-size: 0.7rem; color: #888; text-transform: uppercase; }
    .accept-row { display: flex; gap: 12px; padding-top: 16px; }
    .status-update { display: flex; gap: 12px; align-items: flex-start; padding-top: 12px; }
    .status-field { flex: 1; }
    .docs-card { margin-top: 16px; }
    .doc-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
    .doc-name { font-size: 0.85rem; }
  `],
})
export class AttorneyCaseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private attorneyService = inject(AttorneyService);
  private snackBar = inject(MatSnackBar);

  caseId = signal('');
  caseData = signal<AttorneyCase | null>(null);
  documents = signal<CaseDocument[]>([]);
  loading = signal(true);
  processing = signal(false);
  selectedStatus = signal('');

  readonly UPDATABLE_STATUSES = [
    { value: 'send_info_to_attorney', label: 'Working on case' },
    { value: 'waiting_for_driver', label: 'Need info from driver' },
    { value: 'call_court', label: 'Calling court' },
    { value: 'check_with_manager', label: 'Escalate to manager' },
    { value: 'closed', label: 'Close case' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.params['caseId'];
    this.caseId.set(id);
    this.loadCase();
    this.loadDocuments();
  }

  private loadCase(): void {
    this.loading.set(true);
    this.attorneyService.getCaseById(this.caseId()).subscribe({
      next: (r) => { this.caseData.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  private loadDocuments(): void {
    this.attorneyService.getDocuments(this.caseId()).subscribe({
      next: (r) => this.documents.set(r.documents ?? []),
      error: () => {},
    });
  }

  accept(): void {
    this.processing.set(true);
    this.attorneyService.acceptCase(this.caseId()).subscribe({
      next: () => {
        this.processing.set(false);
        this.snackBar.open('Case accepted — now active in your queue.', 'Close', { duration: 3000 });
        this.loadCase();
      },
      error: () => {
        this.processing.set(false);
        this.snackBar.open('Failed to accept case.', 'Close', { duration: 3000 });
      },
    });
  }

  decline(): void {
    this.processing.set(true);
    this.attorneyService.declineCase(this.caseId()).subscribe({
      next: () => {
        this.snackBar.open('Case declined.', 'Close', { duration: 3000 });
        this.router.navigate(['/attorney/dashboard']);
      },
      error: () => {
        this.processing.set(false);
        this.snackBar.open('Failed to decline case.', 'Close', { duration: 3000 });
      },
    });
  }

  updateStatus(): void {
    if (!this.selectedStatus()) return;
    this.processing.set(true);
    this.attorneyService.updateStatus(this.caseId(), this.selectedStatus()).subscribe({
      next: () => {
        this.processing.set(false);
        this.selectedStatus.set('');
        this.snackBar.open('Status updated.', 'Close', { duration: 3000 });
        this.loadCase();
      },
      error: () => {
        this.processing.set(false);
        this.snackBar.open('Failed to update status.', 'Close', { duration: 3000 });
      },
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      new: 'New',
      reviewed: 'Under Review',
      assigned_to_attorney: 'Pending Acceptance',
      send_info_to_attorney: 'Active',
      waiting_for_driver: 'Awaiting Driver',
      call_court: 'Court Proceedings',
      check_with_manager: 'Escalated',
      pay_attorney: 'Payment Due',
      closed: 'Closed',
      resolved: 'Resolved',
    };
    return labels[status] ?? status;
  }

  getFileIcon(fileType: string): string {
    if (fileType?.includes('pdf')) return 'picture_as_pdf';
    if (fileType?.includes('image')) return 'image';
    return 'insert_drive_file';
  }

  goBack(): void {
    this.router.navigate(['/attorney/dashboard']);
  }
}

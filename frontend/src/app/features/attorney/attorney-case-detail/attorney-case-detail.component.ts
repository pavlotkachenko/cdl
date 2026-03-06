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
import { MatInputModule } from '@angular/material/input';

import {
  AttorneyService, AttorneyCase, CaseDocument, CaseNote, CourtDate,
} from '../../../core/services/attorney.service';

@Component({
  selector: 'app-attorney-case-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatDividerModule, MatProgressSpinnerModule,
    MatSelectModule, MatFormFieldModule, MatInputModule,
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
        <!-- Case info card -->
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

        <!-- Court Date card -->
        <mat-card class="court-card">
          <mat-card-header>
            <mat-card-title>Court Date</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @if (courtDate()) {
              <div class="court-display">
                <mat-icon aria-hidden="true">event</mat-icon>
                <span class="court-date-value">{{ formatDate(courtDate()!.court_date) }}</span>
                @if (courtDate()!.location) {
                  <span class="court-location">· {{ courtDate()!.location }}</span>
                }
              </div>
            }
            <div class="court-input-row">
              <mat-form-field appearance="outline" class="date-field">
                <mat-label>Set Court Date</mat-label>
                <input matInput type="date"
                       [value]="courtDateInput()"
                       (input)="courtDateInput.set($any($event.target).value)" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="location-field">
                <mat-label>Location</mat-label>
                <input matInput
                       [value]="courtLocation()"
                       (input)="courtLocation.set($any($event.target).value)"
                       placeholder="Courthouse name" />
              </mat-form-field>
              <button mat-raised-button color="primary"
                      (click)="saveCourtDate()"
                      [disabled]="!courtDateInput() || settingCourtDate()">
                Save
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Documents card -->
        <mat-card class="docs-card">
          <mat-card-header>
            <mat-card-title>Documents</mat-card-title>
            <div class="card-actions">
              <input #fileInput type="file" hidden
                     accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                     (change)="onFileSelected($event)" />
              <button mat-stroked-button (click)="fileInput.click()" [disabled]="uploading()">
                <mat-icon>upload</mat-icon>
                {{ uploading() ? 'Uploading...' : 'Upload' }}
              </button>
            </div>
          </mat-card-header>
          <mat-card-content>
            @if (documents().length === 0) {
              <p class="empty-msg">No documents yet.</p>
            } @else {
              @for (doc of documents(); track doc.id) {
                <div class="doc-row">
                  <mat-icon aria-hidden="true">{{ getFileIcon(doc.file_type) }}</mat-icon>
                  <span class="doc-name">{{ doc.file_name }}</span>
                </div>
              }
            }
          </mat-card-content>
        </mat-card>

        <!-- Case Notes card -->
        <mat-card class="notes-card">
          <mat-card-header>
            <mat-card-title>Case Notes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="note-input-row">
              <mat-form-field appearance="outline" class="note-field">
                <mat-label>Add a note...</mat-label>
                <textarea matInput rows="2"
                          [value]="newNote()"
                          (input)="newNote.set($any($event.target).value)"
                          aria-label="Case note text"></textarea>
              </mat-form-field>
              <button mat-raised-button color="primary"
                      (click)="saveNote()"
                      [disabled]="!newNote().trim() || addingNote()">
                Add
              </button>
            </div>
            @if (notes().length === 0) {
              <p class="empty-msg">No notes yet.</p>
            } @else {
              @for (note of notes(); track note.id) {
                <div class="note-item">
                  <p class="note-content">{{ note.content }}</p>
                  <span class="note-date">{{ formatDate(note.created_at) }}</span>
                </div>
              }
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .detail-page { max-width: 600px; margin: 0 auto; padding: 24px 16px; display: flex; flex-direction: column; gap: 16px; }
    .detail-header { display: flex; align-items: center; gap: 8px; }
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
    .card-actions { margin-left: auto; }
    .court-display { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #1976d2; }
    .court-date-value { font-weight: 600; }
    .court-location { color: #666; }
    .court-input-row { display: flex; gap: 12px; align-items: flex-start; flex-wrap: wrap; }
    .date-field { flex: 1; min-width: 140px; }
    .location-field { flex: 2; min-width: 160px; }
    .doc-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
    .doc-name { font-size: 0.85rem; }
    .note-input-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 8px; }
    .note-field { flex: 1; }
    .note-item { border-left: 3px solid #1976d2; padding: 6px 10px; margin: 6px 0; background: #f5f5f5; border-radius: 0 4px 4px 0; }
    .note-content { margin: 0 0 2px; font-size: 0.9rem; }
    .note-date { font-size: 0.72rem; color: #999; }
    .empty-msg { color: #999; font-size: 0.85rem; margin: 8px 0; }
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

  // Notes
  notes = signal<CaseNote[]>([]);
  newNote = signal('');
  addingNote = signal(false);

  // Court date
  courtDate = signal<CourtDate | null>(null);
  courtDateInput = signal('');
  courtLocation = signal('');
  settingCourtDate = signal(false);

  // Upload
  uploading = signal(false);

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
    this.loadNotes();
    this.loadCourtDate();
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

  private loadNotes(): void {
    this.attorneyService.getCaseNotes(this.caseId()).subscribe({
      next: (r) => this.notes.set(r.notes ?? []),
      error: () => {},
    });
  }

  private loadCourtDate(): void {
    this.attorneyService.getCourtDate(this.caseId()).subscribe({
      next: (r) => this.courtDate.set(r.court_date),
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

  saveNote(): void {
    const content = this.newNote().trim();
    if (!content) return;
    this.addingNote.set(true);
    this.attorneyService.addNote(this.caseId(), content).subscribe({
      next: (r) => {
        this.notes.update(notes => [r.note, ...notes]);
        this.newNote.set('');
        this.addingNote.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to add note.', 'Close', { duration: 3000 });
        this.addingNote.set(false);
      },
    });
  }

  saveCourtDate(): void {
    if (!this.courtDateInput()) return;
    this.settingCourtDate.set(true);
    this.attorneyService.setCourtDate(this.caseId(), this.courtDateInput(), this.courtLocation() || undefined).subscribe({
      next: () => {
        this.courtDate.set({ court_date: this.courtDateInput(), location: this.courtLocation() || undefined });
        this.snackBar.open('Court date saved.', 'Close', { duration: 3000 });
        this.settingCourtDate.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to save court date.', 'Close', { duration: 3000 });
        this.settingCourtDate.set(false);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.attorneyService.uploadDocument(this.caseId(), file).subscribe({
      next: (r) => {
        this.documents.update(docs => [...docs, r.document]);
        this.snackBar.open('Document uploaded.', 'Close', { duration: 3000 });
        this.uploading.set(false);
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to upload document.', 'Close', { duration: 3000 });
        this.uploading.set(false);
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

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  goBack(): void {
    this.router.navigate(['/attorney/dashboard']);
  }
}

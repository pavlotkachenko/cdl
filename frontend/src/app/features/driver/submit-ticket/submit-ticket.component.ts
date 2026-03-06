import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CaseService } from '../../../core/services/case.service';
import { OcrService, OCRResult } from '../../../core/services/ocr.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

@Component({
  selector: 'app-submit-ticket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule,
  ],
  template: `
    @if (submitted()) {
      <mat-card class="success-card">
        <mat-card-content>
          <mat-icon class="success-icon" aria-hidden="true">check_circle</mat-icon>
          <h2>Ticket Submitted!</h2>
          <p>Case <strong>{{ ticketId() }}</strong> has been created.<br>An attorney will review it shortly.</p>
          <div class="success-actions">
            <button mat-raised-button color="primary" (click)="viewTicket()">View Case</button>
            <button mat-button (click)="submitAnother()">Submit Another</button>
          </div>
        </mat-card-content>
      </mat-card>
    } @else {
      <div class="wizard-page">
        <h1 class="page-title">Submit a Ticket</h1>

        <mat-stepper [linear]="true" orientation="horizontal">

          <!-- Step 0: Scan (OCR — optional) -->
          <mat-step label="Scan">
            <div class="step-content">
              <p class="step-desc">
                Upload a photo of your ticket to auto-fill the form, or skip to enter details manually.
              </p>
              <div class="upload-area">
                <input #scanInput type="file" hidden
                       accept=".pdf,.jpg,.jpeg,.png"
                       (change)="onScanFileSelected($event)" />
                <button mat-stroked-button (click)="scanInput.click()" [disabled]="scanning()">
                  <mat-icon>upload</mat-icon> Choose Ticket Image
                </button>
                @if (ticketFile()) {
                  <div class="selected-file">
                    <mat-icon aria-hidden="true">description</mat-icon>
                    <span>{{ ticketFile()!.name }}</span>
                  </div>
                }
              </div>

              @if (scanning()) {
                <div class="scanning-row">
                  <mat-spinner diameter="20"></mat-spinner>
                  <span>Scanning ticket&hellip;</span>
                </div>
              }

              @if (ocrResult()) {
                <div class="ocr-banner" role="status">
                  <mat-icon aria-hidden="true" class="ocr-ok">check_circle</mat-icon>
                  <span>Auto-filled {{ ocrFieldCount() }} field(s) — review in Step 3</span>
                </div>
              }

              <div class="step-nav">
                <button mat-raised-button color="primary" matStepperNext>
                  {{ ocrResult() ? 'Next →' : 'Skip' }}
                </button>
              </div>
            </div>
          </mat-step>

          <!-- Step 1: Violation Type -->
          <mat-step label="Type" [stepControl]="ticketTypeForm">
            <form [formGroup]="ticketTypeForm">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Violation Type *</mat-label>
                <mat-select formControlName="type">
                  @for (t of TICKET_TYPES; track t.value) {
                    <mat-option [value]="t.value">{{ t.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <div class="step-nav">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" matStepperNext
                        [disabled]="ticketTypeForm.invalid">
                  Next
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 2: Details -->
          <mat-step label="Details" [stepControl]="ticketDetailsForm">
            <form [formGroup]="ticketDetailsForm">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Citation Number</mat-label>
                  <input matInput formControlName="citationNumber" autocomplete="off" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Violation Date *</mat-label>
                  <input matInput type="date" formControlName="violationDate" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>State *</mat-label>
                  <mat-select formControlName="state">
                    @for (s of STATES; track s) {
                      <mat-option [value]="s">{{ s }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Court Date</mat-label>
                  <input matInput type="date" formControlName="courtDate" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Location *</mat-label>
                  <input matInput formControlName="location" placeholder="City, Highway or Intersection" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Description *</mat-label>
                  <textarea matInput formControlName="description" rows="3"
                            placeholder="Describe what happened (min. 10 characters)"></textarea>
                </mat-form-field>
              </div>
              <div class="step-nav">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary" matStepperNext
                        [disabled]="ticketDetailsForm.invalid">
                  Next
                </button>
              </div>
            </form>
          </mat-step>

          <!-- Step 3: Documents & Submit -->
          <mat-step label="Submit">
            <div class="step-content">
              <p class="step-desc">Attach supporting documents (optional).</p>

              @for (file of uploadedFiles(); track file.name; let i = $index) {
                <div class="file-item">
                  <mat-icon aria-hidden="true">description</mat-icon>
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ getFileSize(file.size) }}</span>
                  <button mat-icon-button (click)="removeFile(i)" [attr.aria-label]="'Remove ' + file.name">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }

              <div class="attach-row">
                <input #docInput type="file" hidden multiple
                       accept=".pdf,.jpg,.jpeg,.png"
                       (change)="onFileSelected($event)" />
                <button mat-stroked-button (click)="docInput.click()">
                  <mat-icon>attach_file</mat-icon> Add Documents
                </button>
              </div>

              @if (error()) {
                <p class="error-msg" role="alert">{{ error() }}</p>
              }

              <div class="step-nav">
                <button mat-button matStepperPrevious>Back</button>
                <button mat-raised-button color="primary"
                        (click)="submitTicket()"
                        [disabled]="submitting()">
                  @if (submitting()) { Submitting&hellip; } @else { Submit Ticket }
                </button>
              </div>
            </div>
          </mat-step>

        </mat-stepper>
      </div>
    }
  `,
  styles: [`
    .wizard-page { max-width: 640px; margin: 0 auto; padding: 24px 16px; }
    .page-title { margin: 0 0 20px; font-size: 1.4rem; }
    .step-content { padding-top: 12px; }
    .step-desc { margin: 0 0 16px; color: #555; }
    .upload-area { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
    .selected-file { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #444; }
    .scanning-row { display: flex; align-items: center; gap: 10px; margin: 10px 0; color: #1976d2; }
    .ocr-banner { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #e8f5e9; border-radius: 4px; margin: 10px 0; }
    .ocr-ok { color: #388e3c; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; padding-top: 12px; }
    .full-width { grid-column: span 2; }
    .file-item { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
    .file-name { flex: 1; font-size: 0.85rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-size { font-size: 0.72rem; color: #888; white-space: nowrap; }
    .attach-row { margin: 8px 0 16px; }
    .error-msg { color: #c62828; font-size: 0.85rem; margin: 8px 0; }
    .step-nav { display: flex; gap: 12px; padding-top: 16px; }
    .success-card { max-width: 480px; margin: 48px auto; text-align: center; }
    .success-card mat-card-content { padding: 32px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
    .success-icon { font-size: 64px; width: 64px; height: 64px; color: #388e3c; }
    .success-card h2 { margin: 0; font-size: 1.5rem; }
    .success-card p { margin: 0; color: #555; }
    .success-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
    @media (max-width: 480px) {
      .form-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: span 1; }
    }
  `],
})
export class SubmitTicketComponent implements OnInit {
  private fb = inject(FormBuilder);
  private caseService = inject(CaseService);
  private ocrService = inject(OcrService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  readonly TICKET_TYPES = [
    { value: 'speeding', label: 'Speeding Violation' },
    { value: 'cdl_violation', label: 'CDL Violation' },
    { value: 'traffic', label: 'Traffic Violation' },
    { value: 'accident', label: 'Accident' },
    { value: 'parking', label: 'Parking Violation' },
    { value: 'weight_station', label: 'Weight Station Issue' },
    { value: 'logbook', label: 'Logbook Violation' },
    { value: 'other', label: 'Other' },
  ];

  readonly STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  ];

  ticketTypeForm = this.fb.group({ type: ['', Validators.required] });

  ticketDetailsForm = this.fb.group({
    citationNumber: [''],
    violationDate: ['', Validators.required],
    state: ['', Validators.required],
    location: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    courtDate: [''],
  });

  // OCR state
  ticketFile = signal<File | null>(null);
  ocrResult = signal<OCRResult | null>(null);
  scanning = signal(false);
  ocrConfidence = signal(0);
  ocrFieldCount = computed(() => {
    const d = this.ocrResult()?.extractedData;
    if (!d) return 0;
    return [d.ticketNumber, d.violationDate, d.state, d.location, d.courtDate].filter(Boolean).length;
  });

  // Documents
  uploadedFiles = signal<File[]>([]);

  // Submission
  submitting = signal(false);
  submitted = signal(false);
  ticketId = signal('');
  error = signal('');

  ngOnInit(): void {}

  onScanFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.ticketFile.set(file);
    this.scanning.set(true);
    this.ocrResult.set(null);
    this.ocrService.processTicketImage(file).subscribe({
      next: (result) => {
        this.ocrResult.set(result);
        this.ocrConfidence.set(result.confidence);
        this.scanning.set(false);
        this.applyOcrResults(result);
      },
      error: () => {
        this.scanning.set(false);
        this.snackBar.open(
          'Could not scan ticket. Please fill in details manually.',
          'Close', { duration: 4000 },
        );
      },
    });
  }

  applyOcrResults(result: OCRResult): void {
    const d = result.extractedData;
    const patch: Record<string, string> = {};
    if (d.ticketNumber) patch['citationNumber'] = d.ticketNumber;
    if (d.violationDate) patch['violationDate'] = d.violationDate;
    if (d.state) patch['state'] = d.state;
    if (d.location) patch['location'] = d.location;
    if (d.courtDate) patch['courtDate'] = d.courtDate;
    this.ticketDetailsForm.patchValue(patch);
  }

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files) return;
    const current = this.uploadedFiles();
    const toAdd: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        this.snackBar.open(`${file.name} exceeds 10 MB limit.`, 'Close', { duration: 3000 });
        continue;
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        this.snackBar.open(`${file.name}: only PDF, JPG, PNG allowed.`, 'Close', { duration: 3000 });
        continue;
      }
      toAdd.push(file);
    }
    if (toAdd.length) this.uploadedFiles.set([...current, ...toAdd]);
  }

  removeFile(index: number): void {
    this.uploadedFiles.update(files => files.filter((_, i) => i !== index));
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  submitTicket(): void {
    if (this.ticketTypeForm.invalid || this.ticketDetailsForm.invalid) {
      this.error.set('Please fill in all required fields.');
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    const payload = {
      type: this.ticketTypeForm.value.type,
      ...this.ticketDetailsForm.value,
      status: 'submitted',
    };
    this.caseService.createCase(payload).subscribe({
      next: (response: any) => {
        this.ticketId.set(response.id ?? response.data?.id ?? 'TCK-NEW');
        this.submitted.set(true);
        this.submitting.set(false);
      },
      error: () => {
        this.error.set('Failed to submit ticket. Please try again.');
        this.submitting.set(false);
      },
    });
  }

  viewTicket(): void {
    this.router.navigate(['/driver/tickets', this.ticketId()]);
  }

  submitAnother(): void {
    this.submitted.set(false);
    this.ticketTypeForm.reset();
    this.ticketDetailsForm.reset();
    this.uploadedFiles.set([]);
    this.ocrResult.set(null);
    this.ticketFile.set(null);
    this.error.set('');
    this.ticketId.set('');
  }

  goToDashboard(): void {
    this.router.navigate(['/driver/dashboard']);
  }
}

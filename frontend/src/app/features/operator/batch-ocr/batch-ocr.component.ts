import {
  Component, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of, finalize } from 'rxjs';

import { CaseService } from '../../../core/services/case.service';

export interface OcrResult {
  filename: string;
  success: boolean;
  data?: {
    violation_type: string | null;
    violation_date: string | null;
    state: string | null;
    county: string | null;
    fine_amount: number | null;
    court_date: string | null;
    citation_number: string | null;
    confidence: number;
  };
  error?: string;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

@Component({
  selector: 'app-batch-ocr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, CurrencyPipe, DecimalPipe,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressBarModule, MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="batch-header">
      <button mat-icon-button (click)="goBack()" [attr.aria-label]="'OPR.OCR.BACK' | translate">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1>{{ 'OPR.OCR.TITLE' | translate }}</h1>
    </div>

    <!-- Upload zone -->
    <mat-card appearance="outlined" class="upload-card">
      <div class="drop-zone" role="region" [attr.aria-label]="'OPR.OCR.DROP_ZONE' | translate"
           [class.drop-active]="dragOver()"
           (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)" (click)="fileInput.click()"
           (keydown.enter)="fileInput.click()" (keydown.space)="fileInput.click()"
           tabindex="0">
        <mat-icon class="upload-icon">cloud_upload</mat-icon>
        <p>{{ 'OPR.OCR.DROP_HINT' | translate }}</p>
        <p class="drop-sub">{{ 'OPR.OCR.DROP_SUB' | translate }}</p>
        <input #fileInput type="file" hidden multiple
               accept="image/jpeg,image/png,application/pdf"
               data-cy="file-input"
               (change)="onFilesSelected($event)" />
      </div>
    </mat-card>

    <!-- File list -->
    @if (files().length > 0) {
      <mat-card appearance="outlined" class="files-card">
        <mat-card-header>
          <mat-card-title>{{ 'OPR.OCR.SELECTED_FILES' | translate }} ({{ files().length }}/{{ maxFiles }})</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <ul class="file-list" role="list">
            @for (file of files(); track file.name + '-' + $index) {
              <li class="file-item" data-cy="file-item">
                <mat-icon class="file-icon">insert_drive_file</mat-icon>
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatSize(file.size) }}</span>
                <button mat-icon-button (click)="removeFile($index)"
                        [attr.aria-label]="'OPR.OCR.REMOVE' | translate"
                        [disabled]="processing()">
                  <mat-icon>close</mat-icon>
                </button>
              </li>
            }
          </ul>
        </mat-card-content>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="processAll()"
                  [disabled]="processing() || files().length === 0"
                  class="process-btn" data-cy="process-all-btn">
            @if (processing()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              <mat-icon>auto_fix_high</mat-icon>
            }
            {{ 'OPR.OCR.PROCESS_ALL' | translate }} ({{ files().length }})
          </button>
        </mat-card-actions>
      </mat-card>
    }

    <!-- Progress -->
    @if (processing()) {
      <mat-progress-bar mode="determinate" [value]="progressPercent()" class="ocr-progress"
                        role="progressbar" [attr.aria-valuenow]="progressPercent()"
                        aria-valuemin="0" aria-valuemax="100"></mat-progress-bar>
    }

    <!-- Error -->
    @if (error()) {
      <div class="ocr-error" role="alert">
        <mat-icon>error_outline</mat-icon>
        <span>{{ error() }}</span>
      </div>
    }

    <!-- Results -->
    @if (results().length > 0) {
      <mat-card appearance="outlined" class="results-card">
        <mat-card-header>
          <mat-card-title>{{ 'OPR.OCR.RESULTS' | translate }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <!-- Summary bar -->
          <div class="summary-bar" role="status" data-cy="ocr-summary">
            <span class="summary-total">{{ summary().total }} {{ 'OPR.OCR.PROCESSED' | translate }}:</span>
            <span class="summary-success">{{ summary().successful }} {{ 'OPR.OCR.SUCCESSFUL' | translate }}</span>
            <span class="summary-separator">,</span>
            <span class="summary-failed">{{ summary().failed }} {{ 'OPR.OCR.FAILED' | translate }}</span>
          </div>

          <!-- Per-file results -->
          <div class="result-list">
            @for (result of results(); track result.filename) {
              <div class="result-item" data-cy="ocr-result" [class.result-success]="result.success"
                   [class.result-failure]="!result.success">
                <div class="result-header">
                  @if (result.success) {
                    <mat-icon class="result-icon success-icon" data-cy="result-status">check_circle</mat-icon>
                  } @else {
                    <mat-icon class="result-icon failure-icon" data-cy="result-status">cancel</mat-icon>
                  }
                  <span class="result-filename">{{ result.filename }}</span>
                  @if (result.data?.confidence; as conf) {
                    <span class="confidence-badge">{{ conf | number:'1.0-0' }}%</span>
                  }
                </div>

                @if (result.success && result.data) {
                  <dl class="result-fields">
                    @if (result.data.violation_type) {
                      <div class="field-row">
                        <dt>{{ 'OPR.OCR.VIOLATION' | translate }}</dt>
                        <dd>{{ result.data.violation_type }}</dd>
                      </div>
                    }
                    @if (result.data.violation_date) {
                      <div class="field-row">
                        <dt>{{ 'OPR.OCR.DATE' | translate }}</dt>
                        <dd>{{ result.data.violation_date }}</dd>
                      </div>
                    }
                    @if (result.data.state) {
                      <div class="field-row">
                        <dt>{{ 'OPR.OCR.STATE' | translate }}</dt>
                        <dd>{{ result.data.state }}</dd>
                      </div>
                    }
                    @if (result.data.fine_amount != null) {
                      <div class="field-row">
                        <dt>{{ 'OPR.OCR.FINE' | translate }}</dt>
                        <dd>{{ result.data.fine_amount | currency:'USD':'symbol':'1.0-0' }}</dd>
                      </div>
                    }
                    @if (result.data.court_date) {
                      <div class="field-row">
                        <dt>{{ 'OPR.OCR.COURT_DATE' | translate }}</dt>
                        <dd>{{ result.data.court_date }}</dd>
                      </div>
                    }
                  </dl>
                }

                @if (!result.success) {
                  <p class="result-error">{{ result.error }}</p>
                }
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    :host { display: block; padding: 16px; max-width: 900px; margin: 0 auto; }

    .batch-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .batch-header h1 { font-size: 1.25rem; font-weight: 600; margin: 0; }

    .upload-card { margin-bottom: 16px; }
    .drop-zone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 48px 16px; border: 2px dashed #bdbdbd; border-radius: 8px; cursor: pointer;
      transition: border-color 0.2s, background 0.2s; text-align: center;
    }
    .drop-zone:hover, .drop-zone:focus { border-color: #1976D2; background: #f5f9ff; }
    .drop-active { border-color: #1976D2; background: #e3f2fd; }
    .upload-icon { font-size: 48px; width: 48px; height: 48px; color: #1976D2; margin-bottom: 8px; }
    .drop-sub { font-size: 0.85rem; color: #888; margin: 4px 0 0; }

    .files-card { margin-bottom: 16px; }
    .file-list { list-style: none; padding: 0; margin: 0; }
    .file-item {
      display: flex; align-items: center; gap: 8px; padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .file-item:last-child { border-bottom: none; }
    .file-icon { color: #757575; }
    .file-name { flex: 1; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-size { font-size: 0.8rem; color: #999; flex-shrink: 0; }
    .process-btn { min-height: 44px; }

    .ocr-progress { margin: 12px 0; }
    .ocr-error {
      display: flex; align-items: center; gap: 8px; padding: 12px; margin-bottom: 16px;
      background: #ffebee; border-radius: 8px; color: #c62828;
    }

    .results-card { margin-bottom: 16px; }
    .summary-bar {
      display: flex; align-items: center; gap: 6px; padding: 12px; margin-bottom: 12px;
      background: #f5f5f5; border-radius: 8px; font-weight: 500;
    }
    .summary-success { color: #2e7d32; }
    .summary-failed { color: #c62828; }
    .summary-separator { color: #999; }

    .result-list { display: flex; flex-direction: column; gap: 12px; }
    .result-item {
      padding: 12px; border-radius: 8px; border: 1px solid #e0e0e0;
    }
    .result-success { border-left: 4px solid #4caf50; }
    .result-failure { border-left: 4px solid #ef5350; background: #fff8f7; }
    .result-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .result-icon { flex-shrink: 0; }
    .success-icon { color: #4caf50; }
    .failure-icon { color: #ef5350; }
    .result-filename { font-weight: 500; flex: 1; }
    .confidence-badge {
      font-size: 0.8rem; font-weight: 600; padding: 2px 8px; border-radius: 12px;
      background: #e8f5e9; color: #2e7d32;
    }

    .result-fields { margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
    .field-row { display: flex; gap: 8px; }
    .field-row dt { font-weight: 500; color: #666; min-width: 80px; }
    .field-row dd { margin: 0; }
    .result-error { color: #c62828; font-size: 0.9rem; margin: 4px 0 0; }

    @media (max-width: 600px) {
      .result-fields { grid-template-columns: 1fr; }
    }
  `],
})
export class BatchOcrComponent {
  private caseService = inject(CaseService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  files = signal<File[]>([]);
  processing = signal(false);
  progress = signal(0);
  results = signal<OcrResult[]>([]);
  error = signal('');
  dragOver = signal(false);

  maxFiles = MAX_FILES;

  progressPercent = () => {
    const total = this.files().length;
    return total > 0 ? Math.round((this.progress() / total) * 100) : 0;
  };

  summary = () => {
    const r = this.results();
    const successful = r.filter(x => x.success).length;
    return { total: r.length, successful, failed: r.length - successful };
  };

  goBack(): void {
    this.router.navigate(['/operator/dashboard']);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const dropped = event.dataTransfer?.files;
    if (dropped) this.addFiles(Array.from(dropped));
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  removeFile(index: number): void {
    this.files.update(f => f.filter((_, i) => i !== index));
  }

  processAll(): void {
    if (this.processing() || this.files().length === 0) return;

    this.processing.set(true);
    this.progress.set(0);
    this.results.set([]);
    this.error.set('');

    this.caseService.batchOcr(this.files()).pipe(
      finalize(() => this.processing.set(false)),
      catchError(err => {
        this.error.set(err?.error?.error?.message || 'Batch OCR processing failed');
        return of(null);
      }),
    ).subscribe(result => {
      if (result?.data || result?.results) {
        const data = result.data ?? result;
        this.results.set(data.results || []);
        this.progress.set(this.files().length);
        this.snackBar.open(
          `Processed ${data.summary?.total ?? 0} files: ${data.summary?.successful ?? 0} successful`,
          'OK',
          { duration: 4000 },
        );
      }
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private addFiles(incoming: File[]): void {
    const current = this.files();
    const valid: File[] = [];

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      if (current.length + valid.length >= MAX_FILES) break;
      valid.push(file);
    }

    if (valid.length > 0) {
      this.files.update(f => [...f, ...valid]);
    }
  }
}

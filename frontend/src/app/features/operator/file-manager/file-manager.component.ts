import {
  Component, ChangeDetectionStrategy, inject, input, signal, OnInit, ElementRef, viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { catchError, of, finalize } from 'rxjs';

import { CaseService } from '../../../core/services/case.service';

export interface CaseFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url?: string;
  signed_url?: string;
  uploaded_by?: string;
  uploader_name?: string;
  created_at: string;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED = '.jpg,.jpeg,.png,.pdf,.heic';
const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];

@Component({
  selector: 'app-file-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, MatIconModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatTooltipModule, A11yModule, TranslateModule, DatePipe,
  ],
  template: `
    <!-- Header -->
    <div class="fm-header">
      <h3 class="fm-title">
        {{ 'OPR.FILES.TITLE' | translate }}
        @if (files().length > 0) {
          <span class="file-count">({{ files().length }})</span>
        }
      </h3>
      @if (!readonly()) {
        <button mat-stroked-button (click)="fileInputRef().nativeElement.click()" class="upload-btn"
                [disabled]="uploading()">
          <mat-icon>upload_file</mat-icon>
          {{ 'OPR.FILES.UPLOAD' | translate }}
        </button>
        <input #fileInput type="file" [accept]="accepted" (change)="onFileSelected($event)"
               class="hidden-input" aria-hidden="true">
      }
    </div>

    <!-- Upload zone (drag-and-drop) -->
    @if (!readonly()) {
      <div class="drop-zone"
           [class.drag-active]="dragActive()"
           role="button"
           tabindex="0"
           [attr.aria-label]="'OPR.FILES.DROP_HINT' | translate"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave()"
           (drop)="onDrop($event)"
           (click)="fileInputRef().nativeElement.click()"
           (keydown.enter)="fileInputRef().nativeElement.click()"
           (keydown.space)="fileInputRef().nativeElement.click(); $event.preventDefault()">
        <mat-icon class="drop-icon">cloud_upload</mat-icon>
        <span>{{ 'OPR.FILES.DROP_HINT' | translate }}</span>
        <span class="drop-sub">{{ 'OPR.FILES.DROP_SUB' | translate }}</span>
      </div>
    }

    @if (uploading()) {
      <mat-progress-bar mode="indeterminate" class="upload-bar"></mat-progress-bar>
    }

    @if (uploadError()) {
      <p class="upload-error" role="alert">{{ uploadError() }}</p>
    }

    <!-- Loading -->
    @if (loading()) {
      <div class="fm-loading" role="status">
        <mat-spinner diameter="32"></mat-spinner>
      </div>
    }

    <!-- File list -->
    @if (!loading() && files().length > 0) {
      <div class="file-grid">
        @for (f of files(); track f.id) {
          <div class="file-card">
            <div class="file-thumb" (click)="preview(f)">
              @if (isImage(f)) {
                <img [src]="f.signed_url || f.file_url" [alt]="f.file_name" class="thumb-img" loading="lazy">
              } @else if (isPdf(f)) {
                <mat-icon class="thumb-icon pdf-icon">picture_as_pdf</mat-icon>
              } @else {
                <mat-icon class="thumb-icon">insert_drive_file</mat-icon>
              }
            </div>
            <div class="file-info">
              <span class="file-name" [matTooltip]="f.file_name">{{ truncateName(f.file_name) }}</span>
              <span class="file-meta">
                <span class="file-type-badge">{{ getExtension(f.file_name) }}</span>
                {{ f.created_at | date:'shortDate' }}
              </span>
            </div>
            <div class="file-actions">
              <button mat-icon-button (click)="preview(f)" [matTooltip]="'OPR.FILES.PREVIEW' | translate"
                      [attr.aria-label]="'OPR.FILES.PREVIEW' | translate">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button (click)="download(f)" [matTooltip]="'OPR.FILES.DOWNLOAD' | translate"
                      [attr.aria-label]="'OPR.FILES.DOWNLOAD' | translate">
                <mat-icon>download</mat-icon>
              </button>
              @if (!readonly() && canDelete(f)) {
                <button mat-icon-button (click)="confirmDelete(f)" [matTooltip]="'OPR.FILES.DELETE' | translate"
                        [attr.aria-label]="'OPR.FILES.DELETE' | translate" class="delete-btn">
                  <mat-icon>delete</mat-icon>
                </button>
              }
            </div>
          </div>
        }
      </div>
    }

    @if (!loading() && files().length === 0) {
      <p class="empty-text">{{ 'OPR.FILES.EMPTY' | translate }}</p>
    }

    <!-- Preview overlay -->
    @if (previewFile()) {
      <div class="preview-overlay" (click)="closePreview()" (keydown.escape)="closePreview()"
           role="dialog" aria-modal="true" [attr.aria-label]="'OPR.FILES.PREVIEW' | translate">
        <div class="preview-content" (click)="$event.stopPropagation()" cdkTrapFocus>
          <button mat-icon-button class="preview-close" (click)="closePreview()"
                  [attr.aria-label]="'OPR.FILES.CLOSE' | translate" autofocus>
            <mat-icon>close</mat-icon>
          </button>
          @if (isImage(previewFile()!)) {
            <img [src]="previewFile()!.signed_url || previewFile()!.file_url"
                 [alt]="previewFile()!.file_name" class="preview-img">
          } @else if (isPdf(previewFile()!)) {
            <iframe [src]="previewFile()!.signed_url || previewFile()!.file_url"
                    class="preview-pdf" [title]="previewFile()!.file_name"></iframe>
          } @else {
            <div class="preview-unsupported">
              <mat-icon>visibility_off</mat-icon>
              <p>{{ 'OPR.FILES.PREVIEW_UNSUPPORTED' | translate }}</p>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .fm-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
    .fm-title { font-size: 1.1rem; font-weight: 600; margin: 0; flex: 1; }
    .file-count { color: #888; font-weight: 400; }
    .upload-btn { min-height: 44px; min-width: 44px; }
    .hidden-input { display: none; }

    /* Drop zone */
    .drop-zone {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; padding: 24px; border: 2px dashed #ccc; border-radius: 8px;
      cursor: pointer; text-align: center; color: #888; margin-bottom: 12px;
      transition: border-color 0.2s, background 0.2s;
    }
    .drop-zone:hover, .drop-zone:focus-visible { border-color: #1976D2; background: #E3F2FD; }
    .drag-active { border-color: #1976D2; background: #BBDEFB; }
    .drop-icon { font-size: 36px; width: 36px; height: 36px; color: #90CAF9; }
    .drop-sub { font-size: 0.8rem; color: #757575; }

    .upload-bar { margin-bottom: 12px; }
    .upload-error { color: #C62828; background: #FFEBEE; padding: 8px 12px; border-radius: 4px; font-size: 0.9rem; margin-bottom: 12px; }

    .fm-loading { display: flex; justify-content: center; padding: 24px; }

    /* File grid */
    .file-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .file-card {
      display: flex; align-items: center; gap: 12px; padding: 10px;
      border: 1px solid #e0e0e0; border-radius: 8px; background: #fafafa;
    }
    .file-thumb {
      width: 48px; height: 48px; flex-shrink: 0; display: flex; align-items: center;
      justify-content: center; border-radius: 4px; overflow: hidden; background: #f5f5f5;
      cursor: pointer;
    }
    .thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .thumb-icon { font-size: 28px; width: 28px; height: 28px; color: #90CAF9; }
    .pdf-icon { color: #E53935; }

    .file-info { flex: 1; min-width: 0; }
    .file-name { display: block; font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-meta { font-size: 0.8rem; color: #888; display: flex; gap: 6px; align-items: center; }
    .file-type-badge {
      background: #e0e0e0; padding: 1px 6px; border-radius: 4px;
      font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
    }

    .file-actions { display: flex; flex-shrink: 0; }
    .delete-btn { color: #E53935; }

    .empty-text { color: #757575; font-style: italic; text-align: center; padding: 24px; }

    /* Preview overlay */
    .preview-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .preview-content { position: relative; max-width: 90vw; max-height: 90vh; }
    .preview-close { position: absolute; top: -40px; right: 0; color: #fff; }
    .preview-img { max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 4px; }
    .preview-pdf { width: 80vw; height: 80vh; border: none; border-radius: 4px; }
    .preview-unsupported {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      color: #fff; padding: 48px;
    }
    .preview-unsupported mat-icon { font-size: 48px; width: 48px; height: 48px; }

    @media (max-width: 768px) {
      .file-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class FileManagerComponent implements OnInit {
  caseId = input.required<string>();
  readonly = input(false);
  currentUserId = input<string>('');

  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  fileInputRef = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  files = signal<CaseFile[]>([]);
  loading = signal(true);
  uploading = signal(false);
  uploadError = signal('');
  dragActive = signal(false);
  previewFile = signal<CaseFile | null>(null);

  accepted = ACCEPTED;

  ngOnInit(): void {
    this.loadFiles();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(true);
  }

  onDragLeave(): void {
    this.dragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.uploadFile(file);
    input.value = ''; // reset so same file can be re-selected
  }

  preview(f: CaseFile): void {
    this.previewFile.set(f);
  }

  closePreview(): void {
    this.previewFile.set(null);
  }

  download(f: CaseFile): void {
    const url = f.signed_url || f.file_url;
    if (url) {
      window.open(url, '_blank');
    }
  }

  confirmDelete(f: CaseFile): void {
    // Simple confirm — could use MatDialog for richer UX
    const confirmed = window.confirm(`Delete "${f.file_name}"? This cannot be undone.`);
    if (confirmed) {
      this.caseService.deleteDocument(this.caseId(), f.id).pipe(
        catchError(() => {
          this.snackBar.open(this.translate.instant('OPR.FILES.DELETE_FAILED'), 'OK', { duration: 3000 });
          return of(null);
        }),
      ).subscribe(result => {
        if (result !== null) {
          this.files.update(list => list.filter(x => x.id !== f.id));
          this.snackBar.open(this.translate.instant('OPR.FILES.DELETED'), 'OK', { duration: 2000 });
        }
      });
    }
  }

  canDelete(f: CaseFile): boolean {
    return !this.currentUserId() || f.uploaded_by === this.currentUserId();
  }

  isImage(f: CaseFile): boolean {
    return IMAGE_TYPES.includes(f.file_type) || /\.(jpg|jpeg|png)$/i.test(f.file_name);
  }

  isPdf(f: CaseFile): boolean {
    return f.file_type === 'application/pdf' || /\.pdf$/i.test(f.file_name);
  }

  truncateName(name: string): string {
    return name.length > 25 ? name.slice(0, 22) + '...' : name;
  }

  getExtension(name: string): string {
    return name.split('.').pop()?.toUpperCase() || '';
  }

  private loadFiles(): void {
    this.loading.set(true);
    this.caseService.listDocuments(this.caseId()).pipe(
      finalize(() => this.loading.set(false)),
      catchError(() => of({ documents: [] })),
    ).subscribe(res => {
      this.files.set(res.documents || []);
    });
  }

  private uploadFile(file: File): void {
    if (file.size > MAX_SIZE) {
      this.uploadError.set(this.translate.instant('OPR.FILES.SIZE_EXCEEDED'));
      return;
    }
    this.uploadError.set('');
    this.uploading.set(true);

    this.caseService.uploadDocument(this.caseId(), file).pipe(
      finalize(() => this.uploading.set(false)),
      catchError(err => {
        this.uploadError.set(err?.error?.error?.message || this.translate.instant('OPR.FILES.UPLOAD_FAILED'));
        return of(null);
      }),
    ).subscribe(result => {
      if (result) {
        this.files.update(list => [result, ...list]);
        this.snackBar.open(this.translate.instant('OPR.FILES.UPLOADED'), 'OK', { duration: 2000 });
      }
    });
  }
}

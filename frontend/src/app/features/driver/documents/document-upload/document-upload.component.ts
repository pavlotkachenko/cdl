import {
  Component, signal, inject, ChangeDetectionStrategy,
  input, output,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  DocumentService, DocumentCategory, Document,
} from '../../../../core/services/document.service';

interface CategoryOption {
  value: DocumentCategory;
  label: string;
}

@Component({
  selector: 'app-document-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatProgressSpinnerModule],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss',
})
export class DocumentUploadComponent {
  private fb = inject(FormBuilder);
  private documentService = inject(DocumentService);
  private snackBar = inject(MatSnackBar);

  readonly caseId = input.required<string>();
  readonly uploaded = output<Document[]>();
  readonly closePanel = output<void>();

  readonly isDragging = signal(false);
  readonly selectedFiles = signal<File[]>([]);
  readonly uploading = signal(false);

  readonly CATEGORIES: CategoryOption[] = [
    { value: 'citation', label: '\u{1F4C4} Citation' },
    { value: 'evidence', label: '\u{1F4F7} Evidence' },
    { value: 'correspondence', label: '\u{1F464} Attorney Correspondence' },
    { value: 'legal_document', label: '\u{2696}\uFE0F Court Document' },
    { value: 'photo', label: '\u{1F4F7} Photo' },
    { value: 'receipt', label: '\u{1F9FE} Receipt' },
    { value: 'license', label: '\u{1F4CB} License' },
    { value: 'other', label: '\u{1F4C1} Other' },
  ];

  uploadForm = this.fb.group({
    category: ['citation' as string, Validators.required],
    description: [''],
  });

  // --- Drag & Drop ---

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  // --- File Selection ---

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
      input.value = '';
    }
  }

  private handleFiles(files: File[]): void {
    const current = this.selectedFiles();
    const toAdd: File[] = [];

    for (const file of files) {
      const validation = this.documentService.validateFile(file);
      if (!validation.valid) {
        this.snackBar.open(validation.error!, 'Close', { duration: 4000 });
        continue;
      }
      if (current.length + toAdd.length >= 10) {
        this.snackBar.open('Maximum 10 files allowed.', 'Close', { duration: 3000 });
        break;
      }
      toAdd.push(file);
    }
    if (toAdd.length) {
      this.selectedFiles.set([...current, ...toAdd]);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  clearAll(): void {
    this.selectedFiles.set([]);
  }

  getFileEmoji(file: File): string {
    const type = file.type;
    if (type.startsWith('image/')) return '\u{1F4F7}';
    if (type === 'application/pdf') return '\u{1F4C4}';
    if (type.includes('word') || type.includes('document')) return '\u{1F4DD}';
    return '\u{1F4CB}';
  }

  getFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  // --- Upload ---

  async onUpload(): Promise<void> {
    if (this.uploadForm.invalid || this.selectedFiles().length === 0) return;

    this.uploading.set(true);
    const { category, description } = this.uploadForm.value;

    try {
      const uploadPromises = this.selectedFiles().map(file =>
        new Promise<Document>((resolve, reject) => {
          this.documentService.mockUploadDocument(
            file, this.caseId(), category as DocumentCategory, description || undefined,
          ).subscribe({ next: resolve, error: reject });
        }),
      );

      const docs = await Promise.all(uploadPromises);
      this.uploaded.emit(docs);
      this.clearAll();
      this.uploadForm.reset({ category: 'citation' });
    } catch {
      this.snackBar.open('Upload failed. Please try again.', 'Close', { duration: 4000 });
    } finally {
      this.uploading.set(false);
    }
  }
}

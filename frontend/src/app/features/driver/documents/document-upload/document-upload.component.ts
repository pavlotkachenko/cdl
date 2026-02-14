// ============================================
// Document Upload Component
// Location: frontend/src/app/features/driver/documents/document-upload/document-upload.component.ts
// ============================================

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { DocumentService, DocumentCategory, Document } from '../../../../core/services/document.service';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSnackBarModule
  ]
})
export class DocumentUploadComponent implements OnInit {
  @Input() caseId!: string;
  @Output() uploaded = new EventEmitter<Document[]>();

  uploadForm!: FormGroup;
  selectedFiles: File[] = [];
  isDragging = false;
  uploading = false;
  uploadProgress: { [key: string]: number } = {};

  categories: { value: DocumentCategory; label: string; icon: string }[] = [
    { value: 'citation', label: 'Citation', icon: 'gavel' },
    { value: 'evidence', label: 'Evidence', icon: 'fact_check' },
    { value: 'correspondence', label: 'Correspondence', icon: 'mail' },
    { value: 'legal_document', label: 'Legal Document', icon: 'description' },
    { value: 'photo', label: 'Photo', icon: 'photo_camera' },
    { value: 'receipt', label: 'Receipt', icon: 'receipt' },
    { value: 'license', label: 'License', icon: 'badge' },
    { value: 'other', label: 'Other', icon: 'folder' }
  ];

  constructor(
    private fb: FormBuilder,
    private documentService: DocumentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.uploadForm = this.fb.group({
      category: ['citation', Validators.required],
      description: ['']
    });
  }

  // ============================================
  // Drag and Drop Handlers
  // ============================================

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  // ============================================
  // File Selection
  // ============================================

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  private handleFiles(files: File[]): void {
    // Validate each file
    const validFiles: File[] = [];
    
    for (const file of files) {
      const validation = this.documentService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        this.snackBar.open(validation.error!, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    }

    // Add valid files to selection
    this.selectedFiles = [...this.selectedFiles, ...validFiles];
  }

  // ============================================
  // File Management
  // ============================================

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  clearAll(): void {
    this.selectedFiles = [];
    this.uploadProgress = {};
  }

  getFileIcon(file: File): string {
    return this.documentService.getFileIcon(file.type);
  }

  getFileSize(file: File): string {
    return this.documentService.formatFileSize(file.size);
  }

  // ============================================
  // Upload
  // ============================================

  async onUpload(): Promise<void> {
    if (this.uploadForm.invalid || this.selectedFiles.length === 0) {
      return;
    }

    this.uploading = true;
    const { category, description } = this.uploadForm.value;

    try {
      // Upload all files
      const uploadPromises = this.selectedFiles.map((file, index) => {
        return new Promise<Document>((resolve, reject) => {
          // Use mock upload for development
          this.documentService.mockUploadDocument(file, this.caseId, category, description)
            .subscribe({
              next: (doc) => {
                this.uploadProgress[file.name] = 100;
                resolve(doc);
              },
              error: (err) => {
                this.snackBar.open(`Failed to upload ${file.name}`, 'Close', {
                  duration: 5000,
                  panelClass: ['error-snackbar']
                });
                reject(err);
              }
            });
        });
      });

      const uploadedDocs = await Promise.all(uploadPromises);

      this.snackBar.open(
        `Successfully uploaded ${uploadedDocs.length} file(s)`,
        'Close',
        {
          duration: 3000,
          panelClass: ['success-snackbar']
        }
      );

      // Emit uploaded documents
      this.uploaded.emit(uploadedDocs);

      // Reset
      this.clearAll();
      this.uploadForm.reset({ category: 'citation' });

    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      this.uploading = false;
    }

    /*
    // Use this for production with real backend:
    this.documentService.uploadDocuments(
      this.selectedFiles,
      this.caseId,
      category,
      description
    ).subscribe({
      next: (docs) => {
        this.snackBar.open(`Uploaded ${docs.length} file(s) successfully`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.uploaded.emit(docs);
        this.clearAll();
        this.uploadForm.reset({ category: 'citation' });
      },
      error: (err) => {
        this.snackBar.open('Upload failed', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.uploading = false;
      }
    });
    */
  }
}

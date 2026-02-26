// ============================================
// FILE UPLOAD COMPONENT - Complete Implementation
// Location: frontend/src/app/shared/components/file-upload/file-upload.component.ts
// ============================================

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';

// Angular Material
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { FileService, UploadProgress } from '../../../core/services/file.service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatListModule,
    MatTooltipModule,
    MatSnackBarModule
  ]
})
export class FileUploadComponent implements OnInit {
  @Input() caseId?: string;
  @Input() multiple: boolean = true;
  @Input() maxFiles: number = 5;
  @Output() filesUploaded = new EventEmitter<any[]>();
  @Output() uploadError = new EventEmitter<string>();

  files: UploadProgress[] = [];
  dragOver: boolean = false;
  uploading: boolean = false;

  constructor(
    public fileService: FileService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('✅ FileUploadComponent initialized');
  }

  // ============================================
  // Handle file selection
  // ============================================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
    // Reset input
    input.value = '';
  }

  // ============================================
  // Handle drag over
  // ============================================
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  // ============================================
  // Handle drag leave
  // ============================================
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  // ============================================
  // Handle file drop
  // ============================================
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  // ============================================
  // Handle files (validation and upload)
  // ============================================
  private handleFiles(fileList: File[]): void {
    // Check max files limit
    if (this.files.length + fileList.length > this.maxFiles) {
      this.snackBar.open(
        `Maximum ${this.maxFiles} files allowed`,
        'Close',
        { duration: 3000, panelClass: ['error-snackbar'] }
      );
      return;
    }

    // Validate and add files
    const validFiles: File[] = [];
    
    for (const file of fileList) {
      const validation = this.fileService.validateFile(file);
      
      if (validation.valid) {
        validFiles.push(file);
        this.files.push({
          file,
          progress: 0,
          status: 'pending'
        });
      } else {
        this.snackBar.open(
          `${file.name}: ${validation.error}`,
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    }

    // Upload valid files
    if (validFiles.length > 0) {
      this.uploadFiles();
    }
  }

  // ============================================
  // Upload files
  // ============================================
  private uploadFiles(): void {
    this.uploading = true;

    const pendingFiles = this.files.filter(f => f.status === 'pending');

    pendingFiles.forEach((fileProgress, index) => {
      fileProgress.status = 'uploading';

      this.fileService.uploadFile(fileProgress.file, this.caseId).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress && event.total) {
            // Update progress
            fileProgress.progress = Math.round((100 * event.loaded) / event.total);
          } else if (event.type === HttpEventType.Response) {
            // Upload complete
            fileProgress.status = 'complete';
            fileProgress.progress = 100;

            console.log('✅ File uploaded:', event.body);

            // Check if all uploads are complete
            this.checkUploadComplete();
          }
        },
        error: (error) => {
          console.error('❌ Upload error:', error);
          fileProgress.status = 'error';
          fileProgress.error = error.error?.message || 'Upload failed';

          this.snackBar.open(
            `Failed to upload ${fileProgress.file.name}`,
            'Close',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );

          // Check if all uploads are complete
          this.checkUploadComplete();
        }
      });
    });
  }

  // ============================================
  // Check if all uploads are complete
  // ============================================
  private checkUploadComplete(): void {
    const allComplete = this.files.every(
      f => f.status === 'complete' || f.status === 'error'
    );

    if (allComplete) {
      this.uploading = false;

      const successfulUploads = this.files.filter(f => f.status === 'complete');
      
      if (successfulUploads.length > 0) {
        this.snackBar.open(
          `${successfulUploads.length} file(s) uploaded successfully`,
          'Close',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );

        this.filesUploaded.emit(successfulUploads.map(f => f.file));
      }
    }
  }

  // ============================================
  // Remove file from list
  // ============================================
  removeFile(index: number): void {
    this.files.splice(index, 1);
  }

  // ============================================
  // Clear all files
  // ============================================
  clearFiles(): void {
    this.files = [];
  }

  // ============================================
  // Retry failed upload
  // ============================================
  retryUpload(index: number): void {
    const fileProgress = this.files[index];
    if (fileProgress.status === 'error') {
      fileProgress.status = 'pending';
      fileProgress.progress = 0;
      fileProgress.error = undefined;
      this.uploadFiles();
    }
  }

  // ============================================
  // Get file icon
  // ============================================
  getFileIcon(file: File): string {
    return this.fileService.getFileIcon(file.type);
  }

  // ============================================
  // Format file size
  // ============================================
  formatFileSize(bytes: number): string {
    return this.fileService.formatFileSize(bytes);
  }

  // ============================================
  // Get progress color
  // ============================================
  getProgressColor(status: string): string {
    switch (status) {
      case 'uploading':
        return 'primary';
      case 'complete':
        return 'accent';
      case 'error':
        return 'warn';
      default:
        return 'primary';
    }
  }

  // ============================================
  // Trigger file input click
  // ============================================
  triggerFileInput(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }
}

// ============================================
// FILE GALLERY COMPONENT - Complete Implementation
// Location: frontend/src/app/shared/components/file-gallery/file-gallery.component.ts
// ============================================

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { FileService, FileUpload } from '../../../core/services/file.service';

@Component({
  selector: 'app-file-gallery',
  standalone: true,
  templateUrl: './file-gallery.component.html',
  styleUrls: ['./file-gallery.component.scss'],
  imports: [
    CommonModule,
    MatGridListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule
  ]
})
export class FileGalleryComponent implements OnInit {
  @Input() caseId?: string;
  @Input() files: FileUpload[] = [];
  @Output() fileDeleted = new EventEmitter<string>();
  @Output() fileDownloaded = new EventEmitter<FileUpload>();

  filteredFiles: FileUpload[] = [];
  selectedFilter: string = 'all';
  loading: boolean = false;

  filterOptions = [
    { label: 'All Files', value: 'all', icon: 'folder' },
    { label: 'Images', value: 'images', icon: 'image' },
    { label: 'Documents', value: 'documents', icon: 'description' }
  ];

  constructor(
    private fileService: FileService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  // ============================================
  // Load files
  // ============================================
  loadFiles(): void {
    if (this.caseId) {
      this.loading = true;
      this.fileService.getCaseFiles(this.caseId).subscribe({
        next: (response) => {
          this.files = response.files;
          this.applyFilter(this.selectedFilter);
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Load files error:', error);
          this.loading = false;
          this.snackBar.open('Failed to load files', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.applyFilter(this.selectedFilter);
    }
  }

  // ============================================
  // Apply filter
  // ============================================
  applyFilter(filterValue: string): void {
    this.selectedFilter = filterValue;

    switch (filterValue) {
      case 'images':
        this.filteredFiles = this.files.filter(f => this.fileService.isImage(f.fileType));
        break;
      case 'documents':
        this.filteredFiles = this.files.filter(f => !this.fileService.isImage(f.fileType));
        break;
      default:
        this.filteredFiles = [...this.files];
    }
  }

  // ============================================
  // Download file
  // ============================================
  downloadFile(file: FileUpload): void {
    this.fileService.downloadFileWithName(file.id, file.fileName);
    this.fileDownloaded.emit(file);

    this.snackBar.open(`Downloading ${file.fileName}`, 'Close', {
      duration: 2000
    });
  }

  // ============================================
  // Delete file
  // ============================================
  deleteFile(file: FileUpload): void {
    if (!confirm(`Are you sure you want to delete ${file.fileName}?`)) {
      return;
    }

    this.fileService.deleteFile(file.id).subscribe({
      next: () => {
        this.files = this.files.filter(f => f.id !== file.id);
        this.applyFilter(this.selectedFilter);
        this.fileDeleted.emit(file.id);

        this.snackBar.open('File deleted successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (error) => {
        console.error('❌ Delete file error:', error);
        this.snackBar.open('Failed to delete file', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // ============================================
  // View file (open in new tab)
  // ============================================
  viewFile(file: FileUpload): void {
    window.open(file.fileUrl, '_blank');
  }

  // ============================================
  // Get file icon
  // ============================================
  getFileIcon(fileType: string): string {
    return this.fileService.getFileIcon(fileType);
  }

  // ============================================
  // Check if file is image
  // ============================================
  isImage(fileType: string): boolean {
    return this.fileService.isImage(fileType);
  }

  // ============================================
  // Format file size
  // ============================================
  formatFileSize(bytes: number): string {
    return this.fileService.formatFileSize(bytes);
  }

  // ============================================
  // Get file extension
  // ============================================
  getFileExtension(fileName: string): string {
    return this.fileService.getFileExtension(fileName);
  }

  // ============================================
  // Format date
  // ============================================
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ============================================
  // Get grid columns based on screen size
  // ============================================
  getGridCols(): number {
    if (window.innerWidth < 600) return 1;
    if (window.innerWidth < 960) return 2;
    if (window.innerWidth < 1280) return 3;
    return 4;
  }
}

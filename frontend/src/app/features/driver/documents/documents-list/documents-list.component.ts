// ============================================
// Documents List Component
// Location: frontend/src/app/features/driver/documents/documents-list/documents-list.component.ts
// ============================================

import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

// Services & Models
import { DocumentService, Document, DocumentCategory } from '../../../../core/services/document.service';

@Component({
  selector: 'app-documents-list',
  standalone: true,
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ]
})
export class DocumentsListComponent implements OnInit {
  @Input() caseId!: string;
  @Output() documentSelected = new EventEmitter<Document>();

  documents: Document[] = [];
  filteredDocuments: Document[] = [];
  loading = false;
  viewMode: 'grid' | 'list' = 'grid';

  // Filters
  searchTerm = '';
  selectedCategory: DocumentCategory | 'all' = 'all';
  sortBy: 'date' | 'name' | 'size' | 'category' = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  categories: { value: DocumentCategory | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: 'All Documents', icon: 'folder_open' },
    { value: 'citation', label: 'Citations', icon: 'gavel' },
    { value: 'evidence', label: 'Evidence', icon: 'fact_check' },
    { value: 'correspondence', label: 'Correspondence', icon: 'mail' },
    { value: 'legal_document', label: 'Legal Documents', icon: 'description' },
    { value: 'photo', label: 'Photos', icon: 'photo_camera' },
    { value: 'receipt', label: 'Receipts', icon: 'receipt' },
    { value: 'license', label: 'Licenses', icon: 'badge' },
    { value: 'other', label: 'Other', icon: 'folder' }
  ];

  constructor(
    private documentService: DocumentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  // ============================================
  // Data Loading
  // ============================================

  loadDocuments(): void {
    this.loading = true;

    // Use mock data for development
    this.documentService.mockGetDocuments(this.caseId).subscribe({
      next: (docs) => {
        this.documents = docs;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        this.loading = false;
        this.snackBar.open('Failed to load documents', 'Close', {
          duration: 5000
        });
      }
    });

    /*
    // Use this for production:
    this.documentService.getDocuments(this.caseId).subscribe({
      next: (docs) => {
        this.documents = docs;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading documents:', err);
        this.loading = false;
      }
    });
    */
  }

  // ============================================
  // Filtering & Sorting
  // ============================================

  applyFilters(): void {
    let filtered = [...this.documents];

    // Filter by category
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === this.selectedCategory);
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.fileName.toLowerCase().includes(term) ||
        doc.description?.toLowerCase().includes(term) ||
        doc.category.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered = this.sortDocuments(filtered);

    this.filteredDocuments = filtered;
  }

  private sortDocuments(docs: Document[]): Document[] {
    return docs.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'name':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  // ============================================
  // Document Actions
  // ============================================

  viewDocument(doc: Document): void {
    this.documentSelected.emit(doc);
    // Open preview modal (to be implemented)
    console.log('View document:', doc);
  }

  downloadDocument(doc: Document): void {
    // Download file
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.fileName;
    link.click();

    this.snackBar.open(`Downloading ${doc.fileName}`, 'Close', {
      duration: 3000
    });
  }

  deleteDocument(doc: Document): void {
    if (confirm(`Are you sure you want to delete ${doc.fileName}?`)) {
      this.documentService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.documents = this.documents.filter(d => d.id !== doc.id);
          this.applyFilters();
          this.snackBar.open('Document deleted', 'Close', {
            duration: 3000
          });
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.snackBar.open('Failed to delete document', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  extractText(doc: Document): void {
    this.snackBar.open('Extracting text...', '', { duration: 2000 });
    
    this.documentService.extractText(doc.id).subscribe({
      next: (text) => {
        console.log('Extracted text:', text);
        this.snackBar.open('Text extracted successfully', 'Close', {
          duration: 3000
        });
      },
      error: (err) => {
        console.error('OCR error:', err);
        this.snackBar.open('Failed to extract text', 'Close', {
          duration: 5000
        });
      }
    });
  }

  shareDocument(doc: Document): void {
    // Copy link to clipboard
    navigator.clipboard.writeText(doc.url).then(() => {
      this.snackBar.open('Link copied to clipboard', 'Close', {
        duration: 3000
      });
    });
  }

  // ============================================
  // Utilities
  // ============================================

  getFileIcon(doc: Document): string {
    return this.documentService.getFileIcon(doc.fileType);
  }

  getFileSize(doc: Document): string {
    return this.documentService.formatFileSize(doc.fileSize);
  }

  getCategoryLabel(category: DocumentCategory): string {
    return this.documentService.getCategoryLabel(category);
  }

  getCategoryIcon(category: DocumentCategory): string {
    return this.documentService.getCategoryIcon(category);
  }

  isImage(doc: Document): boolean {
    return doc.fileType.startsWith('image/');
  }

  isPDF(doc: Document): boolean {
    return doc.fileType === 'application/pdf';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getDocumentCount(category: DocumentCategory | 'all'): number {
    if (category === 'all') {
      return this.documents.length;
    }
    return this.documents.filter(doc => doc.category === category).length;
  }
}

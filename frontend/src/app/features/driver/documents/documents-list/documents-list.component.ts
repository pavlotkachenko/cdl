import {
  Component, signal, computed, inject, effect,
  ChangeDetectionStrategy, input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import {
  DocumentService, Document, DocumentCategory,
} from '../../../../core/services/document.service';

type SortField = 'date' | 'name' | 'size' | 'category';
type ViewMode = 'grid' | 'list';

interface CategoryFilter {
  value: DocumentCategory | 'all';
  label: string;
}

@Component({
  selector: 'app-documents-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatProgressSpinnerModule],
  templateUrl: './documents-list.component.html',
  styleUrl: './documents-list.component.scss',
})
export class DocumentsListComponent {
  private documentService = inject(DocumentService);
  private snackBar = inject(MatSnackBar);

  readonly caseId = input.required<string>();
  readonly refreshTrigger = input(0);

  // State
  readonly documents = signal<Document[]>([]);
  readonly loading = signal(false);
  readonly viewMode = signal<ViewMode>('grid');
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<DocumentCategory | 'all'>('all');
  readonly sortBy = signal<SortField>('date');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  readonly CATEGORIES: CategoryFilter[] = [
    { value: 'all', label: 'All Documents' },
    { value: 'citation', label: 'Citation' },
    { value: 'evidence', label: 'Evidence' },
    { value: 'correspondence', label: 'Correspondence' },
    { value: 'legal_document', label: 'Court Documents' },
    { value: 'photo', label: 'Photos' },
    { value: 'receipt', label: 'Receipts' },
    { value: 'license', label: 'Licenses' },
    { value: 'other', label: 'Other' },
  ];

  readonly SORT_OPTIONS: { value: SortField; label: string }[] = [
    { value: 'date', label: 'Date' },
    { value: 'name', label: 'Name' },
    { value: 'size', label: 'Size' },
    { value: 'category', label: 'Category' },
  ];

  // Computed filtered + sorted list
  readonly filteredDocuments = computed(() => {
    let docs = [...this.documents()];
    const cat = this.selectedCategory();
    const term = this.searchTerm().toLowerCase();
    const sort = this.sortBy();
    const dir = this.sortDirection();

    if (cat !== 'all') {
      docs = docs.filter(d => d.category === cat);
    }

    if (term) {
      docs = docs.filter(d =>
        d.fileName.toLowerCase().includes(term) ||
        d.description?.toLowerCase().includes(term) ||
        d.category.toLowerCase().includes(term),
      );
    }

    docs.sort((a, b) => {
      let cmp = 0;
      switch (sort) {
        case 'date':
          cmp = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'name':
          cmp = a.fileName.localeCompare(b.fileName);
          break;
        case 'size':
          cmp = a.fileSize - b.fileSize;
          break;
        case 'category':
          cmp = a.category.localeCompare(b.category);
          break;
      }
      return dir === 'asc' ? cmp : -cmp;
    });

    return docs;
  });

  readonly documentCount = computed(() => this.documents().length);

  readonly categoryCountLabel = computed(() => {
    const cat = this.selectedCategory();
    const count = this.filteredDocuments().length;
    if (cat === 'all') {
      return `All Documents (${count})`;
    }
    const found = this.CATEGORIES.find(c => c.value === cat);
    return `${found?.label ?? cat} (${count})`;
  });

  constructor() {
    effect(() => {
      const id = this.caseId();
      this.refreshTrigger(); // track
      this.loadDocuments(id);
    });
  }

  private loadDocuments(caseId: string): void {
    this.loading.set(true);
    this.documentService.mockGetDocuments(caseId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to load documents', 'Close', { duration: 4000 });
      },
    });
  }

  // --- Actions ---

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
  }

  onCategoryChange(value: string): void {
    this.selectedCategory.set(value as DocumentCategory | 'all');
  }

  onSortChange(value: string): void {
    this.sortBy.set(value as SortField);
  }

  toggleSortDirection(): void {
    this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  downloadDocument(doc: Document): void {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.fileName;
    link.click();
    this.snackBar.open(`Downloading ${doc.fileName}`, 'Close', { duration: 3000 });
  }

  deleteDocument(doc: Document): void {
    if (confirm(`Delete ${doc.fileName}?`)) {
      this.documentService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.documents.update(docs => docs.filter(d => d.id !== doc.id));
          this.snackBar.open('Document deleted', 'Close', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Failed to delete document', 'Close', { duration: 4000 });
        },
      });
    }
  }

  // --- Utilities ---

  getFileSize(bytes: number): string {
    return this.documentService.formatFileSize(bytes);
  }

  getCategoryLabel(category: DocumentCategory): string {
    return this.documentService.getCategoryLabel(category);
  }

  getCategoryBadgeClass(category: DocumentCategory): string {
    const map: Record<string, string> = {
      citation: 'cat-citation',
      evidence: 'cat-evidence',
      legal_document: 'cat-court',
      correspondence: 'cat-court',
      photo: 'cat-evidence',
      receipt: 'cat-other',
      license: 'cat-other',
      other: 'cat-other',
    };
    return map[category] || 'cat-other';
  }

  getCategoryEmoji(category: DocumentCategory): string {
    const map: Record<string, string> = {
      citation: '\u{1F4C4}',
      evidence: '\u{1F4F7}',
      correspondence: '\u{1F464}',
      legal_document: '\u{2696}\uFE0F',
      photo: '\u{1F4F7}',
      receipt: '\u{1F9FE}',
      license: '\u{1F4CB}',
      other: '\u{1F4C1}',
    };
    return map[category] || '\u{1F4C1}';
  }

  getTypeStripeGradient(category: DocumentCategory): string {
    const map: Record<string, string> = {
      citation: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
      evidence: 'linear-gradient(90deg, #10b981, #34d399)',
      correspondence: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
      legal_document: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
      photo: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
      receipt: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
      license: 'linear-gradient(90deg, #10b981, #34d399)',
      other: 'linear-gradient(90deg, #6b7280, #9ca3af)',
    };
    return map[category] || map['other'];
  }

  getThumbBackground(category: DocumentCategory): string {
    const map: Record<string, string> = {
      citation: '#eff6ff',
      evidence: '#f0fdf4',
      correspondence: '#f5f3ff',
      legal_document: '#f5f3ff',
      photo: '#ecfeff',
      receipt: '#fffbeb',
      license: '#f0fdf4',
      other: '#f9fafb',
    };
    return map[category] || '#f9fafb';
  }

  getFileIconBg(category: DocumentCategory): string {
    return this.getThumbBackground(category);
  }

  getFileEmoji(doc: Document): string {
    if (doc.fileType.startsWith('image/')) return '\u{1F4F7}';
    if (doc.fileType === 'application/pdf') return '\u{1F4C4}';
    if (doc.fileType.includes('word') || doc.fileType.includes('document')) return '\u{1F4DD}';
    return '\u{1F4CB}';
  }

  getFileExtLabel(doc: Document): string {
    const ext = doc.fileName.split('.').pop()?.toUpperCase() || '';
    const map: Record<string, string> = {
      JPG: 'JPEG Image', JPEG: 'JPEG Image', PNG: 'PNG Image',
      GIF: 'GIF Image', WEBP: 'WebP Image', HEIC: 'HEIC Image',
      PDF: 'PDF Document', DOC: 'Word Document', DOCX: 'Word Document',
      TXT: 'Text File', CSV: 'CSV File',
    };
    return map[ext] || `${ext} File`;
  }

  isImage(doc: Document): boolean {
    return doc.fileType.startsWith('image/');
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return '1 month ago';
    if (diffMonths < 12) return `${diffMonths} months ago`;
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  }
}

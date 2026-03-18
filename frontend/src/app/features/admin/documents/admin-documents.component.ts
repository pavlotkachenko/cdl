import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { catchError, of } from 'rxjs';

import { environment } from '../../../../environments/environment';

interface AdminDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'image' | 'zip';
  size: string;
  date: string;
  category: string;
}

@Component({
  selector: 'app-admin-documents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DatePipe,
    UpperCasePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="documents-page">
      <header class="page-header">
        <h1>{{ 'ADMIN.DOCUMENTS' | translate }}</h1>
        <div class="header-actions">
          <button mat-icon-button
                  (click)="showSearch.set(!showSearch())"
                  [attr.aria-label]="'ADMIN.TOGGLE_SEARCH' | translate"
                  [class.active-toggle]="showSearch()">
            <mat-icon>{{ showSearch() ? 'search_off' : 'search' }}</mat-icon>
          </button>
          <button mat-raised-button color="primary">
            <mat-icon>upload_file</mat-icon>
            {{ 'ADMIN.UPLOAD_DOCUMENT' | translate }}
          </button>
        </div>
      </header>

      @if (showSearch()) {
        <div class="search-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>{{ 'ADMIN.SEARCH_DOCUMENTS' | translate }}</mat-label>
            <input matInput
                   [ngModel]="searchTerm()"
                   (ngModelChange)="searchTerm.set($event)"
                   [placeholder]="'ADMIN.SEARCH_PLACEHOLDER' | translate" />
            <mat-icon matPrefix>search</mat-icon>
            @if (searchTerm()) {
              <button matSuffix mat-icon-button (click)="searchTerm.set('')" aria-label="Clear search">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
        </div>
      }

      <!-- Category filters -->
      <div class="category-chips" role="group" aria-label="Filter by category">
        @for (cat of categories; track cat.value) {
          <button mat-stroked-button
                  [class.active-filter]="activeCategory() === cat.value"
                  (click)="activeCategory.set(cat.value)">
            {{ cat.key | translate }}
          </button>
        }
      </div>

      @if (filteredDocs().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">folder_open</mat-icon>
          <p>{{ 'ADMIN.NO_DOCUMENTS' | translate }}</p>
        </div>
      } @else {
        <div class="doc-grid" role="list">
          @for (doc of filteredDocs(); track doc.id) {
            <mat-card class="doc-card" role="listitem">
              <mat-card-content>
                <div class="doc-row">
                  <div class="doc-icon" [class]="'type-' + doc.type">
                    <mat-icon aria-hidden="true">
                      @switch (doc.type) {
                        @case ('pdf') { picture_as_pdf }
                        @case ('docx') { description }
                        @case ('xlsx') { grid_on }
                        @case ('csv') { table_chart }
                        @case ('image') { image }
                        @case ('zip') { folder_zip }
                      }
                    </mat-icon>
                  </div>
                  <div class="doc-info">
                    <p class="doc-name">{{ doc.name }}</p>
                    <p class="doc-meta">
                      {{ doc.type | uppercase }} &bull;
                      {{ doc.size }} &bull;
                      {{ doc.date | date:'mediumDate' }} &bull;
                      {{ doc.category }}
                    </p>
                  </div>
                  <button mat-icon-button
                          [attr.aria-label]="('ADMIN.DOWNLOAD' | translate) + ' ' + doc.name">
                    <mat-icon>download</mat-icon>
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .documents-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 16px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .active-toggle { color: #1976d2; }

    .search-bar {
      margin-bottom: 16px;
    }

    .search-field {
      width: 100%;
    }

    .category-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .active-filter {
      background: #1976d2;
      color: #fff;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 64px 16px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .doc-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .doc-card {
      transition: box-shadow 0.2s ease;
    }

    .doc-card:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .doc-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .doc-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .doc-icon.type-pdf { background: #ffebee; }
    .doc-icon.type-pdf mat-icon { color: #c62828; }

    .doc-icon.type-docx { background: #e3f2fd; }
    .doc-icon.type-docx mat-icon { color: #1565c0; }

    .doc-icon.type-xlsx { background: #e8f5e9; }
    .doc-icon.type-xlsx mat-icon { color: #2e7d32; }

    .doc-icon.type-csv { background: #e0f2f1; }
    .doc-icon.type-csv mat-icon { color: #00695c; }

    .doc-icon.type-image { background: #fff8e1; }
    .doc-icon.type-image mat-icon { color: #f57f17; }

    .doc-icon.type-zip { background: #f3e5f5; }
    .doc-icon.type-zip mat-icon { color: #7b1fa2; }

    .doc-info {
      flex: 1;
      min-width: 0;
    }

    .doc-name {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .doc-meta {
      margin: 2px 0 0;
      font-size: 0.75rem;
      color: #999;
    }

    @media (max-width: 480px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .doc-name {
        white-space: normal;
      }
    }
  `],
})
export class AdminDocumentsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  documents = signal<AdminDocument[]>([]);
  loading = signal(false);
  activeCategory = signal('All');
  showSearch = signal(false);
  searchTerm = signal('');

  categories: { value: string; key: string }[] = [
    { value: 'All', key: 'ADMIN.CAT_ALL' },
    { value: 'Legal', key: 'ADMIN.CAT_LEGAL' },
    { value: 'Court Filings', key: 'ADMIN.CAT_COURT_FILINGS' },
    { value: 'Client Documents', key: 'ADMIN.CAT_CLIENT_DOCS' },
    { value: 'Internal', key: 'ADMIN.CAT_INTERNAL' },
    { value: 'Templates', key: 'ADMIN.CAT_TEMPLATES' },
  ];

  filteredDocs = computed(() => {
    const cat = this.activeCategory();
    const term = this.searchTerm().toLowerCase().trim();
    let docs = cat === 'All'
      ? this.documents()
      : this.documents().filter(d => d.category === cat);
    if (term) {
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(term) ||
        d.category.toLowerCase().includes(term) ||
        d.type.toLowerCase().includes(term),
      );
    }
    return docs;
  });

  ngOnInit(): void {
    this.loadDocuments();
  }

  private loadDocuments(): void {
    this.loading.set(true);
    this.http.get<{ files: Array<{ id: string; file_name: string; file_type: string; file_size: number; created_at: string; category?: string }> }>(
      `${this.apiUrl}/admin/documents`
    ).pipe(
      catchError(() => of({ files: [] as Array<{ id: string; file_name: string; file_type: string; file_size: number; created_at: string; category?: string }> })),
    ).subscribe({
      next: (response) => {
        const docs: AdminDocument[] = (response.files || []).map(f => ({
          id: f.id,
          name: f.file_name,
          type: this.mapFileType(f.file_type || f.file_name),
          size: this.formatFileSize(f.file_size),
          date: f.created_at ? f.created_at.split('T')[0] : '',
          category: f.category || 'General',
        }));
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => {
        this.documents.set([]);
        this.loading.set(false);
      },
    });
  }

  private mapFileType(typeOrName: string): AdminDocument['type'] {
    const lower = typeOrName.toLowerCase();
    if (lower.includes('pdf') || lower.endsWith('.pdf')) return 'pdf';
    if (lower.includes('doc') || lower.endsWith('.docx') || lower.endsWith('.doc')) return 'docx';
    if (lower.includes('xls') || lower.endsWith('.xlsx') || lower.endsWith('.xls')) return 'xlsx';
    if (lower.includes('csv') || lower.endsWith('.csv')) return 'csv';
    if (lower.includes('zip') || lower.endsWith('.zip') || lower.endsWith('.rar')) return 'zip';
    if (lower.includes('image') || lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg')) return 'image';
    return 'pdf';
  }

  private formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return `${size.toFixed(size < 10 ? 1 : 0)} ${units[i]}`;
  }
}

import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { AttorneyService, CaseDocument } from '../../../core/services/attorney.service';

interface AttorneyDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'image' | 'zip';
  size: string;
  date: string;
  category: string;
}

@Component({
  selector: 'app-attorney-documents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    UpperCasePipe,
    FormsModule,
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
        <h1>{{ 'ATT.DOCUMENTS' | translate }}</h1>
        <button mat-raised-button color="primary">
          <mat-icon>upload_file</mat-icon>
          {{ 'ATT.UPLOAD_DOCUMENT' | translate }}
        </button>
      </header>

      <!-- Search -->
      <div class="search-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-icon matPrefix>search</mat-icon>
          <input matInput
                 [placeholder]="'ATT.SEARCH_DOCUMENTS' | translate"
                 [ngModel]="searchTerm()"
                 (ngModelChange)="searchTerm.set($event)"
                 aria-label="Search documents" />
          @if (searchTerm()) {
            <button matSuffix mat-icon-button (click)="searchTerm.set('')" aria-label="Clear search">
              <mat-icon>close</mat-icon>
            </button>
          }
        </mat-form-field>
      </div>

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
          <p>{{ 'ATT.NO_DOCUMENTS' | translate }}</p>
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
                          [attr.aria-label]="('ATT.DOWNLOAD' | translate) + ' ' + doc.name">
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
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .search-bar {
      margin-bottom: 16px;
    }

    .search-field {
      width: 100%;
    }

    .search-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
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
export class AttorneyDocumentsComponent implements OnInit {
  private readonly attorneyService = inject(AttorneyService);

  documents = signal<AttorneyDocument[]>([]);
  loading = signal(true);
  activeCategory = signal('All');
  searchTerm = signal('');

  categories: { value: string; key: string }[] = [
    { value: 'All', key: 'ATT.CAT_ALL' },
    { value: 'Case Files', key: 'ATT.CAT_CASE_FILES' },
    { value: 'Court Filings', key: 'ATT.CAT_COURT_FILINGS' },
    { value: 'Client Documents', key: 'ATT.CAT_CLIENT_DOCS' },
    { value: 'Templates', key: 'ATT.CAT_TEMPLATES' },
    { value: 'Correspondence', key: 'ATT.CAT_CORRESPONDENCE' },
  ];

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.attorneyService.getMyCases().pipe(
      catchError(() => of({ cases: [] })),
      switchMap(r => {
        const cases = r.cases ?? [];
        if (cases.length === 0) {
          return of([] as CaseDocument[][]);
        }
        const docRequests = cases.map(c =>
          this.attorneyService.getDocuments(c.id).pipe(
            catchError(() => of({ documents: [] as CaseDocument[] })),
          ),
        );
        return forkJoin(docRequests).pipe(
          catchError(() => of([] as { documents: CaseDocument[] }[])),
        );
      }),
    ).subscribe(results => {
      const allDocs: AttorneyDocument[] = [];
      for (const result of results) {
        const docs = (result as { documents: CaseDocument[] }).documents ?? [];
        for (const doc of docs) {
          allDocs.push({
            id: doc.id,
            name: doc.file_name,
            type: this.mapFileType(doc.file_type),
            size: this.formatFileSize(doc.file_size),
            date: doc.uploaded_at?.split('T')[0] ?? '',
            category: 'Case Files',
          });
        }
      }
      this.documents.set(allDocs);
      this.loading.set(false);
    });
  }

  private mapFileType(fileType: string): AttorneyDocument['type'] {
    const t = (fileType ?? '').toLowerCase();
    if (t.includes('pdf')) return 'pdf';
    if (t.includes('doc') || t.includes('word')) return 'docx';
    if (t.includes('xls') || t.includes('sheet')) return 'xlsx';
    if (t.includes('csv')) return 'csv';
    if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return 'image';
    if (t.includes('zip') || t.includes('archive')) return 'zip';
    return 'pdf';
  }

  private formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  filteredDocs = computed(() => {
    const cat = this.activeCategory();
    const query = this.searchTerm().toLowerCase().trim();
    let docs = cat === 'All'
      ? this.documents()
      : this.documents().filter(d => d.category === cat);
    if (query) {
      docs = docs.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.category.toLowerCase().includes(query) ||
        d.type.toLowerCase().includes(query),
      );
    }
    return docs;
  });
}

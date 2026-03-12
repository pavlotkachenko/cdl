import {
  Component, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
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

interface AdminDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'image' | 'zip';
  size: string;
  date: string;
  category: string;
}

const MOCK_DOCUMENTS: AdminDocument[] = [
  { id: 'adoc1', name: 'Case Brief - CDL-2024-001.pdf', type: 'pdf', size: '245 KB', date: '2024-02-10', category: 'Legal' },
  { id: 'adoc2', name: 'Court Filing - Smith v. State.pdf', type: 'pdf', size: '1.2 MB', date: '2024-02-08', category: 'Court Filings' },
  { id: 'adoc3', name: 'Driver License Records.xlsx', type: 'xlsx', size: '890 KB', date: '2024-02-05', category: 'Client Documents' },
  { id: 'adoc4', name: 'Monthly Revenue Report - Feb 2024.pdf', type: 'pdf', size: '3.1 MB', date: '2024-02-28', category: 'Internal' },
  { id: 'adoc5', name: 'Attorney Agreement Template.docx', type: 'docx', size: '156 KB', date: '2024-01-15', category: 'Templates' },
  { id: 'adoc6', name: 'Case Evidence Photos - CDL-2024-045.zip', type: 'zip', size: '15.4 MB', date: '2024-02-12', category: 'Legal' },
  { id: 'adoc7', name: 'Staff Performance Report Q1.pdf', type: 'pdf', size: '2.3 MB', date: '2024-03-01', category: 'Internal' },
  { id: 'adoc8', name: 'Client Intake Form Template.docx', type: 'docx', size: '89 KB', date: '2024-01-20', category: 'Templates' },
  { id: 'adoc9', name: 'Court Appearance Schedule.pdf', type: 'pdf', size: '178 KB', date: '2024-02-18', category: 'Court Filings' },
  { id: 'adoc10', name: 'Insurance Verification - Doe.pdf', type: 'pdf', size: '342 KB', date: '2024-02-22', category: 'Client Documents' },
  { id: 'adoc11', name: 'Compliance Audit Report.pdf', type: 'pdf', size: '4.5 MB', date: '2024-02-25', category: 'Internal' },
  { id: 'adoc12', name: 'Plea Agreement Draft.docx', type: 'docx', size: '234 KB', date: '2024-02-14', category: 'Legal' },
];

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
export class AdminDocumentsComponent {
  documents = signal(MOCK_DOCUMENTS);
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
}

import {
  Component, signal, computed, ChangeDetectionStrategy,
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

interface AttorneyDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx' | 'csv' | 'image' | 'zip';
  size: string;
  date: string;
  category: string;
}

const MOCK_DOCUMENTS: AttorneyDocument[] = [
  { id: 'atdoc1', name: 'Case Brief - CDL-2026-112.pdf', type: 'pdf', size: '312 KB', date: '2026-03-11', category: 'Case Files' },
  { id: 'atdoc2', name: 'Motion to Dismiss - Rivera.pdf', type: 'pdf', size: '1.4 MB', date: '2026-03-10', category: 'Court Filings' },
  { id: 'atdoc3', name: 'Plea Agreement Draft - Kowalski.docx', type: 'docx', size: '198 KB', date: '2026-03-09', category: 'Court Filings' },
  { id: 'atdoc4', name: 'Client Intake Form - David Park.docx', type: 'docx', size: '95 KB', date: '2026-03-08', category: 'Client Documents' },
  { id: 'atdoc5', name: 'Evidence Photos - CDL-2026-078.zip', type: 'zip', size: '22.7 MB', date: '2026-03-07', category: 'Case Files' },
  { id: 'atdoc6', name: 'Driver License Records - Chen.xlsx', type: 'xlsx', size: '445 KB', date: '2026-03-06', category: 'Client Documents' },
  { id: 'atdoc7', name: 'Fee Agreement Template.docx', type: 'docx', size: '78 KB', date: '2026-02-28', category: 'Templates' },
  { id: 'atdoc8', name: 'Court Filing - State v. Rivera.pdf', type: 'pdf', size: '2.1 MB', date: '2026-03-05', category: 'Court Filings' },
  { id: 'atdoc9', name: 'Case Summary - CDL-2026-045.pdf', type: 'pdf', size: '567 KB', date: '2026-03-04', category: 'Case Files' },
  { id: 'atdoc10', name: 'Client Correspondence Template.docx', type: 'docx', size: '64 KB', date: '2026-02-20', category: 'Templates' },
  { id: 'atdoc11', name: 'Speeding Ticket Dismissal Brief.pdf', type: 'pdf', size: '890 KB', date: '2026-03-03', category: 'Case Files' },
  { id: 'atdoc12', name: 'Letter to Court - CDL-2026-056.pdf', type: 'pdf', size: '234 KB', date: '2026-03-02', category: 'Correspondence' },
  { id: 'atdoc13', name: 'Insurance Verification - Kowalski.pdf', type: 'pdf', size: '178 KB', date: '2026-03-01', category: 'Client Documents' },
  { id: 'atdoc14', name: 'Discovery Response Template.docx', type: 'docx', size: '112 KB', date: '2026-02-15', category: 'Templates' },
];

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
export class AttorneyDocumentsComponent {
  documents = signal(MOCK_DOCUMENTS);
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

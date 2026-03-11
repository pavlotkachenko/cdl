import {
  Component, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'csv' | 'image';
  size: string;
  date: string;
  category: string;
}

const MOCK_DOCUMENTS: Document[] = [
  { id: 'doc1', name: 'Q1 2025 Compliance Report.pdf', type: 'pdf', size: '2.4 MB', date: '2025-03-01', category: 'Compliance' },
  { id: 'doc2', name: 'Fleet Insurance Certificate.pdf', type: 'pdf', size: '1.8 MB', date: '2025-02-15', category: 'Insurance' },
  { id: 'doc3', name: 'Driver Import - March 2025.csv', type: 'csv', size: '45 KB', date: '2025-03-05', category: 'Import' },
  { id: 'doc4', name: 'CDL-2025-0471 Ticket Photo.jpg', type: 'image', size: '3.2 MB', date: '2025-03-08', category: 'Tickets' },
  { id: 'doc5', name: 'DOT Audit Checklist.pdf', type: 'pdf', size: '890 KB', date: '2025-02-20', category: 'Compliance' },
  { id: 'doc6', name: 'Fleet Analytics Export.csv', type: 'csv', size: '128 KB', date: '2025-02-28', category: 'Reports' },
  { id: 'doc7', name: 'CDL-2025-0445 Court Notice.pdf', type: 'pdf', size: '420 KB', date: '2025-03-03', category: 'Tickets' },
  { id: 'doc8', name: 'Vehicle Maintenance Log.pdf', type: 'pdf', size: '1.1 MB', date: '2025-02-10', category: 'Maintenance' },
  { id: 'doc9', name: 'Q4 2024 Compliance Report.pdf', type: 'pdf', size: '2.1 MB', date: '2024-12-31', category: 'Compliance' },
];

@Component({
  selector: 'app-carrier-documents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatCardModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <div class="documents-page">
      <header class="page-header">
        <h1>{{ 'CARRIER.DOCUMENTS' | translate }}</h1>
        <button mat-raised-button color="primary" (click)="navigateToCompliance()">
          <mat-icon>assessment</mat-icon> {{ 'CARRIER.COMPLIANCE_REPORT' | translate }}
        </button>
      </header>

      <!-- Category filters -->
      <div class="category-chips" role="group" aria-label="Filter by category">
        @for (cat of categories; track cat.value) {
          <button mat-stroked-button [class.active-filter]="activeCategory() === cat.value"
                  (click)="activeCategory.set(cat.value)">
            {{ cat.key | translate }}
          </button>
        }
      </div>

      @if (filteredDocs().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">folder_open</mat-icon>
          <p>{{ 'CARRIER.NO_DOCUMENTS' | translate }}</p>
        </div>
      } @else {
        <div class="doc-list" role="list">
          @for (doc of filteredDocs(); track doc.id) {
            <mat-card class="doc-card" role="listitem">
              <mat-card-content>
                <div class="doc-row">
                  <div class="doc-icon" [class]="'type-' + doc.type">
                    <mat-icon aria-hidden="true">
                      @switch (doc.type) {
                        @case ('pdf') { picture_as_pdf }
                        @case ('csv') { table_chart }
                        @case ('image') { image }
                      }
                    </mat-icon>
                  </div>
                  <div class="doc-info">
                    <p class="doc-name">{{ doc.name }}</p>
                    <p class="doc-meta">{{ doc.size }} &bull; {{ doc.date | date:'mediumDate' }} &bull; {{ doc.category }}</p>
                  </div>
                  <button mat-icon-button aria-label="Download document">
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
    .documents-page { max-width: 700px; margin: 0 auto; padding: 24px 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }

    .category-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .active-filter { background: #1976d2; color: #fff; }

    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .doc-list { display: flex; flex-direction: column; gap: 8px; }
    .doc-row { display: flex; align-items: center; gap: 14px; }
    .doc-icon { width: 42px; height: 42px; border-radius: 10px; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; }
    .doc-icon.type-pdf { background: #ffebee; }
    .doc-icon.type-pdf mat-icon { color: #c62828; }
    .doc-icon.type-csv { background: #e8f5e9; }
    .doc-icon.type-csv mat-icon { color: #2e7d32; }
    .doc-icon.type-image { background: #e3f2fd; }
    .doc-icon.type-image mat-icon { color: #1565c0; }
    .doc-info { flex: 1; }
    .doc-name { margin: 0; font-size: 0.88rem; font-weight: 500; }
    .doc-meta { margin: 2px 0 0; font-size: 0.72rem; color: #999; }
  `],
})
export class CarrierDocumentsComponent {
  private router = inject(Router);

  documents = signal(MOCK_DOCUMENTS);
  activeCategory = signal('All');

  categories: { value: string; key: string }[] = [
    { value: 'All', key: 'CARRIER.CAT_ALL' },
    { value: 'Compliance', key: 'CARRIER.CAT_COMPLIANCE' },
    { value: 'Tickets', key: 'CARRIER.CAT_TICKETS' },
    { value: 'Insurance', key: 'CARRIER.CAT_INSURANCE' },
    { value: 'Reports', key: 'CARRIER.CAT_REPORTS' },
    { value: 'Import', key: 'CARRIER.CAT_IMPORT' },
    { value: 'Maintenance', key: 'CARRIER.CAT_MAINTENANCE' },
  ];

  filteredDocs = computed(() => {
    const cat = this.activeCategory();
    return cat === 'All' ? this.documents() : this.documents().filter(d => d.category === cat);
  });

  navigateToCompliance(): void {
    this.router.navigate(['/carrier/compliance-report']);
  }
}

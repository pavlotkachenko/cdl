import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';

import { AttorneyDocumentsComponent } from './attorney-documents.component';
import { AttorneyService } from '../../../core/services/attorney.service';

// 14 mock documents: 4 Case Files, 3 Court Filings, 3 Client Documents, 3 Templates, 1 Correspondence
// 2 documents with "Rivera" in name, both in Court Filings
const MOCK_DOCUMENTS = [
  // Case Files (4)
  { id: 'd1', name: 'Traffic Stop Report - Johnson.pdf', type: 'pdf' as const, size: '245 KB', date: '2026-01-15', category: 'Case Files' },
  { id: 'd2', name: 'Violation Notice - Smith.pdf', type: 'pdf' as const, size: '128 KB', date: '2026-01-20', category: 'Case Files' },
  { id: 'd3', name: 'Accident Report - Williams.docx', type: 'docx' as const, size: '340 KB', date: '2026-02-01', category: 'Case Files' },
  { id: 'd4', name: 'Evidence Photos - Davis.zip', type: 'zip' as const, size: '5.2 MB', date: '2026-02-05', category: 'Case Files' },
  // Court Filings (3) — 2 with "Rivera"
  { id: 'd5', name: 'Motion to Dismiss - Rivera.pdf', type: 'pdf' as const, size: '89 KB', date: '2026-02-10', category: 'Court Filings' },
  { id: 'd6', name: 'Court Hearing Summary - Rivera.docx', type: 'docx' as const, size: '156 KB', date: '2026-02-12', category: 'Court Filings' },
  { id: 'd7', name: 'Plea Agreement - Martinez.pdf', type: 'pdf' as const, size: '102 KB', date: '2026-02-15', category: 'Court Filings' },
  // Client Documents (3)
  { id: 'd8', name: 'CDL License Copy - Johnson.image', type: 'image' as const, size: '1.8 MB', date: '2026-01-10', category: 'Client Documents' },
  { id: 'd9', name: 'Insurance Card - Smith.image', type: 'image' as const, size: '950 KB', date: '2026-01-12', category: 'Client Documents' },
  { id: 'd10', name: 'Medical Certificate - Williams.pdf', type: 'pdf' as const, size: '210 KB', date: '2026-01-18', category: 'Client Documents' },
  // Templates (3)
  { id: 'd11', name: 'Client Intake Form.docx', type: 'docx' as const, size: '45 KB', date: '2025-12-01', category: 'Templates' },
  { id: 'd12', name: 'Fee Agreement Template.docx', type: 'docx' as const, size: '38 KB', date: '2025-12-01', category: 'Templates' },
  { id: 'd13', name: 'Case Summary Template.xlsx', type: 'xlsx' as const, size: '22 KB', date: '2025-12-01', category: 'Templates' },
  // Correspondence (1)
  { id: 'd14', name: 'Letter to Court - Davis.pdf', type: 'pdf' as const, size: '67 KB', date: '2026-02-20', category: 'Correspondence' },
];

function makeServiceSpy() {
  return {
    getMyCases: vi.fn().mockReturnValue(of({ cases: [] })),
    getDocuments: vi.fn().mockReturnValue(of({ documents: [] })),
  };
}

describe('AttorneyDocumentsComponent', () => {
  async function setup() {
    const spy = makeServiceSpy();

    await TestBed.configureTestingModule({
      imports: [AttorneyDocumentsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: AttorneyService, useValue: spy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AttorneyDocumentsComponent);
    fixture.detectChanges();

    // Set mock documents directly since API mapping puts everything in 'Case Files'
    // but tests need to verify category filtering with diverse categories
    fixture.componentInstance.documents.set(MOCK_DOCUMENTS);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();

    return { fixture, component: fixture.componentInstance };
  }

  it('should create the component', async () => {
    const { component: comp } = await setup();
    expect(comp).toBeTruthy();
  });

  it('should show all 14 documents by default', async () => {
    const { component: comp } = await setup();
    expect(comp.documents().length).toBe(14);
    expect(comp.activeCategory()).toBe('All');
    expect(comp.filteredDocs().length).toBe(14);
  });

  it('should filter by category', async () => {
    const { component: comp } = await setup();

    comp.activeCategory.set('Case Files');
    expect(comp.filteredDocs().every(d => d.category === 'Case Files')).toBe(true);
    expect(comp.filteredDocs().length).toBe(4);

    comp.activeCategory.set('Court Filings');
    expect(comp.filteredDocs().every(d => d.category === 'Court Filings')).toBe(true);
    expect(comp.filteredDocs().length).toBe(3);

    comp.activeCategory.set('Client Documents');
    expect(comp.filteredDocs().length).toBe(3);

    comp.activeCategory.set('Templates');
    expect(comp.filteredDocs().length).toBe(3);

    comp.activeCategory.set('Correspondence');
    expect(comp.filteredDocs().length).toBe(1);
  });

  it('should filter by search term', async () => {
    const { component: comp } = await setup();

    comp.searchTerm.set('Rivera');
    const results = comp.filteredDocs();
    expect(results.length).toBe(2);
    expect(results.every(d => d.name.toLowerCase().includes('rivera'))).toBe(true);
  });

  it('should combine category and search filters', async () => {
    const { component: comp } = await setup();

    comp.activeCategory.set('Court Filings');
    comp.searchTerm.set('Rivera');
    const results = comp.filteredDocs();
    expect(results.length).toBe(2);
    expect(results.every(d => d.category === 'Court Filings')).toBe(true);
    expect(results.every(d => d.name.toLowerCase().includes('rivera'))).toBe(true);
  });

  it('should show empty state when no docs match', async () => {
    const { component: comp, fixture } = await setup();

    comp.searchTerm.set('xyznonexistent');
    expect(comp.filteredDocs().length).toBe(0);

    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state')).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { vi, describe, it, expect } from 'vitest';
import { of } from 'rxjs';

import { AdminDocumentsComponent } from './admin-documents.component';

const MOCK_FILES = [
  { id: 'd01', file_name: 'contract_agreement.pdf', file_type: 'pdf', file_size: 524288, created_at: '2025-06-01T00:00:00Z', category: 'Legal' },
  { id: 'd02', file_name: 'motion_dismiss.docx', file_type: 'docx', file_size: 204800, created_at: '2025-06-02T00:00:00Z', category: 'Legal' },
  { id: 'd03', file_name: 'evidence_photo.jpg', file_type: 'image', file_size: 1048576, created_at: '2025-06-03T00:00:00Z', category: 'Legal' },
  { id: 'd04', file_name: 'court_filing_2025.pdf', file_type: 'pdf', file_size: 307200, created_at: '2025-06-04T00:00:00Z', category: 'Court Filings' },
  { id: 'd05', file_name: 'hearing_notice.pdf', file_type: 'pdf', file_size: 153600, created_at: '2025-06-05T00:00:00Z', category: 'Court Filings' },
  { id: 'd06', file_name: 'client_id_scan.jpg', file_type: 'image', file_size: 819200, created_at: '2025-06-06T00:00:00Z', category: 'Client Documents' },
  { id: 'd07', file_name: 'cdl_copy.pdf', file_type: 'pdf', file_size: 409600, created_at: '2025-06-07T00:00:00Z', category: 'Client Documents' },
  { id: 'd08', file_name: 'staff_handbook.pdf', file_type: 'pdf', file_size: 2097152, created_at: '2025-06-08T00:00:00Z', category: 'Internal' },
  { id: 'd09', file_name: 'meeting_notes.docx', file_type: 'docx', file_size: 102400, created_at: '2025-06-09T00:00:00Z', category: 'Internal' },
  { id: 'd10', file_name: 'case_archive.zip', file_type: 'zip', file_size: 5242880, created_at: '2025-06-10T00:00:00Z', category: 'Internal' },
  { id: 'd11', file_name: 'invoice_template.xlsx', file_type: 'xlsx', file_size: 81920, created_at: '2025-06-11T00:00:00Z', category: 'Templates' },
  { id: 'd12', file_name: 'letter_template.docx', file_type: 'docx', file_size: 61440, created_at: '2025-06-12T00:00:00Z', category: 'Templates' },
];

async function setup() {
  const httpClient = {
    get: vi.fn().mockReturnValue(of({ files: MOCK_FILES })),
  };

  await TestBed.configureTestingModule({
    imports: [AdminDocumentsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    providers: [
      { provide: HttpClient, useValue: httpClient },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminDocumentsComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('AdminDocumentsComponent', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should show all documents by default', async () => {
    const { component } = await setup();
    expect(component.activeCategory()).toBe('All');
    expect(component.filteredDocs().length).toBe(12);
  });

  it('should filter by category', async () => {
    const { component } = await setup();

    component.activeCategory.set('Legal');
    expect(component.filteredDocs().every(d => d.category === 'Legal')).toBe(true);
    expect(component.filteredDocs().length).toBe(3);

    component.activeCategory.set('Court Filings');
    expect(component.filteredDocs().every(d => d.category === 'Court Filings')).toBe(true);
    expect(component.filteredDocs().length).toBe(2);

    component.activeCategory.set('Templates');
    expect(component.filteredDocs().every(d => d.category === 'Templates')).toBe(true);
    expect(component.filteredDocs().length).toBe(2);

    component.activeCategory.set('Internal');
    expect(component.filteredDocs().every(d => d.category === 'Internal')).toBe(true);
    expect(component.filteredDocs().length).toBe(3);

    component.activeCategory.set('Client Documents');
    expect(component.filteredDocs().every(d => d.category === 'Client Documents')).toBe(true);
    expect(component.filteredDocs().length).toBe(2);
  });

  it('should filter by search term', async () => {
    const { component } = await setup();

    component.searchTerm.set('template');
    const results = component.filteredDocs();
    expect(results.length).toBe(2);
    expect(results.every(d =>
      d.name.toLowerCase().includes('template') ||
      d.category.toLowerCase().includes('template') ||
      d.type.toLowerCase().includes('template'),
    )).toBe(true);
  });

  it('showSearch toggle should work', async () => {
    const { component } = await setup();
    expect(component.showSearch()).toBe(false);

    component.showSearch.set(true);
    expect(component.showSearch()).toBe(true);

    component.showSearch.set(false);
    expect(component.showSearch()).toBe(false);
  });

  it('should show empty state when no docs match', async () => {
    const { component, fixture } = await setup();

    component.searchTerm.set('zzzznonexistent');
    fixture.detectChanges();

    expect(component.filteredDocs().length).toBe(0);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.empty-state')).toBeTruthy();
  });
});

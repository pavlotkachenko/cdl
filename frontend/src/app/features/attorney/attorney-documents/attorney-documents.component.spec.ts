import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { AttorneyDocumentsComponent } from './attorney-documents.component';
import { TranslateModule } from '@ngx-translate/core';

describe('AttorneyDocumentsComponent', () => {
  let component: AttorneyDocumentsComponent;

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [AttorneyDocumentsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    }).compileComponents();

    const fixture = TestBed.createComponent(AttorneyDocumentsComponent);
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

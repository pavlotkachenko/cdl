import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { vi, describe, it, expect } from 'vitest';

import { AdminDocumentsComponent } from './admin-documents.component';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AdminDocumentsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
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

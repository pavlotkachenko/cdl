import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { CarrierCasesComponent } from './carrier-cases.component';
import { CarrierService, FleetCase } from '../../../core/services/carrier.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_CASES: FleetCase[] = [
  { id: 'c1', case_number: 'CASE-001', driver_name: 'Alice', violation_type: 'Speeding', state: 'TX', status: 'assigned_to_attorney', attorney_name: 'J. Law' },
  { id: 'c2', case_number: 'CASE-002', driver_name: 'Bob', violation_type: 'Overweight', state: 'CA', status: 'new', attorney_name: '' },
  { id: 'c3', case_number: 'CASE-003', driver_name: 'Carol', violation_type: 'Log Book', state: 'FL', status: 'closed', attorney_name: '' },
];

function makeServiceSpy(cases = MOCK_CASES) {
  return {
    getCases: vi.fn().mockReturnValue(of({ cases })),
    bulkArchive: vi.fn().mockReturnValue(of({ archived: 1 })),
  };
}

async function setup(spy = makeServiceSpy()) {
  await TestBed.configureTestingModule({
    imports: [CarrierCasesComponent, NoopAnimationsModule],
    providers: [
      { provide: CarrierService, useValue: spy },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CarrierCasesComponent);
  fixture.detectChanges();
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  return { fixture, component: fixture.componentInstance, spy, snackBar };
}

describe('CarrierCasesComponent', () => {
  it('loads and displays all cases on init', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('CASE-001');
    expect(el.textContent).toContain('CASE-002');
  });

  it('filters to active cases only', async () => {
    const { component } = await setup();
    component.setFilter('active');
    expect(component.filteredCases().length).toBe(1);
    expect(component.filteredCases()[0].id).toBe('c1');
  });

  it('filters to pending cases only', async () => {
    const { component } = await setup();
    component.setFilter('pending');
    expect(component.filteredCases().length).toBe(1);
    expect(component.filteredCases()[0].id).toBe('c2');
  });

  it('filters to resolved cases only', async () => {
    const { component } = await setup();
    component.setFilter('resolved');
    expect(component.filteredCases().length).toBe(1);
    expect(component.filteredCases()[0].status).toBe('closed');
  });

  it('shows empty state when no cases match filter', async () => {
    const { component, fixture } = await setup(makeServiceSpy([]));
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No');
  });

  // ─── BO-2: Selection + bulk archive ──────────────────────────────────────

  it('toggleSelect adds and removes case id from selectedIds', async () => {
    const { component } = await setup();
    component.toggleSelect('c1');
    expect(component.selectedIds().has('c1')).toBe(true);
    component.toggleSelect('c1');
    expect(component.selectedIds().has('c1')).toBe(false);
  });

  it('clearSelection empties selectedIds', async () => {
    const { component } = await setup();
    component.toggleSelect('c1');
    component.toggleSelect('c2');
    component.clearSelection();
    expect(component.selectedIds().size).toBe(0);
  });

  it('setFilter clears selection', async () => {
    const { component } = await setup();
    component.toggleSelect('c1');
    component.setFilter('pending');
    expect(component.selectedIds().size).toBe(0);
  });

  it('bulkArchive calls service with selected ids and shows snackbar', async () => {
    const spy = makeServiceSpy();
    const { component, snackBar } = await setup(spy);
    component.toggleSelect('c1');
    component.bulkArchive();
    expect(spy.bulkArchive).toHaveBeenCalledWith(['c1']);
    expect(snackBar.open).toHaveBeenCalledWith('1 case archived.', 'Close', expect.any(Object));
  });

  it('shows error snackbar when bulkArchive fails', async () => {
    const spy = makeServiceSpy();
    spy.bulkArchive = vi.fn().mockReturnValue(throwError(() => new Error('fail')));
    const { component, snackBar } = await setup(spy);
    component.toggleSelect('c1');
    component.bulkArchive();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to archive cases.', 'Close', expect.any(Object));
  });

  it('shows Import CSV button linking to bulk-import route', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Import CSV');
  });
});

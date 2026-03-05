import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { CarrierCasesComponent } from './carrier-cases.component';
import { CarrierService, FleetCase } from '../../../core/services/carrier.service';

const MOCK_CASES: FleetCase[] = [
  { id: 'c1', case_number: 'CASE-001', driver_name: 'Alice', violation_type: 'Speeding', state: 'TX', status: 'assigned_to_attorney', attorney_name: 'J. Law' },
  { id: 'c2', case_number: 'CASE-002', driver_name: 'Bob', violation_type: 'Overweight', state: 'CA', status: 'new', attorney_name: '' },
  { id: 'c3', case_number: 'CASE-003', driver_name: 'Carol', violation_type: 'Log Book', state: 'FL', status: 'closed', attorney_name: '' },
];

async function setup(cases = MOCK_CASES) {
  const spy = { getCases: vi.fn().mockReturnValue(of({ cases })) };
  await TestBed.configureTestingModule({
    imports: [CarrierCasesComponent, NoopAnimationsModule],
    providers: [
      { provide: CarrierService, useValue: spy },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CarrierCasesComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy };
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
    const { component, fixture } = await setup([]);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No');
  });
});

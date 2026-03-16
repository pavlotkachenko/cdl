import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TranslateModule } from '@ngx-translate/core';

import { AttorneyCasesComponent } from './attorney-cases.component';
import { AttorneyService, AttorneyCase } from '../../../core/services/attorney.service';

const mockCases: AttorneyCase[] = [
  {
    id: 'c1', case_number: 'CDL-2026-001', status: 'assigned_to_attorney',
    violation_type: 'Speeding', state: 'Texas', driver_name: 'Alice Smith',
    created_at: '2026-03-01T10:00:00Z', attorney_price: 450,
  },
  {
    id: 'c2', case_number: 'CDL-2026-002', status: 'send_info_to_attorney',
    violation_type: 'Overweight', state: 'California', driver_name: 'Bob Jones',
    created_at: '2026-02-20T08:00:00Z', attorney_price: 800,
  },
  {
    id: 'c3', case_number: 'CDL-2026-003', status: 'closed',
    violation_type: 'Speeding', state: 'Florida', driver_name: 'Carol White',
    created_at: '2026-01-15T12:00:00Z', attorney_price: 350,
  },
  {
    id: 'c4', case_number: 'CDL-2026-004', status: 'waiting_for_driver',
    violation_type: 'Lane Violation', state: 'Ohio', driver_name: 'Dan Brown',
    created_at: '2026-02-10T09:00:00Z', attorney_price: 600,
  },
];

function makeServiceSpy() {
  return {
    getMyCases: vi.fn().mockReturnValue(of({ cases: mockCases })),
    acceptCase: vi.fn().mockReturnValue(of(undefined)),
    declineCase: vi.fn().mockReturnValue(of(undefined)),
  };
}

async function setup(spy = makeServiceSpy()) {
  const routerSpy = { navigate: vi.fn().mockResolvedValue(true) };

  await TestBed.configureTestingModule({
    imports: [AttorneyCasesComponent, TranslateModule.forRoot()],
    providers: [
      { provide: AttorneyService, useValue: spy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyCasesComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, router: routerSpy };
}

describe('AttorneyCasesComponent', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should load cases on init', async () => {
    const { component, spy } = await setup();
    expect(spy.getMyCases).toHaveBeenCalled();
    expect(component.cases().length).toBe(mockCases.length);
  });

  it('filteredCases should filter by search query', async () => {
    const { component } = await setup();
    component.searchQuery.set('Alice');
    const filtered = component.filteredCases();
    expect(filtered.length).toBe(1);
    expect(filtered[0].driver_name).toBe('Alice Smith');
  });

  it('filteredCases should filter by status', async () => {
    const { component } = await setup();

    component.statusFilter.set('pending');
    expect(component.filteredCases().length).toBe(1);
    expect(component.filteredCases()[0].status).toBe('assigned_to_attorney');

    component.statusFilter.set('active');
    const active = component.filteredCases();
    expect(active.every(c => ['send_info_to_attorney', 'waiting_for_driver', 'call_court', 'check_with_manager'].includes(c.status))).toBe(true);

    component.statusFilter.set('resolved');
    expect(component.filteredCases().length).toBe(1);
    expect(component.filteredCases()[0].status).toBe('closed');
  });

  it('filteredCases should filter by violation type', async () => {
    const { component } = await setup();
    component.violationFilter.set('Speeding');
    const filtered = component.filteredCases();
    expect(filtered.length).toBe(2);
    expect(filtered.every(c => c.violation_type === 'Speeding')).toBe(true);
  });

  it('getBadge returns correct badge info', async () => {
    const { component } = await setup();
    const pending = component.getBadge('assigned_to_attorney');
    expect(pending.label).toBe('Pending');
    expect(pending.cssClass).toBe('badge-pending');

    const active = component.getBadge('send_info_to_attorney');
    expect(active.label).toBe('Active');
    expect(active.cssClass).toBe('badge-active');

    const closed = component.getBadge('closed');
    expect(closed.label).toBe('Closed');
    expect(closed.cssClass).toBe('badge-closed');

    // Unknown status falls back
    const unknown = component.getBadge('unknown_status');
    expect(unknown.label).toBe('unknown_status');
    expect(unknown.cssClass).toBe('badge-closed');
  });

  it('formatCurrency formats amounts', async () => {
    const { component } = await setup();
    expect(component.formatCurrency(450)).toBe('$450');
    expect(component.formatCurrency(1200)).toBe('$1,200');
    expect(component.formatCurrency(undefined)).toBe('--');
  });

  it('acceptCase calls service', async () => {
    const { component, spy } = await setup();
    component.acceptCase('c1');
    expect(spy.acceptCase).toHaveBeenCalledWith('c1');
    // After accept, cases are reloaded
    expect(spy.getMyCases).toHaveBeenCalledTimes(2);
  });

  it('declineCase removes case from list', async () => {
    const { component, spy } = await setup();
    expect(component.cases().find(c => c.id === 'c1')).toBeTruthy();
    component.declineCase('c1');
    expect(spy.declineCase).toHaveBeenCalledWith('c1');
    expect(component.cases().find(c => c.id === 'c1')).toBeUndefined();
  });

  it('viewCase navigates to case detail', async () => {
    const { component, router } = await setup();
    component.viewCase('c2');
    expect(router.navigate).toHaveBeenCalledWith(['/attorney/cases', 'c2']);
  });
});

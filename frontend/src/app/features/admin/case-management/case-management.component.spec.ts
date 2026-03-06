import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { CaseManagementComponent } from './case-management.component';
import { AdminService, Case, StaffMember } from '../../../core/services/admin.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_CASES: Case[] = [
  {
    id: 'c1', caseNumber: 'CASE-001', clientId: 'u1', clientName: 'Alice', clientEmail: 'a@test.com',
    violationType: 'Speeding', status: 'new', priority: 'high',
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'c2', caseNumber: 'CASE-002', clientId: 'u2', clientName: 'Bob', clientEmail: 'b@test.com',
    violationType: 'Overweight', status: 'in_progress', priority: 'low',
    createdAt: new Date('2026-01-02'), updatedAt: new Date('2026-01-02'),
  },
];

const MOCK_STAFF: StaffMember[] = [
  {
    id: 's1', name: 'Carol Attorney', email: 'carol@test.com', role: 'attorney',
    activeCases: 3, totalCases: 20, successRate: 90, avgResolutionTime: 14,
    joinedDate: new Date('2025-01-01'), status: 'active',
  },
];

function makeServiceSpy() {
  return {
    getAllCases: vi.fn().mockReturnValue(of(MOCK_CASES)),
    getAllStaff: vi.fn().mockReturnValue(of(MOCK_STAFF)),
    updateCaseStatus: vi.fn().mockReturnValue(of(null)),
    assignCase: vi.fn().mockReturnValue(of(null)),
  };
}

async function setup(spy = makeServiceSpy()) {
  const routerSpy = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [CaseManagementComponent, NoopAnimationsModule],
    providers: [
      { provide: AdminService, useValue: spy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CaseManagementComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, router: routerSpy, snackBar };
}

describe('CaseManagementComponent', () => {
  it('loads cases and staff on init', async () => {
    const { component } = await setup();
    expect(component.cases().length).toBe(2);
    expect(component.staff().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('filteredCases is computed from searchTerm', async () => {
    const { component } = await setup();
    component.searchTerm.set('alice');
    expect(component.filteredCases().length).toBe(1);
    expect(component.filteredCases()[0].id).toBe('c1');
  });

  it('filteredCases is computed from statusFilter', async () => {
    const { component } = await setup();
    component.statusFilter.set('in_progress');
    expect(component.filteredCases().length).toBe(1);
    expect(component.filteredCases()[0].id).toBe('c2');
  });

  it('clearFilters resets all filter signals', async () => {
    const { component } = await setup();
    component.searchTerm.set('foo');
    component.statusFilter.set('new');
    component.clearFilters();
    expect(component.searchTerm()).toBe('');
    expect(component.statusFilter()).toBe('all');
    expect(component.filteredCases().length).toBe(2);
  });

  it('updateStatus calls service and reloads', async () => {
    const { component, spy, snackBar } = await setup();
    component.updateStatus(MOCK_CASES[0], 'resolved');
    expect(spy.updateCaseStatus).toHaveBeenCalledWith('c1', 'resolved');
    expect(snackBar.open).toHaveBeenCalledWith('Status updated.', 'Close', expect.any(Object));
  });

  it('getStatusLabel maps status codes', async () => {
    const { component } = await setup();
    expect(component.getStatusLabel('new')).toBe('New');
    expect(component.getStatusLabel('pending_court')).toBe('Pending Court');
    expect(component.getStatusLabel('resolved')).toBe('Resolved');
  });

  it('sets error signal when getAllCases fails', async () => {
    const spy = makeServiceSpy();
    spy.getAllCases.mockReturnValue(throwError(() => new Error('net')));
    const { component, fixture } = await setup(spy);
    expect(component.error()).toBe('Failed to load cases. Please try again.');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Failed to load cases. Please try again.');
  });

  it('clears error on retry and reloads', async () => {
    const spy = makeServiceSpy();
    spy.getAllCases.mockReturnValue(throwError(() => new Error('net')));
    const { component } = await setup(spy);
    expect(component.error()).toBeTruthy();
    spy.getAllCases.mockReturnValue(of(MOCK_CASES));
    component.loadData();
    expect(component.error()).toBe('');
    expect(component.cases().length).toBe(2);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { AttorneyDashboardComponent } from './attorney-dashboard.component';
import { AttorneyService, AttorneyCase } from '../../../core/services/attorney.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const PENDING: AttorneyCase = {
  id: 'c1', case_number: 'CASE-001', status: 'assigned_to_attorney',
  violation_type: 'Speeding', state: 'TX', driver_name: 'Alice', created_at: '2026-01-01',
};
const ACTIVE: AttorneyCase = {
  id: 'c2', case_number: 'CASE-002', status: 'send_info_to_attorney',
  violation_type: 'Overweight', state: 'CA', driver_name: 'Bob', created_at: '2026-01-02',
};
const RESOLVED: AttorneyCase = {
  id: 'c3', case_number: 'CASE-003', status: 'closed',
  violation_type: 'Log Book', state: 'FL', driver_name: 'Carol', created_at: '2026-01-03',
};

function makeServiceSpy(cases = [PENDING, ACTIVE, RESOLVED]) {
  return {
    getMyCases: vi.fn().mockReturnValue(of({ cases })),
    acceptCase: vi.fn().mockReturnValue(of(null)),
    declineCase: vi.fn().mockReturnValue(of(null)),
  };
}

async function setup(spy = makeServiceSpy()) {
  await TestBed.configureTestingModule({
    imports: [AttorneyDashboardComponent, NoopAnimationsModule],
    providers: [
      { provide: AttorneyService, useValue: spy },
      provideRouter([]),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyDashboardComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, snackBar };
}

describe('AttorneyDashboardComponent', () => {
  it('loads cases on init and shows pending tab by default', async () => {
    const { fixture, component } = await setup();
    expect(component.cases().length).toBe(3);
    expect(component.activeTab()).toBe('pending');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('CASE-001');
  });

  it('pendingCases computed filters assigned_to_attorney only', async () => {
    const { component } = await setup();
    expect(component.pendingCases().length).toBe(1);
    expect(component.pendingCases()[0].id).toBe('c1');
  });

  it('activeCases computed filters working statuses', async () => {
    const { component } = await setup();
    expect(component.activeCases().length).toBe(1);
    expect(component.activeCases()[0].id).toBe('c2');
  });

  it('resolvedCases computed filters closed/resolved', async () => {
    const { component } = await setup();
    expect(component.resolvedCases().length).toBe(1);
    expect(component.resolvedCases()[0].id).toBe('c3');
  });

  it('acceptCase() calls service, shows snackBar, and reloads', async () => {
    const { component, spy, snackBar } = await setup();
    component.acceptCase('c1');
    expect(spy.acceptCase).toHaveBeenCalledWith('c1');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Case accepted — now active in your queue.', 'Close', expect.any(Object),
    );
    expect(spy.getMyCases).toHaveBeenCalledTimes(2);
  });

  it('declineCase() removes case from list and shows snackBar', async () => {
    const { component, spy, snackBar } = await setup();
    component.declineCase('c1');
    expect(component.cases().find(c => c.id === 'c1')).toBeUndefined();
    expect(snackBar.open).toHaveBeenCalledWith('Case declined.', 'Close', expect.any(Object));
  });

  it('shows snackBar on acceptCase error', async () => {
    const spy = makeServiceSpy();
    spy.acceptCase.mockReturnValue(throwError(() => new Error('fail')));
    const { component, snackBar } = await setup(spy);
    component.acceptCase('c1');
    expect(snackBar.open).toHaveBeenCalledWith('Failed to accept case.', 'Close', expect.any(Object));
  });

  it('shows snackBar when loadCases fails', async () => {
    const spy = { getMyCases: vi.fn().mockReturnValue(throwError(() => new Error('net'))) };
    const { snackBar } = await setup(spy as any);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to load cases. Please try again.', 'Close', expect.any(Object),
    );
  });
});

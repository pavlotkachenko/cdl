import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';
import { provideTranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

import { CaseManagementComponent } from './case-management.component';
import { AdminService, StaffMember } from '../../../core/services/admin.service';
import { StatusWorkflowService } from '../../../core/services/status-workflow.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_CASES = [
  {
    id: 'c1', case_number: 'CDL-001', customer_name: 'Alice', customer_email: 'a@test.com',
    violation_type: 'Speeding', status: 'new', priority: 'high',
  },
  {
    id: 'c2', case_number: 'CDL-002', customer_name: 'Bob', customer_email: 'b@test.com',
    violation_type: 'Overweight', status: 'reviewed', priority: 'low',
  },
];

const MOCK_STAFF: StaffMember[] = [
  {
    id: 's1', name: 'Carol Attorney', email: 'carol@test.com', role: 'attorney',
    activeCases: 3, totalCases: 20, successRate: 90, avgResolutionTime: 14,
    joinedDate: new Date('2025-01-01'), status: 'active',
  },
];

function makeAdminServiceSpy() {
  return {
    getAllCases: vi.fn().mockReturnValue(of({ cases: MOCK_CASES, total: 2 })),
    getAllStaff: vi.fn().mockReturnValue(of(MOCK_STAFF)),
    updateCaseStatus: vi.fn().mockReturnValue(of(null)),
    assignCase: vi.fn().mockReturnValue(of(null)),
  };
}

function makeWorkflowServiceSpy() {
  return {
    getNextStatuses: vi.fn().mockReturnValue(of({
      currentStatus: 'new',
      nextStatuses: ['reviewed', 'assigned_to_attorney'],
      requiresNote: { assigned_to_attorney: false },
    })),
    changeStatus: vi.fn().mockReturnValue(of({ message: 'ok' })),
  };
}

async function setup(adminSpy = makeAdminServiceSpy()) {
  const routerSpy = { navigate: vi.fn() };
  const workflowSpy = makeWorkflowServiceSpy();

  await TestBed.configureTestingModule({
    imports: [CaseManagementComponent, NoopAnimationsModule],
    providers: [
      provideTranslateService(),
      { provide: AdminService, useValue: adminSpy },
      { provide: StatusWorkflowService, useValue: workflowSpy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(CaseManagementComponent);
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, adminSpy, workflowSpy, router: routerSpy, snackBar };
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
    component.statusFilter.set('reviewed');
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

  it('getStatusKey maps status codes to i18n keys', async () => {
    const { component } = await setup();
    expect(component.getStatusKey('new')).toBe('ADMIN.STATUS_NEW');
    expect(component.getStatusKey('reviewed')).toBe('ADMIN.STATUS_REVIEWED');
    expect(component.getStatusKey('resolved')).toBe('ADMIN.STATUS_RESOLVED');
  });

  it('sets error signal when getAllCases fails', async () => {
    const spy = makeAdminServiceSpy();
    spy.getAllCases.mockReturnValue(throwError(() => new Error('net')));
    const { component } = await setup(spy);
    expect(component.error()).toBe('ADMIN.FAILED_LOAD');
  });

  it('clears error on retry and reloads', async () => {
    const spy = makeAdminServiceSpy();
    spy.getAllCases.mockReturnValue(throwError(() => new Error('net')));
    const { component } = await setup(spy);
    expect(component.error()).toBeTruthy();
    spy.getAllCases.mockReturnValue(of({ cases: MOCK_CASES, total: 2 }));
    component.loadData();
    expect(component.error()).toBe('');
    expect(component.cases().length).toBe(2);
  });

  // ── Workflow integration tests ──

  it('toggleDetail fetches next statuses for expanded case', async () => {
    const { component, workflowSpy } = await setup();
    component.toggleDetail('c1');
    expect(component.expandedCaseId()).toBe('c1');
    expect(workflowSpy.getNextStatuses).toHaveBeenCalledWith('c1');
  });

  it('populates nextStatuses after workflow fetch', async () => {
    const { component } = await setup();
    component.toggleDetail('c1');
    const ns = component.nextStatuses();
    expect(ns['c1']).toEqual(['reviewed', 'assigned_to_attorney']);
  });

  it('toggleDetail collapses if same case clicked', async () => {
    const { component } = await setup();
    component.toggleDetail('c1');
    expect(component.expandedCaseId()).toBe('c1');
    component.toggleDetail('c1');
    expect(component.expandedCaseId()).toBeNull();
  });

  it('onStatusAction calls updateCaseStatus when no note required', async () => {
    const { component, adminSpy } = await setup();
    component.toggleDetail('c1');
    await component.onStatusAction(MOCK_CASES[0], 'reviewed');
    expect(adminSpy.updateCaseStatus).toHaveBeenCalledWith('c1', 'reviewed', undefined);
  });

  it('onStatusAction opens dialog when note required', async () => {
    const { component, workflowSpy, adminSpy } = await setup();
    workflowSpy.getNextStatuses.mockReturnValue(of({
      currentStatus: 'new',
      nextStatuses: ['closed'],
      requiresNote: { closed: true },
    }));
    component.toggleDetail('c1');

    const dialog = TestBed.inject(MatDialog);
    const dialogSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of('My note'),
    } as any);

    await component.onStatusAction(MOCK_CASES[0], 'closed');
    expect(dialogSpy).toHaveBeenCalled();
    expect(adminSpy.updateCaseStatus).toHaveBeenCalledWith('c1', 'closed', 'My note');
  });

  it('cancelled note dialog does not change status', async () => {
    const { component, workflowSpy, adminSpy } = await setup();
    workflowSpy.getNextStatuses.mockReturnValue(of({
      currentStatus: 'new',
      nextStatuses: ['closed'],
      requiresNote: { closed: true },
    }));
    component.toggleDetail('c1');

    const dialog = TestBed.inject(MatDialog);
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(undefined),
    } as any);

    await component.onStatusAction(MOCK_CASES[0], 'closed');
    expect(adminSpy.updateCaseStatus).not.toHaveBeenCalled();
  });

  it('terminal status shows message when no next statuses', async () => {
    const { component, workflowSpy } = await setup();
    workflowSpy.getNextStatuses.mockReturnValue(of({
      currentStatus: 'closed',
      nextStatuses: [],
      requiresNote: {},
    }));
    component.toggleDetail('c1');
    expect(component.nextStatuses()['c1']).toEqual([]);
  });

  // ── Override flow tests ──

  it('onOverride opens override dialog with current status', async () => {
    const { component } = await setup();
    component.onOverride({ id: 'c1', status: 'new' });
    expect(component.overrideDialog()).toBeTruthy();
    expect(component.overrideDialog()!.currentStatus).toBe('new');
    expect(component.overrideDialog()!.caseId).toBe('c1');
  });

  it('overrideStatuses excludes current status', async () => {
    const { component } = await setup();
    component.onOverride({ id: 'c1', status: 'new' });
    expect(component.overrideStatuses()).not.toContain('new');
    expect(component.overrideStatuses().length).toBe(10); // 11 total - 1 current
  });

  it('cancelOverride clears dialog', async () => {
    const { component } = await setup();
    component.onOverride({ id: 'c1', status: 'new' });
    component.cancelOverride();
    expect(component.overrideDialog()).toBeNull();
  });

  it('confirmOverride calls updateCaseStatus with override flag', async () => {
    const { component, adminSpy } = await setup();
    component.onOverride({ id: 'c1', status: 'new' });
    component.overrideTargetStatus.set('closed');
    component.overrideNote.set('Force closing per admin decision');

    component.confirmOverride();
    expect(adminSpy.updateCaseStatus).toHaveBeenCalledWith('c1', 'closed', 'Force closing per admin decision', true);
    expect(component.overrideDialog()).toBeNull();
  });

  it('confirmOverride does nothing if note too short', async () => {
    const { component, adminSpy } = await setup();
    component.onOverride({ id: 'c1', status: 'new' });
    component.overrideTargetStatus.set('closed');
    component.overrideNote.set('short');

    component.confirmOverride();
    expect(adminSpy.updateCaseStatus).not.toHaveBeenCalled();
  });

  it('confirmOverride does nothing if no target status selected', async () => {
    const { component, adminSpy } = await setup();
    component.onOverride({ id: 'c1', status: 'new' });
    component.overrideNote.set('Long enough note for override');

    component.confirmOverride();
    expect(adminSpy.updateCaseStatus).not.toHaveBeenCalled();
  });

  it('getStatusIcon maps known statuses', async () => {
    const { component } = await setup();
    expect(component.getStatusIcon('new')).toBe('fiber_new');
    expect(component.getStatusIcon('resolved')).toBe('check_circle');
    expect(component.getStatusIcon('unknown')).toBe('swap_horiz');
  });

  it('updateStatus calls service and reloads on success', async () => {
    const { component, adminSpy, snackBar } = await setup();
    component.toggleDetail('c1');
    await component.onStatusAction(MOCK_CASES[0], 'reviewed');
    expect(adminSpy.updateCaseStatus).toHaveBeenCalledWith('c1', 'reviewed', undefined);
    expect(snackBar.open).toHaveBeenCalledWith('Status updated.', 'Close', expect.any(Object));
  });

  // ── VD-7: Violation label & severity helpers ────────────────────

  it('getViolationLabel returns emoji + label for known type', async () => {
    const { component } = await setup();
    const label = component.getViolationLabel('speeding');
    expect(label).toContain('🚗');
    expect(label).toContain('Speeding');
  });

  it('getViolationLabel returns raw type for unknown type', async () => {
    const { component } = await setup();
    expect(component.getViolationLabel('unknown_xyz')).toBe('unknown_xyz');
  });

  it('getViolationLabel returns "Unknown" for undefined', async () => {
    const { component } = await setup();
    expect(component.getViolationLabel(undefined)).toBe('Unknown');
  });

  it('getSeverityLevel uses case violation_severity when present', async () => {
    const { component } = await setup();
    expect(component.getSeverityLevel({ violation_type: 'speeding', violation_severity: 'critical' })).toBe('critical');
  });

  it('getSeverityLevel falls back to registry severity', async () => {
    const { component } = await setup();
    expect(component.getSeverityLevel({ violation_type: 'speeding' })).toBe('serious');
  });

  it('getSeverityLevel returns "standard" for unknown type', async () => {
    const { component } = await setup();
    expect(component.getSeverityLevel({ violation_type: 'nonexistent' })).toBe('standard');
  });

  it('getSeverityClass returns correct CSS classes', async () => {
    const { component } = await setup();
    const cls = component.getSeverityClass({ violation_type: 'dui' });
    expect(cls).toContain('severity-badge');
    expect(cls).toContain('severity-critical');
  });
});

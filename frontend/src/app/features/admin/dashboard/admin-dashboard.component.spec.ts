import { TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, afterEach } from 'vitest';
import { provideTranslateService } from '@ngx-translate/core';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminService, DashboardStats } from '../../../core/services/admin.service';
import { CaseService } from '../../../core/services/case.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminOperatorKanbanComponent } from '../operator-kanban/admin-operator-kanban.component';
import { OperatorKanbanComponent } from '../../operator/kanban/operator-kanban.component';

// ── Mock data ──

const MOCK_STATS: DashboardStats = {
  totalCases: 100, activeCases: 30, pendingCases: 10, resolvedCases: 60,
  totalClients: 80, totalStaff: 8, avgResolutionTime: 15, successRate: 87.5,
  revenueThisMonth: 50000, revenueLastMonth: 40000,
  casesThisWeek: 12, casesLastWeek: 10,
};

const MOCK_CASES = [
  {
    id: 'c1', case_number: 'CDL-2026-001', customer_name: 'Alice', customer_email: 'a@test.com',
    violation_type: 'Speeding', status: 'new', state: 'TX',
    attorney_name: 'James H.', operator_name: 'Lisa M.', assigned_operator_id: null,
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'c2', case_number: 'CDL-2026-002', customer_name: 'Bob', customer_email: 'b@test.com',
    violation_type: 'Overweight', status: 'reviewed', state: 'CA',
    attorney_name: null, operator_name: null, assigned_operator_id: 'op-1',
    created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
  },
];

const MOCK_ARCHIVE_CASES = [
  {
    id: 'c10', case_number: 'CDL-2025-100', customer_name: 'Zara', violation_type: 'Speeding',
    status: 'closed', state: 'NY',
  },
  {
    id: 'c11', case_number: 'CDL-2025-101', customer_name: 'Yuri', violation_type: 'DUI',
    status: 'resolved', state: 'TX',
  },
];

const MOCK_WORKLOAD = [
  { id: 's1', name: 'Carol', activeCases: 5, capacity: 10, utilization: 50 },
];

const MOCK_OPERATORS = [
  { id: 'op-1', name: 'Lisa M.', activeCaseCount: 12 },
];

const MOCK_ATTORNEYS = [
  { id: 'att-1', full_name: 'James H.', active_cases: 5 },
];

function makeAdminServiceSpy() {
  return {
    getDashboardStats: vi.fn().mockReturnValue(of(MOCK_STATS)),
    getAllCases: vi.fn().mockImplementation((filters?: any) => {
      if (filters?.status === 'closed,resolved') {
        return of({ cases: MOCK_ARCHIVE_CASES, total: 2 });
      }
      return of({ cases: MOCK_CASES, total: 2 });
    }),
    getWorkloadDistribution: vi.fn().mockReturnValue(of({ staff: MOCK_WORKLOAD })),
    getOperators: vi.fn().mockReturnValue(of({ operators: MOCK_OPERATORS })),
    getChartData: vi.fn().mockReturnValue(of({ labels: ['new', 'reviewed'], data: [5, 3] })),
    assignOperator: vi.fn().mockReturnValue(of({ success: true })),
    assignAttorney: vi.fn().mockReturnValue(of({ success: true })),
  };
}

function makeCaseServiceSpy() {
  return {
    getAvailableAttorneys: vi.fn().mockReturnValue(of({ attorneys: MOCK_ATTORNEYS })),
  };
}

function makeDashboardServiceSpy() {
  return {
    autoAssignCase: vi.fn().mockReturnValue(of({ success: true })),
  };
}

async function setup(adminSpy = makeAdminServiceSpy()) {
  const routerSpy = { navigate: vi.fn() };
  const caseSpy = makeCaseServiceSpy();
  const dashSpy = makeDashboardServiceSpy();

  await TestBed.configureTestingModule({
    imports: [AdminDashboardComponent, NoopAnimationsModule],
    providers: [
      provideTranslateService(),
      { provide: AdminService, useValue: adminSpy },
      { provide: CaseService, useValue: caseSpy },
      { provide: DashboardService, useValue: dashSpy },
      { provide: AuthService, useValue: {} },
      { provide: Router, useValue: routerSpy },
    ],
  })
  .overrideComponent(AdminDashboardComponent, {
    remove: { imports: [AdminOperatorKanbanComponent, OperatorKanbanComponent] },
    add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
  })
  .compileComponents();

  const fixture = TestBed.createComponent(AdminDashboardComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, adminSpy, caseSpy, dashSpy, router: routerSpy };
}

describe('AdminDashboardComponent', () => {
  afterEach(() => {
    localStorage.removeItem('admin_active_tab');
  });

  // ── Existing dashboard tests ──

  it('loads stats, recent cases, and workload on init', async () => {
    const { component } = await setup();
    expect(component.stats()?.totalCases).toBe(100);
    expect(component.recentCases().length).toBe(2);
    expect(component.workload().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('loads operators and attorneys on init', async () => {
    const { component } = await setup();
    expect(component.operators().length).toBe(1);
    expect(component.attorneys().length).toBe(1);
  });

  it('computes revenueChange correctly', async () => {
    const { component } = await setup();
    expect(component.revenueChange()).toBeCloseTo(25);
  });

  it('computes weeklyChange correctly', async () => {
    const { component } = await setup();
    expect(component.weeklyChange()).toBeCloseTo(20);
  });

  it('revenueChange is 0 when stats is null', async () => {
    const spy = makeAdminServiceSpy();
    spy.getDashboardStats.mockReturnValue(throwError(() => new Error('fail')));
    const { component } = await setup(spy);
    expect(component.revenueChange()).toBe(0);
  });

  it('viewAllCases navigates to /admin/cases', async () => {
    const { component, router } = await setup();
    component.viewAllCases();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/cases']);
  });

  it('viewCase navigates to /admin/cases/:id', async () => {
    const { component, router } = await setup();
    component.viewCase(MOCK_CASES[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/admin/cases', 'c1']);
  });

  it('getStatusLabel maps real workflow statuses', async () => {
    const { component } = await setup();
    expect(component.getStatusLabel('new')).toBe('New');
    expect(component.getStatusLabel('reviewed')).toBe('Reviewed');
    expect(component.getStatusLabel('assigned_to_attorney')).toBe('Assigned');
    expect(component.getStatusLabel('closed')).toBe('Closed');
  });

  it('sets error signal when getAllCases fails', async () => {
    const spy = makeAdminServiceSpy();
    spy.getAllCases.mockReturnValue(throwError(() => new Error('net')));
    const { component } = await setup(spy);
    expect(component.error()).toBe('ADMIN.FAILED_LOAD');
  });

  it('clears error and retries on loadDashboardData call', async () => {
    const spy = makeAdminServiceSpy();
    spy.getAllCases.mockReturnValue(throwError(() => new Error('net')));
    const { component } = await setup(spy);
    expect(component.error()).toBeTruthy();
    spy.getAllCases.mockReturnValue(of({ cases: MOCK_CASES, total: 2 }));
    component.loadDashboardData();
    expect(component.error()).toBe('');
    expect(component.recentCases().length).toBe(2);
  });

  it('filteredQueue filters by searchTerm', async () => {
    const { component } = await setup();
    expect(component.caseQueue().length).toBe(2);
    component.searchTerm.set('alice');
    expect(component.filteredQueue().length).toBe(1);
    expect(component.filteredQueue()[0].id).toBe('c1');
  });

  it('clearFilters resets all filter signals', async () => {
    const { component } = await setup();
    component.searchTerm.set('foo');
    component.queueStatusFilter.set('new');
    component.queuePriorityFilter.set('high');
    component.clearFilters();
    expect(component.searchTerm()).toBe('');
    expect(component.queueStatusFilter()).toBe('');
    expect(component.queuePriorityFilter()).toBe('');
  });

  it('assignOperator calls adminService and updates queue', async () => {
    const { component, adminSpy } = await setup();
    component.assignOperator('c1', 'op-1');
    expect(adminSpy.assignOperator).toHaveBeenCalledWith('c1', 'op-1');
  });

  it('assignAttorney calls adminService and updates queue', async () => {
    const { component, adminSpy } = await setup();
    component.assignAttorney('c1', 'att-1');
    expect(adminSpy.assignAttorney).toHaveBeenCalledWith('c1', 'att-1');
  });

  it('autoAssign calls dashboardService.autoAssignCase', async () => {
    const { component, dashSpy } = await setup();
    component.autoAssign('c1');
    expect(dashSpy.autoAssignCase).toHaveBeenCalledWith('c1');
    expect(component.assigningCaseId()).toBe(null);
  });

  it('formatCurrency formats USD', async () => {
    const { component } = await setup();
    expect(component.formatCurrency(50000)).toBe('$50,000');
  });

  // ── Tab management tests ──

  it('default active tab is 0', async () => {
    const { component } = await setup();
    expect(component.activeTab()).toBe(0);
  });

  it('restores active tab from localStorage', async () => {
    localStorage.setItem('admin_active_tab', '2');
    const { component } = await setup();
    expect(component.activeTab()).toBe(2);
  });

  it('clamps invalid tab index from localStorage to 0', async () => {
    localStorage.setItem('admin_active_tab', '99');
    const { component } = await setup();
    expect(component.activeTab()).toBe(0);
  });

  it('onTabChange updates activeTab signal', async () => {
    const { component } = await setup();
    component.onTabChange(2);
    expect(component.activeTab()).toBe(2);
  });

  it('onTabChange persists tab to localStorage', async () => {
    const { fixture, component } = await setup();
    component.onTabChange(3);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(localStorage.getItem('admin_active_tab')).toBe('3');
  });

  it('Tab 1 (By Operator) sets byOperatorLoaded on first activation', async () => {
    const { component } = await setup();
    expect(component.byOperatorLoaded()).toBe(false);
    component.onTabChange(1);
    expect(component.byOperatorLoaded()).toBe(true);
  });

  it('Tab 2 (By Status) loads cases on first activation', async () => {
    const { component, adminSpy } = await setup();
    expect(component.byStatusLoaded()).toBe(false);
    component.onTabChange(2);
    expect(component.byStatusLoaded()).toBe(true);
    expect(adminSpy.getAllCases).toHaveBeenCalledWith({ limit: 500 });
  });

  it('Tab 2 does not reload on subsequent activations', async () => {
    const { component, adminSpy } = await setup();
    component.onTabChange(2);
    const callCount = adminSpy.getAllCases.mock.calls.length;
    component.onTabChange(0);
    component.onTabChange(2);
    expect(adminSpy.getAllCases.mock.calls.length).toBe(callCount);
  });

  it('Tab 3 (Archive) loads archive cases on first activation', async () => {
    const { component, adminSpy } = await setup();
    expect(component.archiveLoaded()).toBe(false);
    component.onTabChange(3);
    expect(component.archiveLoaded()).toBe(true);
    expect(adminSpy.getAllCases).toHaveBeenCalledWith({ status: 'closed,resolved', limit: 100 });
    expect(component.archiveCases().length).toBe(2);
  });

  it('archive search filters by case number and name', async () => {
    const { component } = await setup();
    component.onTabChange(3);
    expect(component.filteredArchive().length).toBe(2);

    component.archiveSearch.set('zara');
    expect(component.filteredArchive().length).toBe(1);
    expect(component.filteredArchive()[0].id).toBe('c10');

    component.archiveSearch.set('CDL-2025-101');
    expect(component.filteredArchive().length).toBe(1);
    expect(component.filteredArchive()[0].id).toBe('c11');
  });

  it('unassignedCount counts cases without operator', async () => {
    const { component } = await setup();
    // c1 has assigned_operator_id: null, c2 has 'op-1'
    expect(component.unassignedCount()).toBe(1);
  });

  it('inProgressCount reflects active cases from stats', async () => {
    const { component } = await setup();
    expect(component.inProgressCount()).toBe(30);
  });

  it('refresh reloads archive data when on archive tab', async () => {
    const { component, adminSpy } = await setup();
    component.onTabChange(3);
    const archiveCallsBefore = adminSpy.getAllCases.mock.calls.filter(
      (c: any[]) => c[0]?.status === 'closed,resolved',
    ).length;
    component.refresh();
    const archiveCallsAfter = adminSpy.getAllCases.mock.calls.filter(
      (c: any[]) => c[0]?.status === 'closed,resolved',
    ).length;
    expect(archiveCallsAfter).toBeGreaterThan(archiveCallsBefore);
  });

  it('KPI tiles are visible (stats loaded) regardless of active tab', async () => {
    const { component } = await setup();
    component.onTabChange(2);
    expect(component.stats()?.totalCases).toBe(100);
    component.onTabChange(3);
    expect(component.stats()?.totalCases).toBe(100);
  });

  it('allCasesForStatusKanban filters out closed/resolved', async () => {
    const spy = makeAdminServiceSpy();
    spy.getAllCases.mockImplementation((filters?: any) => {
      if (filters?.status === 'closed,resolved') {
        return of({ cases: MOCK_ARCHIVE_CASES, total: 2 });
      }
      if (filters?.limit === 500) {
        return of({
          cases: [
            ...MOCK_CASES,
            { id: 'c3', status: 'closed', case_number: 'CDL-003', customer_name: 'X' },
          ],
          total: 3,
        });
      }
      return of({ cases: MOCK_CASES, total: 2 });
    });
    const { component } = await setup(spy);
    component.onTabChange(2);
    expect(component.allCasesForStatusKanban().length).toBe(2);
    expect(component.allCasesForStatusKanban().every((c: any) => c.status !== 'closed')).toBe(true);
  });
});

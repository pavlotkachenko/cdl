import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';
import { provideTranslateService } from '@ngx-translate/core';

import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminService, DashboardStats, Case, WorkloadDistribution } from '../../../core/services/admin.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';

const MOCK_STATS: DashboardStats = {
  totalCases: 100, activeCases: 30, pendingCases: 10, resolvedCases: 60,
  totalClients: 80, totalStaff: 8, avgResolutionTime: 15, successRate: 87.5,
  revenueThisMonth: 50000, revenueLastMonth: 40000,
  casesThisWeek: 12, casesLastWeek: 10,
};

const MOCK_CASES: Case[] = [
  {
    id: 'c1', caseNumber: 'CASE-001', clientId: 'u1', clientName: 'Alice', clientEmail: 'a@test.com',
    violationType: 'Speeding', status: 'new', priority: 'high',
    createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'),
  },
  {
    id: 'c2', caseNumber: 'CASE-002', clientId: 'u2', clientName: 'Bob', clientEmail: 'b@test.com',
    violationType: 'Overweight', status: 'in_progress', priority: 'medium',
    createdAt: new Date('2026-01-02'), updatedAt: new Date('2026-01-02'),
  },
];

const MOCK_WORKLOAD: WorkloadDistribution[] = [
  { staffId: 's1', staffName: 'Carol', activeCases: 5, capacity: 10, utilization: 50 },
];

function makeServiceSpy() {
  return {
    getDashboardStats: vi.fn().mockReturnValue(of(MOCK_STATS)),
    getAllCases: vi.fn().mockReturnValue(of(MOCK_CASES)),
    getWorkloadDistribution: vi.fn().mockReturnValue(of(MOCK_WORKLOAD)),
  };
}

function makeDashboardServiceSpy() {
  return {
    getCaseQueue: vi.fn().mockReturnValue(of({ cases: [], total: 0 })),
    getViolationTypeDistribution: vi.fn().mockReturnValue(of(null)),
    getAttorneyWorkloadDistribution: vi.fn().mockReturnValue(of(null)),
    autoAssignCase: vi.fn().mockReturnValue(of({ success: true })),
    assignCase: vi.fn().mockReturnValue(of({ success: true })),
  };
}

function makeAuthServiceSpy() {
  return {};
}

async function setup(spy = makeServiceSpy()) {
  const routerSpy = { navigate: vi.fn() };
  const dashSpy = makeDashboardServiceSpy();
  const authSpy = makeAuthServiceSpy();

  await TestBed.configureTestingModule({
    imports: [AdminDashboardComponent, NoopAnimationsModule],
    providers: [
      provideTranslateService(),
      { provide: AdminService, useValue: spy },
      { provide: DashboardService, useValue: dashSpy },
      { provide: AuthService, useValue: authSpy },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminDashboardComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, spy, dashSpy, router: routerSpy };
}

describe('AdminDashboardComponent', () => {
  it('loads stats, recent cases, and workload on init', async () => {
    const { component } = await setup();
    expect(component.stats()?.totalCases).toBe(100);
    expect(component.recentCases().length).toBe(2);
    expect(component.workload().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('computes revenueChange correctly', async () => {
    const { component } = await setup();
    // (50000 - 40000) / 40000 * 100 = 25
    expect(component.revenueChange()).toBeCloseTo(25);
  });

  it('revenueChange is 0 when stats is null', async () => {
    const spy = makeServiceSpy();
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

  it('getStatusLabel maps case status codes', async () => {
    const { component } = await setup();
    expect(component.getStatusLabel('new')).toBe('New');
    expect(component.getStatusLabel('in_progress')).toBe('In Progress');
    expect(component.getStatusLabel('pending_court')).toBe('Pending Court');
    expect(component.getStatusLabel('closed')).toBe('Closed');
  });

  it('sets error signal when getAllCases fails', async () => {
    const spy = makeServiceSpy();
    spy.getAllCases.mockReturnValue(throwError(() => new Error('net')));
    const { component } = await setup(spy);
    expect(component.error()).toBe('ADMIN.FAILED_LOAD');
  });

  it('clears error and retries on loadDashboardData call', async () => {
    const spy = makeServiceSpy();
    spy.getAllCases.mockReturnValue(throwError(() => new Error('net')));
    const { component } = await setup(spy);
    expect(component.error()).toBeTruthy();
    spy.getAllCases.mockReturnValue(of(MOCK_CASES));
    component.loadDashboardData();
    expect(component.error()).toBe('');
    expect(component.recentCases().length).toBe(2);
  });
});

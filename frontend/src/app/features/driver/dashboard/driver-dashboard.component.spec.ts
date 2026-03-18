import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { DriverDashboardComponent } from './driver-dashboard.component';
import { CaseService, Case } from '../../../core/services/case.service';
import { AuthService } from '../../../core/services/auth.service';

const MOCK_CASES: Case[] = [
  { id: 'c1', status: 'under_review', violation_type: 'Speeding', case_number: 'CASE-001' },
  { id: 'c2', status: 'waiting_for_driver', violation_type: 'Overweight', case_number: 'CASE-002' },
  { id: 'c3', status: 'resolved', violation_type: 'Log Book', case_number: 'CASE-003' },
];

const MOCK_USER = { id: 'u1', name: 'Alice Driver', email: 'alice@test.com', role: 'driver' as const };

function makeCaseSpy(cases = MOCK_CASES) {
  return { getMyCases: vi.fn().mockReturnValue(of({ data: cases })) };
}

const authStub = { getCurrentUser: vi.fn().mockReturnValue(MOCK_USER) };

async function setup(caseSpy = makeCaseSpy()) {
  const routerSpy = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [DriverDashboardComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    providers: [
      { provide: CaseService, useValue: caseSpy },
      { provide: AuthService, useValue: authStub },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(DriverDashboardComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, caseSpy, router: routerSpy };
}

describe('DriverDashboardComponent', () => {
  beforeEach(() => {
    authStub.getCurrentUser.mockReturnValue(MOCK_USER);
  });

  it('loads cases on init and computes stats correctly', async () => {
    const { component } = await setup();
    expect(component.cases().length).toBe(3);
    expect(component.stats().total).toBe(3);
    expect(component.stats().active).toBe(1);
    expect(component.stats().pending).toBe(1);
    expect(component.stats().resolved).toBe(1);
  });

  it('recentCases returns at most 5 cases', async () => {
    const manyCases: Case[] = Array.from({ length: 8 }, (_, i) => ({
      id: `c${i}`, status: 'new', case_number: `CASE-00${i}`,
    }));
    const { component } = await setup(makeCaseSpy(manyCases));
    expect(component.recentCases().length).toBe(5);
  });

  it('falls back to mock cases on getMyCases failure', async () => {
    const spy = { getMyCases: vi.fn().mockReturnValue(throwError(() => new Error('net'))) };
    const { component } = await setup(spy);
    // Component falls back to mock data on error instead of setting error signal
    expect(component.cases().length).toBeGreaterThan(0);
    expect(component.loading()).toBe(false);
  });

  it('submitNewCase navigates to /driver/submit-ticket', async () => {
    const { component, router } = await setup();
    component.submitNewCase();
    expect(router.navigate).toHaveBeenCalledWith(['/driver/submit-ticket']);
  });

  it('viewCase navigates to /driver/cases/:id', async () => {
    const { component, router } = await setup();
    component.viewCase({ id: 'c1', status: 'new' });
    expect(router.navigate).toHaveBeenCalledWith(['/driver/cases', 'c1']);
  });

  it('viewAllCases navigates to /driver/tickets', async () => {
    const { component, router } = await setup();
    component.viewAllCases();
    expect(router.navigate).toHaveBeenCalledWith(['/driver/tickets']);
  });

  it('getStatusLabel maps known status codes', async () => {
    const { component } = await setup();
    expect(component.getStatusLabel('under_review')).toBe('Under Review');
    expect(component.getStatusLabel('assigned_to_attorney')).toBe('With Attorney');
    expect(component.getStatusLabel('resolved')).toBe('Resolved');
    expect(component.getStatusLabel('waiting_for_driver')).toBe('Waiting for Info');
  });

  it('falls back to mock cases and renders them in DOM on API failure', async () => {
    const spy = { getMyCases: vi.fn().mockReturnValue(throwError(() => new Error('net'))) };
    const { fixture, component } = await setup(spy as any);
    const el: HTMLElement = fixture.nativeElement;
    // Component falls back to mock data so dashboard still renders
    expect(component.cases().length).toBeGreaterThan(0);
    expect(component.loading()).toBe(false);
    // Stat values should be rendered
    expect(el.querySelector('.stat-num')).toBeTruthy();
  });

  it('reloads successfully after previous API failure', async () => {
    const spy = { getMyCases: vi.fn().mockReturnValue(throwError(() => new Error('net'))) };
    const { component } = await setup(spy as any);
    // After error, component has mock cases
    expect(component.cases().length).toBeGreaterThan(0);
    // Now API returns real data
    (spy as any).getMyCases.mockReturnValue(of({ data: MOCK_CASES }));
    component.loadDashboardData();
    expect(component.error()).toBe('');
    expect(component.cases().length).toBe(3);
  });
});

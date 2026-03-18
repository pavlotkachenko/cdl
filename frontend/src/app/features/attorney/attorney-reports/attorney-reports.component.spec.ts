import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { vi, describe, it, expect } from 'vitest';
import { of } from 'rxjs';

import { AttorneyReportsComponent } from './attorney-reports.component';
import { AuthService } from '../../../core/services/auth.service';

const MOCK_ANALYTICS = {
  attorneyId: 'att-1',
  summary: {
    totalCases: 48,
    activeCases: 12,
    closedCases: 32,
    successRate: 87.5,
    totalRevenue: 67450,
    avgResolutionTime: 12.4,
  },
  casesByStatus: [
    { status: 'Active', count: 12 },
    { status: 'Won', count: 32 },
    { status: 'Lost', count: 4 },
  ],
  recentActivity: [
    { month: 'Oct', cases: 7, won: 6, lost: 1, revenue: 9800 },
    { month: 'Nov', cases: 9, won: 8, lost: 1, revenue: 12650 },
    { month: 'Dec', cases: 6, won: 5, lost: 1, revenue: 8400 },
    { month: 'Jan', cases: 10, won: 9, lost: 1, revenue: 13200 },
    { month: 'Feb', cases: 8, won: 7, lost: 1, revenue: 11400 },
    { month: 'Mar', cases: 8, won: 7, lost: 1, revenue: 12000 },
  ],
};

function makeHttpSpy() {
  return {
    get: vi.fn().mockReturnValue(of(MOCK_ANALYTICS)),
  };
}

function makeAuthSpy() {
  return {
    currentUserValue: { id: 'att-1', role: 'attorney' },
  };
}

async function setup() {
  const httpSpy = makeHttpSpy();
  const authSpy = makeAuthSpy();

  await TestBed.configureTestingModule({
    imports: [AttorneyReportsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
    providers: [
      { provide: HttpClient, useValue: httpSpy },
      { provide: AuthService, useValue: authSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AttorneyReportsComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance };
}

describe('AttorneyReportsComponent', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should default to performance report type', async () => {
    const { component } = await setup();
    expect(component.reportType()).toBe('performance');
  });

  it('should switch report type', async () => {
    const { component } = await setup();
    component.reportType.set('revenue');
    expect(component.reportType()).toBe('revenue');

    component.reportType.set('cases');
    expect(component.reportType()).toBe('cases');

    component.reportType.set('clients');
    expect(component.reportType()).toBe('clients');
  });

  it('totalRevenue should sum monthly revenue', async () => {
    const { component } = await setup();
    // 9800 + 12650 + 8400 + 13200 + 11400 + 12000 = 67450
    expect(component.totalRevenue()).toBe(67450);
  });

  it('collectionRate should compute correctly', async () => {
    const { component } = await setup();
    // (59250 / (59250 + 8200)) * 100
    const expected = (59250 / (59250 + 8200)) * 100;
    expect(component.collectionRate()).toBeCloseTo(expected, 5);
  });

  it('getBarHeight returns correct percentage', async () => {
    const { component } = await setup();
    expect(component.getBarHeight(50, 100)).toBe(50);
    expect(component.getBarHeight(100, 100)).toBe(100);
    expect(component.getBarHeight(0, 100)).toBe(0);
    expect(component.getBarHeight(10, 0)).toBe(0);
  });

  it('getRateBadgeClass returns correct class', async () => {
    const { component } = await setup();
    expect(component.getRateBadgeClass(90)).toBe('rate-high');
    expect(component.getRateBadgeClass(85)).toBe('rate-high');
    expect(component.getRateBadgeClass(75)).toBe('rate-mid');
    expect(component.getRateBadgeClass(70)).toBe('rate-mid');
    expect(component.getRateBadgeClass(60)).toBe('rate-low');
  });

  it('getInitials returns correct initials', async () => {
    const { component } = await setup();
    expect(component.getInitials('James Kowalski')).toBe('JK');
    expect(component.getInitials('Miguel Rivera')).toBe('MR');
    expect(component.getInitials('Lisa Chen')).toBe('LC');
  });

  it('getRankClass returns correct rank', async () => {
    const { component } = await setup();
    expect(component.getRankClass(0)).toBe('rank-gold');
    expect(component.getRankClass(1)).toBe('rank-silver');
    expect(component.getRankClass(2)).toBe('rank-bronze');
    expect(component.getRankClass(3)).toBe('rank-default');
    expect(component.getRankClass(10)).toBe('rank-default');
  });
});

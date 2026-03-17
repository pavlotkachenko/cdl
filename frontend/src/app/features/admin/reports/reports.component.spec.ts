import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { ReportsComponent } from './reports.component';
import { AdminService, DashboardStats, PerformanceMetrics, StaffMember } from '../../../core/services/admin.service';

const MOCK_STATS: DashboardStats = {
  totalCases: 247,
  activeCases: 45,
  pendingCases: 32,
  resolvedCases: 198,
  totalClients: 180,
  totalStaff: 12,
  avgResolutionTime: 14.2,
  successRate: 80.2,
  revenueThisMonth: 45000,
  revenueLastMonth: 38000,
  casesThisWeek: 12,
  casesLastWeek: 10,
};

const MOCK_PERFORMANCE: PerformanceMetrics[] = [
  {
    staffId: 's1', staffName: 'Sarah Johnson',
    totalCases: 65, resolvedCases: 58, successRate: 89.2,
    avgResolutionTime: 12.5, clientSatisfaction: 4.8,
    casesByMonth: [{ month: 'Jan', count: 10 }],
    casesByType: [{ type: 'Speeding', count: 30 }, { type: 'Overweight', count: 20 }, { type: 'Log Violation', count: 15 }],
  },
  {
    staffId: 's2', staffName: 'Mike Chen',
    totalCases: 52, resolvedCases: 45, successRate: 86.5,
    avgResolutionTime: 15.3, clientSatisfaction: 4.5,
    casesByMonth: [{ month: 'Jan', count: 8 }],
    casesByType: [{ type: 'Speeding', count: 25 }, { type: 'DUI', count: 15 }, { type: 'Equipment', count: 12 }],
  },
  {
    staffId: 's3', staffName: 'Emily Davis',
    totalCases: 48, resolvedCases: 42, successRate: 87.5,
    avgResolutionTime: 11.8, clientSatisfaction: 4.9,
    casesByMonth: [{ month: 'Jan', count: 7 }],
    casesByType: [{ type: 'Log Violation', count: 20 }, { type: 'Speeding', count: 18 }, { type: 'Overweight', count: 10 }],
  },
  {
    staffId: 's4', staffName: 'James Wilson',
    totalCases: 41, resolvedCases: 30, successRate: 73.2,
    avgResolutionTime: 18.1, clientSatisfaction: 4.2,
    casesByMonth: [{ month: 'Jan', count: 6 }],
    casesByType: [{ type: 'Equipment', count: 20 }, { type: 'Speeding', count: 11 }, { type: 'DUI', count: 10 }],
  },
  {
    staffId: 's5', staffName: 'Lisa Park',
    totalCases: 55, resolvedCases: 50, successRate: 90.9,
    avgResolutionTime: 10.5, clientSatisfaction: 4.7,
    casesByMonth: [{ month: 'Jan', count: 9 }],
    casesByType: [{ type: 'Speeding', count: 28 }, { type: 'Log Violation', count: 17 }, { type: 'Overweight', count: 10 }],
  },
];

const MOCK_STAFF: StaffMember[] = [
  { id: 's1', name: 'Sarah Johnson', email: 's@e.com', role: 'attorney', activeCases: 7, totalCases: 65, successRate: 89.2, avgResolutionTime: 12.5, joinedDate: new Date('2022-01-01'), status: 'active' },
  { id: 's2', name: 'Mike Chen', email: 'm@e.com', role: 'attorney', activeCases: 5, totalCases: 52, successRate: 86.5, avgResolutionTime: 15.3, joinedDate: new Date('2022-03-01'), status: 'active' },
  { id: 's3', name: 'Emily Davis', email: 'e@e.com', role: 'paralegal', activeCases: 6, totalCases: 48, successRate: 87.5, avgResolutionTime: 11.8, joinedDate: new Date('2022-06-01'), status: 'active' },
  { id: 's4', name: 'James Wilson', email: 'j@e.com', role: 'attorney', activeCases: 4, totalCases: 41, successRate: 73.2, avgResolutionTime: 18.1, joinedDate: new Date('2023-01-01'), status: 'active' },
  { id: 's5', name: 'Lisa Park', email: 'l@e.com', role: 'paralegal', activeCases: 8, totalCases: 55, successRate: 90.9, avgResolutionTime: 10.5, joinedDate: new Date('2022-09-01'), status: 'active' },
];

describe('ReportsComponent', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  let component: ReportsComponent;
  let adminService: {
    getDashboardStats: ReturnType<typeof vi.fn>;
    getStaffPerformance: ReturnType<typeof vi.fn>;
    getAllStaff: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    adminService = {
      getDashboardStats: vi.fn().mockReturnValue(of(MOCK_STATS)),
      getStaffPerformance: vi.fn().mockReturnValue(of(MOCK_PERFORMANCE)),
      getAllStaff: vi.fn().mockReturnValue(of(MOCK_STAFF)),
    };

    await TestBed.configureTestingModule({
      imports: [ReportsComponent, NoopAnimationsModule],
      providers: [
        provideTranslateService(),
        { provide: AdminService, useValue: adminService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes with overview report type', () => {
    expect(component.reportType()).toBe('overview');
  });

  it('has pre-populated overviewKPIs data', () => {
    expect(component.overviewKPIs().length).toBe(4);
    expect(component.overviewKPIs()[0].key).toBe('ADMIN.TOTAL_CASES');
  });

  it('has pre-populated staffData', () => {
    expect(component.staffData().length).toBe(5);
    expect(component.staffData()[0].name).toBe('Sarah Johnson');
  });

  it('computes totalCasesCount from casesByStatus', () => {
    const total = component.casesByStatus().reduce((sum, s) => sum + s.count, 0);
    expect(component.totalCasesCount()).toBe(total);
  });

  it('computes totalViolations from casesByType', () => {
    const total = component.casesByType().reduce((sum, t) => sum + t.count, 0);
    expect(component.totalViolations()).toBe(total);
  });

  it('computes totalFinRevenue from financialMonths', () => {
    const total = component.financialMonths().reduce((sum, f) => sum + f.revenue, 0);
    expect(component.totalFinRevenue()).toBe(total);
  });

  it('computes collectionRate from financialSummary', () => {
    const summary = component.financialSummary();
    const expected = (summary.collected / (summary.collected + summary.outstanding)) * 100;
    expect(component.collectionRate()).toBeCloseTo(expected);
  });

  it('switches reportType when set', () => {
    component.reportType.set('staff');
    expect(component.reportType()).toBe('staff');
    component.reportType.set('financial');
    expect(component.reportType()).toBe('financial');
  });

  it('getSuccessGradient returns correct gradient by rate', () => {
    expect(component.getSuccessGradient(95)).toContain('#66bb6a');
    expect(component.getSuccessGradient(75)).toContain('#ffa726');
    expect(component.getSuccessGradient(60)).toContain('#ef5350');
  });

  it('getRateBadgeClass returns correct class by rate', () => {
    expect(component.getRateBadgeClass(90)).toBe('rate-high');
    expect(component.getRateBadgeClass(80)).toBe('rate-mid');
    expect(component.getRateBadgeClass(60)).toBe('rate-low');
  });

  it('getBarHeight computes percentage correctly', () => {
    expect(component.getBarHeight(50, 100)).toBe(50);
    expect(component.getBarHeight(0, 100)).toBe(0);
    expect(component.getBarHeight(10, 0)).toBe(0);
  });

  it('getInitials extracts up to 2 initials', () => {
    expect(component.getInitials('Sarah Johnson')).toBe('SJ');
    expect(component.getInitials('Bob')).toBe('B');
  });
});

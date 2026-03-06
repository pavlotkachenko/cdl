import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { ReportsComponent } from './reports.component';
import { AdminService, PerformanceMetrics, StaffMember } from '../../../core/services/admin.service';

const MOCK_STAFF: StaffMember[] = [
  {
    id: 'staff-1', name: 'Jane Doe', email: 'jane@example.com',
    role: 'paralegal', status: 'active', activeCases: 3,
    totalCases: 20, successRate: 90, avgResolutionTime: 3.5,
    joinedDate: new Date('2022-01-01'),
  },
];

const MOCK_METRICS: PerformanceMetrics[] = [
  {
    staffId: 'staff-1', staffName: 'Jane Doe',
    totalCases: 20, resolvedCases: 18, successRate: 90,
    avgResolutionTime: 3.5, clientSatisfaction: 4.8,
    casesByMonth: [], casesByType: [],
  },
  {
    staffId: 'staff-2', staffName: 'John Doe',
    totalCases: 10, resolvedCases: 7, successRate: 70,
    avgResolutionTime: 5, clientSatisfaction: 4.0,
    casesByMonth: [], casesByType: [],
  },
];

describe('ReportsComponent', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  let component: ReportsComponent;
  let adminService: {
    getStaffPerformance: ReturnType<typeof vi.fn>;
    getAllStaff: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    adminService = {
      getStaffPerformance: vi.fn().mockReturnValue(of(MOCK_METRICS)),
      getAllStaff: vi.fn().mockReturnValue(of(MOCK_STAFF)),
    };

    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: AdminService, useValue: adminService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads performance metrics and staff on init', () => {
    expect(adminService.getStaffPerformance).toHaveBeenCalled();
    expect(adminService.getAllStaff).toHaveBeenCalled();
    expect(component.performanceMetrics()).toEqual(MOCK_METRICS);
    expect(component.staffMembers()).toEqual(MOCK_STAFF);
  });

  it('filteredMetrics returns all when selectedStaff is "all"', () => {
    expect(component.filteredMetrics().length).toBe(2);
  });

  it('filteredMetrics filters by staffId', () => {
    component.selectedStaff.set('staff-1');
    expect(component.filteredMetrics().length).toBe(1);
    expect(component.filteredMetrics()[0].staffName).toBe('Jane Doe');
  });

  it('onStaffChange updates selectedStaff and reloads', () => {
    component.onStaffChange('staff-2');
    expect(component.selectedStaff()).toBe('staff-2');
    expect(adminService.getStaffPerformance).toHaveBeenCalledTimes(2);
  });

  it('getSuccessRateColor returns correct color', () => {
    expect(component.getSuccessRateColor(95)).toBe('accent');
    expect(component.getSuccessRateColor(85)).toBe('primary');
    expect(component.getSuccessRateColor(70)).toBe('warn');
  });

  it('reads staffId from queryParams', () => {
    expect(component.selectedStaff()).toBe('all');
  });
});

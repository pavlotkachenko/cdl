import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject, BehaviorSubject } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { OperatorDashboardComponent } from './operator-dashboard.component';
import { DashboardService, WorkloadStats, CaseQueueItem } from '../../../core/services/dashboard.service';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

vi.mock('chart.js/auto', () => {
  class MockChart {
    data = { datasets: [{ data: [] }], labels: [] };
    destroy = vi.fn();
    update = vi.fn();
    constructor(_ctx: any, _config: any) {}
  }
  return { Chart: MockChart };
});

const MOCK_STATS: WorkloadStats = {
  totalCases: 30, newCases: 10, assignedCases: 8, inProgressCases: 7,
  resolvedCases: 5, averageResolutionTime: 3.2, todaysCases: 3,
};

const MOCK_QUEUE: CaseQueueItem[] = [
  {
    caseId: 'case-1', driverName: 'Miguel Garcia', violationType: 'Speeding',
    violationDate: '2024-01-10', violationState: 'TX', priority: 'high', status: 'new', createdAt: '',
  },
  {
    caseId: 'case-2', driverName: 'Sarah Lee', violationType: 'Overweight',
    violationDate: '2024-01-12', violationState: 'CA', priority: 'low', status: 'new', createdAt: '',
  },
];

describe('OperatorDashboardComponent (admin)', () => {
  let fixture: ComponentFixture<OperatorDashboardComponent>;
  let component: OperatorDashboardComponent;
  let dashboardService: {
    getWorkloadStats: ReturnType<typeof vi.fn>;
    getCaseQueue: ReturnType<typeof vi.fn>;
    autoAssignCase: ReturnType<typeof vi.fn>;
    getViolationTypeDistribution: ReturnType<typeof vi.fn>;
    getAttorneyWorkloadDistribution: ReturnType<typeof vi.fn>;
    workload$: Subject<WorkloadStats | null>;
    queue$: Subject<CaseQueueItem[]>;
  };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dashboardService = {
      getWorkloadStats: vi.fn().mockReturnValue(of(MOCK_STATS)),
      getCaseQueue: vi.fn().mockReturnValue(of({ cases: MOCK_QUEUE, total: 2 })),
      autoAssignCase: vi.fn().mockReturnValue(of({ assignedAttorney: { name: 'Attorney A', score: 95 } })),
      getViolationTypeDistribution: vi.fn().mockReturnValue(of({ labels: [], values: [] })),
      getAttorneyWorkloadDistribution: vi.fn().mockReturnValue(of([])),
      workload$: new BehaviorSubject<WorkloadStats | null>(MOCK_STATS),
      queue$: new BehaviorSubject<CaseQueueItem[]>(MOCK_QUEUE),
    };
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OperatorDashboardComponent],
      providers: [
        provideAnimationsAsync(),
        provideTranslateService(),
        { provide: DashboardService, useValue: dashboardService },
        { provide: AuthService, useValue: { currentUserValue: { id: 'user-1' } } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads workload stats and case queue on init', () => {
    expect(dashboardService.getWorkloadStats).toHaveBeenCalledWith('user-1');
    expect(dashboardService.getCaseQueue).toHaveBeenCalled();
    expect(component.workloadStats()).toEqual(MOCK_STATS);
    expect(component.caseQueue()).toEqual(MOCK_QUEUE);
  });

  it('filteredQueue returns all when no filters set', () => {
    expect(component.filteredQueue().length).toBe(2);
  });

  it('filteredQueue filters by searchText', () => {
    component.searchText.set('miguel');
    expect(component.filteredQueue().length).toBe(1);
    expect(component.filteredQueue()[0].caseId).toBe('case-1');
  });

  it('filteredQueue filters by priority', () => {
    component.filterPriority.set('high');
    expect(component.filteredQueue().length).toBe(1);
    expect(component.filteredQueue()[0].priority).toBe('high');
  });

  it('clearFilters resets all filter signals', () => {
    component.searchText.set('miguel');
    component.filterPriority.set('high');
    component.filterStatus.set('new');
    component.clearFilters();
    expect(component.searchText()).toBe('');
    expect(component.filterPriority()).toBe('');
    expect(component.filterStatus()).toBe('');
  });

  it('autoAssignCase calls service and shows snackBar', () => {
    component.autoAssignCase(MOCK_QUEUE[0]);
    expect(dashboardService.autoAssignCase).toHaveBeenCalledWith('case-1');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Case assigned to Attorney A (Score: 95)',
      'Close',
      { duration: 4000 }
    );
  });

  it('getPriorityColor returns correct Material color', () => {
    expect(component.getPriorityColor('high')).toBe('warn');
    expect(component.getPriorityColor('medium')).toBe('accent');
    expect(component.getPriorityColor('low')).toBe('primary');
  });
});

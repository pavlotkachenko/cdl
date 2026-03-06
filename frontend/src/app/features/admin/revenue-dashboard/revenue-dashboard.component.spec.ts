import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { RevenueDashboardComponent } from './revenue-dashboard.component';
import { RevenueService, RevenueMetrics } from '../../../services/revenue.service';
import { MatSnackBar } from '@angular/material/snack-bar';

vi.mock('chart.js', () => {
  class MockChart {
    data = { datasets: [{ data: [] }], labels: [] };
    destroy = vi.fn();
    update = vi.fn();
    static register = vi.fn();
    constructor(_ctx: any, _config: any) {}
  }
  return { Chart: MockChart, registerables: [] };
});

const MOCK_METRICS: RevenueMetrics = {
  total_revenue: 500000,
  total_transactions: 42,
  average_transaction: 11904,
  success_rate: 92.5,
  monthly_recurring_revenue: 50000,
  failed_transactions: 2,
  refunded_amount: 5000,
};

describe('RevenueDashboardComponent', () => {
  let fixture: ComponentFixture<RevenueDashboardComponent>;
  let component: RevenueDashboardComponent;
  let revenueService: {
    getRevenueMetrics: ReturnType<typeof vi.fn>;
    getDailyRevenue: ReturnType<typeof vi.fn>;
    getRevenueByMethod: ReturnType<typeof vi.fn>;
    getRevenueByAttorney: ReturnType<typeof vi.fn>;
    exportToCsv: ReturnType<typeof vi.fn>;
  };
  let snackBar: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    revenueService = {
      getRevenueMetrics: vi.fn().mockReturnValue(of(MOCK_METRICS)),
      getDailyRevenue: vi.fn().mockReturnValue(of([])),
      getRevenueByMethod: vi.fn().mockReturnValue(of([])),
      getRevenueByAttorney: vi.fn().mockReturnValue(of([])),
      exportToCsv: vi.fn().mockReturnValue(of(new Blob())),
    };
    snackBar = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [RevenueDashboardComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: RevenueService, useValue: revenueService },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RevenueDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads metrics on init', async () => {
    await fixture.whenStable();
    expect(revenueService.getRevenueMetrics).toHaveBeenCalled();
    expect(component.metrics()).toEqual(MOCK_METRICS);
  });

  it('loading is false after data loads', async () => {
    await fixture.whenStable();
    expect(component.loading()).toBe(false);
  });

  it('formatCurrency formats cents to USD string', () => {
    expect(component.formatCurrency(150000)).toBe('$1,500.00');
  });

  it('metrics are loaded with correct values', async () => {
    await fixture.whenStable();
    expect(component.metrics()?.total_revenue).toBe(500000);
    expect(component.metrics()?.total_transactions).toBe(42);
  });

  it('formatPercentage formats to one decimal', () => {
    expect(component.formatPercentage(15.5)).toBe('15.5%');
  });

  it('exportToCsv calls service and shows snackBar on success', () => {
    component.exportToCsv();
    expect(revenueService.exportToCsv).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Report exported successfully', 'Close', { duration: 3000 });
  });

  it('exportToCsv shows error snackBar on failure', () => {
    revenueService.exportToCsv.mockReturnValue(throwError(() => new Error('fail')));
    component.exportToCsv();
    expect(snackBar.open).toHaveBeenCalledWith('Error exporting report', 'Close', { duration: 3000 });
  });
});

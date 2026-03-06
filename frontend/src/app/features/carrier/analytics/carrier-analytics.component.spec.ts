import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CarrierAnalyticsComponent } from './carrier-analytics.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { FleetAnalytics } from '../../../core/services/carrier.service';

const BASE = `${environment.apiUrl}/carriers/me`;

const MOCK_ANALYTICS: FleetAnalytics = {
  casesByMonth: [
    { month: 'Oct 2025', count: 2 },
    { month: 'Nov 2025', count: 5 },
    { month: 'Dec 2025', count: 3 },
  ],
  violationBreakdown: [
    { type: 'Speeding', count: 6, pct: 60 },
    { type: 'Lane Change', count: 4, pct: 40 },
  ],
  successRate: 87,
  avgResolutionDays: 18,
  atRiskDrivers: [
    { id: 'd1', name: 'John Doe', openCases: 5, riskLevel: 'red' },
    { id: 'd2', name: 'Jane Smith', openCases: 2, riskLevel: 'yellow' },
  ],
  estimatedSavings: 2700,
  totalCases: 10,
};

describe('CarrierAnalyticsComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<CarrierAnalyticsComponent>>;
  let component: CarrierAnalyticsComponent;
  let http: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = { navigate: vi.fn() };
    // jsdom doesn't implement URL.createObjectURL/revokeObjectURL.
    // Add them directly without replacing the URL constructor (vi.stubGlobal breaks `new URL()`).
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn().mockReturnValue('blob:mock'), writable: true, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), writable: true, configurable: true });

    await TestBed.configureTestingModule({
      imports: [CarrierAnalyticsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CarrierAnalyticsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => { http.verify(); vi.restoreAllMocks(); });

  function flush(data = MOCK_ANALYTICS) {
    fixture.detectChanges();
    const req = http.expectOne(`${BASE}/analytics`);
    req.flush(data);
    fixture.detectChanges();
  }

  it('shows loading spinner before data arrives', () => {
    fixture.detectChanges();
    expect(component.loading()).toBe(true);
    http.expectOne(`${BASE}/analytics`).flush(MOCK_ANALYTICS);
  });

  it('renders KPI cards with analytics data', () => {
    flush();
    expect(component.data().successRate).toBe(87);
    expect(component.data().avgResolutionDays).toBe(18);
    expect(component.data().totalCases).toBe(10);
    expect(component.data().estimatedSavings).toBe(2700);
  });

  it('renders monthly bar chart items', () => {
    flush();
    expect(component.data().casesByMonth).toHaveLength(3);
    expect(component.data().casesByMonth[1].month).toBe('Nov 2025');
  });

  it('computes correct bar height percentage', () => {
    flush();
    // max is 5 (Nov); Nov bar should be 100%, Oct should be 40%
    expect(component.maxMonthCount()).toBe(5);
    expect(component.barHeight(5)).toBe(100);
    expect(component.barHeight(2)).toBe(40);
  });

  it('renders violation breakdown rows', () => {
    flush();
    expect(component.data().violationBreakdown).toHaveLength(2);
    expect(component.data().violationBreakdown[0].type).toBe('Speeding');
    expect(component.data().violationBreakdown[0].pct).toBe(60);
  });

  it('renders at-risk drivers with correct risk levels', () => {
    flush();
    expect(component.data().atRiskDrivers).toHaveLength(2);
    expect(component.data().atRiskDrivers[0].riskLevel).toBe('red');
    expect(component.data().atRiskDrivers[1].riskLevel).toBe('yellow');
  });

  it('shows error state on fetch failure', () => {
    fixture.detectChanges();
    const req = http.expectOne(`${BASE}/analytics`);
    req.flush('error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(component.error()).toBeTruthy();
    expect(component.loading()).toBe(false);
  });

  it('retry button calls loadData again', () => {
    fixture.detectChanges();
    http.expectOne(`${BASE}/analytics`).flush('error', { status: 500, statusText: 'error' });
    fixture.detectChanges();

    component.loadData();
    http.expectOne(`${BASE}/analytics`).flush(MOCK_ANALYTICS);
    fixture.detectChanges();
    expect(component.error()).toBe('');
  });

  it('exportCsv() calls the export endpoint and triggers download', () => {
    flush();
    component.exportCsv();
    const req = http.expectOne(`${BASE}/export?format=csv`);
    expect(req.request.method).toBe('GET');
    req.flush(new Blob(['csv data'], { type: 'text/csv' }));
    fixture.detectChanges();
    expect(component.exporting()).toBe(false);
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('exportCsv() shows snackBar on failure', () => {
    flush();
    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    const snackSpy = vi.spyOn(snackBar, 'open');

    component.exportCsv();
    http.expectOne(`${BASE}/export?format=csv`).error(new ProgressEvent('error'), { status: 500, statusText: 'error' });
    fixture.detectChanges();

    expect(snackSpy).toHaveBeenCalled();
    expect(component.exporting()).toBe(false);
  });

  it('goBack() navigates to /carrier/dashboard', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/carrier/dashboard']);
  });

  // ------------------------------------------------------------------
  // LH-3/LH-4 — Empty states + extended coverage
  // ------------------------------------------------------------------

  it('shows zero-data full-page empty state when totalCases is 0', () => {
    flush({ ...MOCK_ANALYTICS, totalCases: 0 });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.zero-state')).toBeTruthy();
    expect(el.querySelector('.kpi-grid')).toBeNull();
  });

  it('shows chart empty state when casesByMonth is empty', () => {
    flush({ ...MOCK_ANALYTICS, casesByMonth: [] });
    const el: HTMLElement = fixture.nativeElement;
    const chartEmpties = el.querySelectorAll('.chart-empty');
    expect(chartEmpties.length).toBeGreaterThanOrEqual(1);
  });

  it('shows chart empty state when violationBreakdown is empty', () => {
    flush({ ...MOCK_ANALYTICS, violationBreakdown: [] });
    const el: HTMLElement = fixture.nativeElement;
    const chartEmpties = el.querySelectorAll('.chart-empty');
    expect(chartEmpties.length).toBeGreaterThanOrEqual(1);
  });

  it('hides at-risk drivers section when array is empty', () => {
    flush({ ...MOCK_ANALYTICS, atRiskDrivers: [] });
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).not.toContain('At-Risk Drivers');
  });

  it('barHeight returns 0 when maxMonthCount is 0', () => {
    flush({ ...MOCK_ANALYTICS, casesByMonth: [] });
    expect(component.barHeight(0)).toBe(0);
  });

  it('barHeight scales correctly against max', () => {
    flush({ ...MOCK_ANALYTICS, casesByMonth: [{ month: 'Jan', count: 10 }] });
    expect(component.maxMonthCount()).toBe(10);
    expect(component.barHeight(5)).toBe(50);
    expect(component.barHeight(10)).toBe(100);
  });

  it('exportCsv sets exporting to true during request', () => {
    flush();
    component.exportCsv();
    expect(component.exporting()).toBe(true);
    http.expectOne(`${BASE}/export?format=csv`).flush(new Blob(['csv']));
    fixture.detectChanges();
    expect(component.exporting()).toBe(false);
  });

  it('loading resets to false after data loads', () => {
    flush();
    expect(component.loading()).toBe(false);
  });

  it('data defaults to zero values before load', () => {
    fixture.detectChanges();
    // Before flush: loading is true, data has defaults
    expect(component.loading()).toBe(true);
    expect(component.data().totalCases).toBe(0);
    http.expectOne(`${BASE}/analytics`).flush(MOCK_ANALYTICS);
  });

  it('does not show KPI grid while loading', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.kpi-grid')).toBeNull();
    http.expectOne(`${BASE}/analytics`).flush(MOCK_ANALYTICS);
  });

  it('renders correct estimatedSavings value', () => {
    flush();
    expect(component.data().estimatedSavings).toBe(2700);
  });
});

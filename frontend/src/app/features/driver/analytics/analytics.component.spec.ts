import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AnalyticsComponent } from './analytics.component';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { DriverAnalytics } from '../../../core/services/driver-analytics.service';

const BASE = `${environment.apiUrl}/drivers/me`;

const MOCK: DriverAnalytics = {
  totalCases: 8,
  openCases: 3,
  resolvedCases: 5,
  successRate: 62,
  casesByMonth: [
    { month: 'Oct 2025', count: 2 },
    { month: 'Nov 2025', count: 4 },
    { month: 'Dec 2025', count: 2 },
  ],
  violationBreakdown: [
    { type: 'Speeding',    count: 5, pct: 62 },
    { type: 'Lane Change', count: 3, pct: 38 },
  ],
};

describe('AnalyticsComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AnalyticsComponent>>;
  let component: AnalyticsComponent;
  let http: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AnalyticsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    http      = TestBed.inject(HttpTestingController);
    fixture   = TestBed.createComponent(AnalyticsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => { http.verify(); });

  function flush(data = MOCK) {
    fixture.detectChanges();
    http.expectOne(`${BASE}/analytics`).flush(data);
    fixture.detectChanges();
  }

  it('shows loading before data arrives', () => {
    fixture.detectChanges();
    expect(component.loading).toBe(true);
    http.expectOne(`${BASE}/analytics`).flush(MOCK);
  });

  it('renders KPI values after data loads', () => {
    flush();
    expect(component.summary?.totalCases).toBe(8);
    expect(component.summary?.activeCases).toBe(3);
    expect(component.summary?.winRate).toBe(62);
  });

  it('renders monthly chart data', () => {
    flush();
    expect(component.timeline).toHaveLength(3);
    expect(component.timeline[1].month).toBe('Nov 2025');
  });

  it('computes barHeight correctly', () => {
    flush();
    expect(component.barHeight(4)).toBe(100);
    expect(component.barHeight(2)).toBe(50);
  });

  it('shows fallback state on fetch failure', () => {
    fixture.detectChanges();
    http.expectOne(`${BASE}/analytics`).flush('error', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(component.loading).toBe(false);
    expect(component.summary).toBeTruthy();
  });

  it('retry calls loadData and refreshes data', () => {
    fixture.detectChanges();
    http.expectOne(`${BASE}/analytics`).flush('error', { status: 500, statusText: 'error' });
    fixture.detectChanges();

    component.loadData();
    http.expectOne(`${BASE}/analytics`).flush(MOCK);
    fixture.detectChanges();
    expect(component.summary).toBeTruthy();
  });

  it('goBack() navigates to /driver/dashboard', () => {
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
  });
});

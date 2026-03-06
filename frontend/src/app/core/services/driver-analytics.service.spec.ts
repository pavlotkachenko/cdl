import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { DriverAnalyticsService } from './driver-analytics.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/drivers/me`;

describe('DriverAnalyticsService', () => {
  let service: DriverAnalyticsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DriverAnalyticsService);
    http    = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAnalytics() makes GET to /drivers/me/analytics', () => {
    const mock = {
      totalCases: 5, openCases: 2, resolvedCases: 3, successRate: 60,
      casesByMonth: [{ month: 'Jan 2026', count: 2 }],
      violationBreakdown: [{ type: 'Speeding', count: 3, pct: 60 }],
    };
    service.getAnalytics().subscribe(r => expect(r).toEqual(mock));
    const req = http.expectOne(`${BASE}/analytics`);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getAnalytics() propagates HTTP error', () => {
    let errored = false;
    service.getAnalytics().subscribe({ error: () => { errored = true; } });
    http.expectOne(`${BASE}/analytics`).flush('error', { status: 500, statusText: 'Server Error' });
    expect(errored).toBe(true);
  });
});

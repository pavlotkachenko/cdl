import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { CarrierService } from './carrier.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/carriers/me`;

describe('CarrierService', () => {
  let service: CarrierService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CarrierService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getStats() makes GET to /stats', () => {
    const mock = { totalDrivers: 5, activeCases: 2, pendingCases: 1, resolvedCases: 10 };
    service.getStats().subscribe(s => expect(s).toEqual(mock));
    http.expectOne(`${BASE}/stats`).flush(mock);
  });

  it('getDrivers() makes GET to /drivers', () => {
    const mock = { drivers: [{ id: 'd1', full_name: 'John', cdl_number: 'CDL1', openCases: 0 }] };
    service.getDrivers().subscribe(r => expect(r).toEqual(mock));
    http.expectOne(`${BASE}/drivers`).flush(mock);
  });

  it('addDriver() makes POST to /drivers with body', () => {
    const payload = { full_name: 'Jane', cdl_number: 'CDL2' };
    const mock = { driver: { id: 'd2', full_name: 'Jane', cdl_number: 'CDL2', openCases: 0 } };
    service.addDriver(payload).subscribe(r => expect(r).toEqual(mock));
    const req = http.expectOne(`${BASE}/drivers`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mock);
  });

  it('removeDriver() makes DELETE to /drivers/:id', () => {
    service.removeDriver('d1').subscribe(r => expect(r).toEqual({ message: 'removed' }));
    const req = http.expectOne(`${BASE}/drivers/d1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'removed' });
  });

  it('getCases() without filter makes GET to /cases', () => {
    service.getCases().subscribe();
    http.expectOne(`${BASE}/cases`).flush({ cases: [] });
  });

  it('getCases() with status filter appends query param', () => {
    service.getCases('active').subscribe();
    http.expectOne(`${BASE}/cases?status=active`).flush({ cases: [] });
  });

  it('getCases("all") omits status query param', () => {
    service.getCases('all').subscribe();
    http.expectOne(`${BASE}/cases`).flush({ cases: [] });
  });

  it('getProfile() makes GET to /me', () => {
    const mock = { carrier: { company_name: 'Acme', usdot_number: '123', email: 'a@b.com', phone_number: '555', notify_on_new_ticket: false } };
    service.getProfile().subscribe(r => expect(r).toEqual(mock));
    http.expectOne(BASE).flush(mock);
  });

  it('updateProfile() makes PUT to /me with body', () => {
    const payload = { phone_number: '999' };
    service.updateProfile(payload).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ carrier: {} });
  });

  it('getAnalytics() makes GET to /analytics', () => {
    const mock = {
      casesByMonth: [{ month: 'Jan 2026', count: 3 }],
      violationBreakdown: [{ type: 'Speeding', count: 3, pct: 100 }],
      successRate: 90,
      avgResolutionDays: 14,
      atRiskDrivers: [],
      estimatedSavings: 900,
      totalCases: 3,
    };
    service.getAnalytics().subscribe(r => expect(r).toEqual(mock));
    http.expectOne(`${BASE}/analytics`).flush(mock);
  });

  it('exportCsv() makes GET to /export?format=csv with blob responseType', () => {
    const blob = new Blob(['csv'], { type: 'text/csv' });
    service.exportCsv().subscribe(r => expect(r).toBeInstanceOf(Blob));
    const req = http.expectOne(`${BASE}/export?format=csv`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(blob);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { httpErrorInterceptor } from './http-error.interceptor';

describe('httpErrorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let snackBar: { open: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBar = { open: vi.fn() };
    router = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: MatSnackBar, useValue: snackBar },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('passes through 200 responses without opening snackBar', () => {
    http.get('/test').subscribe();
    controller.expectOne('/test').flush({ ok: true });
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('passes through 201 responses without opening snackBar', () => {
    http.post('/test', {}).subscribe();
    controller.expectOne('/test').flush({}, { status: 201, statusText: 'Created' });
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('shows "No connection" snackBar on status 0 (network error)', () => {
    http.get('/test').subscribe({ error: () => {} });
    controller.expectOne('/test').error(new ProgressEvent('error'));
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('connection'), 'Dismiss', expect.any(Object),
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows "Session expired" snackBar and navigates to /login on 401', () => {
    http.get('/test').subscribe({ error: () => {} });
    controller.expectOne('/test').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Session expired'), 'Dismiss', expect.any(Object),
    );
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('shows "permission" snackBar on status 403', () => {
    http.get('/test').subscribe({ error: () => {} });
    controller.expectOne('/test').flush(null, { status: 403, statusText: 'Forbidden' });
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('permission'), 'Dismiss', expect.any(Object),
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows "not found" snackBar on status 404', () => {
    http.get('/test').subscribe({ error: () => {} });
    controller.expectOne('/test').flush(null, { status: 404, statusText: 'Not Found' });
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('not found'), 'Dismiss', expect.any(Object),
    );
  });

  it('shows "Too many requests" snackBar on status 429', () => {
    http.get('/test').subscribe({ error: () => {} });
    controller.expectOne('/test').flush(null, { status: 429, statusText: 'Too Many Requests' });
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Too many'), 'Dismiss', expect.any(Object),
    );
  });

  it('shows "Server error" snackBar on status 500', () => {
    http.get('/test').subscribe({ error: () => {} });
    controller.expectOne('/test').flush(null, { status: 500, statusText: 'Internal Server Error' });
    expect(snackBar.open).toHaveBeenCalledWith(
      expect.stringContaining('Server error'), 'Dismiss', expect.any(Object),
    );
  });

  it('rethrows the error so subscribers can handle it', () => {
    let caught = false;
    http.get('/test').subscribe({ error: () => { caught = true; } });
    controller.expectOne('/test').flush(null, { status: 500, statusText: 'Server Error' });
    expect(caught).toBe(true);
  });
});

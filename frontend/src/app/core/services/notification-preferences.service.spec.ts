import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { NotificationPreferencesService } from './notification-preferences.service';

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificationPreferencesService,
      ],
    });
    service = TestBed.inject(NotificationPreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('getPreferences calls GET /api/users/me/preferences', () => {
    service.getPreferences().subscribe(res => {
      expect(res.preferences).toEqual({ sms_opt_in: true });
    });
    const req = httpMock.expectOne('/api/users/me/preferences');
    expect(req.request.method).toBe('GET');
    req.flush({ preferences: { sms_opt_in: true } });
  });

  it('updatePreference calls PATCH with correct payload', () => {
    service.updatePreference('case_updates', 'email', true).subscribe();
    const req = httpMock.expectOne('/api/users/me/preferences');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ case_updates_email: true });
    req.flush({ preferences: {} });
  });
});

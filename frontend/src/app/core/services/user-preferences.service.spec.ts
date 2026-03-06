import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { UserPreferencesService } from './user-preferences.service';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/users/me/preferences`;

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserPreferencesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends PATCH with sms_opt_in: true and returns preferences', () => {
    let result: { preferences: { sms_opt_in: boolean } } | undefined;
    service.updateSmsOptIn(true).subscribe(r => (result = r));

    const req = http.expectOne(BASE);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ sms_opt_in: true });
    req.flush({ preferences: { sms_opt_in: true } });

    expect(result!.preferences.sms_opt_in).toBe(true);
  });

  it('sends PATCH with sms_opt_in: false', () => {
    service.updateSmsOptIn(false).subscribe();
    const req = http.expectOne(BASE);
    expect(req.request.body).toEqual({ sms_opt_in: false });
    req.flush({ preferences: { sms_opt_in: false } });
  });

  it('propagates HTTP errors to the subscriber', () => {
    let errored = false;
    service.updateSmsOptIn(true).subscribe({ error: () => (errored = true) });

    http.expectOne(BASE).flush('error', { status: 400, statusText: 'Bad Request' });
    expect(errored).toBe(true);
  });
});

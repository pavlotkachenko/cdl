/**
 * Tests for BUG-001 and BUG-002 from HARD_BUGS_REGISTRY.md
 *
 * BUG-001: Auth interceptor must list every public auth endpoint so that
 *          error responses (401, 409, etc.) reach the calling component.
 * BUG-002: handle401Error must not hang when no refresh token is available.
 */
import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HTTP_INTERCEPTORS,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal AuthService stub that lets us control token / refreshToken values */
function createAuthServiceStub(overrides: Partial<AuthService> = {}) {
  return {
    getToken: () => null as string | null,
    getRefreshToken: () => null as string | null,
    refreshToken: () => {
      throw new Error('refreshToken() should not be called');
    },
    logout: () => ({ subscribe: () => {} }),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// BUG-001 — public endpoint coverage
// ---------------------------------------------------------------------------

describe('BUG-001: isPublicEndpoint coverage', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        {
          provide: AuthService,
          useValue: createAuthServiceStub({
            getToken: () => 'fake-token',
          }),
        },
        { provide: Router, useValue: { navigate: () => {} } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  // Every auth endpoint that Angular services call must be treated as public
  // (i.e. the interceptor must NOT attach a Bearer token to them).
  const publicPaths = [
    '/api/auth/signin',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/refresh',
    '/api/auth/verify-email',
  ];

  publicPaths.forEach((path) => {
    it(`should NOT add Authorization header to public endpoint: ${path}`, () => {
      http.post(`http://localhost:3000${path}`, {}).subscribe();

      const req = httpTesting.expectOne(`http://localhost:3000${path}`);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    });
  });

  it('should ADD Authorization header to a protected endpoint', () => {
    http.get('http://localhost:3000/api/notifications').subscribe();

    const req = httpTesting.expectOne('http://localhost:3000/api/notifications');
    expect(req.request.headers.get('Authorization')).toBe('Bearer fake-token');
    req.flush([]);
  });

  // The exact endpoint AuthService.login() uses
  it('should let 401 from /api/auth/signin reach the subscriber error callback', async () => {
    const promise = firstValueFrom(
      http.post('http://localhost:3000/api/auth/signin', {
        email: 'bad@test.com',
        password: 'wrong',
      }),
    ).catch((err: HttpErrorResponse) => err);

    const req = httpTesting.expectOne('http://localhost:3000/api/auth/signin');
    req.flush(
      { error: 'Invalid email or password' },
      { status: 401, statusText: 'Unauthorized' },
    );

    const result = await promise;
    expect(result).toBeInstanceOf(HttpErrorResponse);
    expect((result as HttpErrorResponse).status).toBe(401);
  });

  // The exact endpoint AuthService.register() uses
  it('should let 409 from /api/auth/register reach the subscriber error callback', async () => {
    const promise = firstValueFrom(
      http.post('http://localhost:3000/api/auth/register', {
        email: 'dup@test.com',
      }),
    ).catch((err: HttpErrorResponse) => err);

    const req = httpTesting.expectOne('http://localhost:3000/api/auth/register');
    req.flush(
      { error: 'Email already exists' },
      { status: 409, statusText: 'Conflict' },
    );

    const result = await promise;
    expect(result).toBeInstanceOf(HttpErrorResponse);
    expect((result as HttpErrorResponse).status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// BUG-002 — handle401Error must not hang
// ---------------------------------------------------------------------------

describe('BUG-002: handle401Error must not hang without refresh token', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    const authStub = createAuthServiceStub({
      getToken: () => 'expired-token',
      getRefreshToken: () => null, // no refresh token available
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true,
        },
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: { navigate: () => {} } },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  // BUG-002 is FIXED: handle401Error no longer hangs when no refresh token exists.
  it('should not hang forever on 401 from protected endpoint when no refresh token exists', async () => {
    const promise = firstValueFrom(
      http.get('http://localhost:3000/api/protected/resource'),
    ).then(
      () => 'success',
      () => 'error',
    );

    const req = httpTesting.expectOne('http://localhost:3000/api/protected/resource');
    req.flush(
      { error: 'Unauthorized' },
      { status: 401, statusText: 'Unauthorized' },
    );

    // If BUG-002 is present, this await hangs forever (test times out).
    // If fixed, it resolves to 'error' (the 401 propagates).
    const result = await promise;
    expect(['success', 'error']).toContain(result);
  }, 3000);
});

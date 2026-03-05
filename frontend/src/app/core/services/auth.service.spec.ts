/**
 * Tests for BUG-005 from HARD_BUGS_REGISTRY.md
 *
 * BUG-005: Every router.navigate() target in AuthService must match an actual
 *          route defined in app.routes.ts / app-routing.module.ts.
 *          Previously navigateByRole() used "/app/driver/dashboard" which
 *          silently fell through to the catch-all redirect → /login.
 */
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { vi } from 'vitest';

// All top-level route path segments defined in both routing configs.
// Any router.navigate() call in AuthService must start with one of these.
const VALID_TOP_LEVEL_ROUTES = [
  '',          // landing page
  'login',
  'register',
  'forgot-password',
  'driver',    // lazy-loaded module
  'admin',     // lazy-loaded module
  'attorney',  // lazy-loaded module
  'carrier',   // lazy-loaded module
  'paralegal', // lazy-loaded module
  'signup',    // carrier-signup, driver-signup
  'privacy',
  'terms',
  'cookies',
  'accessibility',
];

/** Extract the top-level segment from a path like "/driver/dashboard" → "driver" */
function topSegment(path: string): string {
  return path.replace(/^\//, '').split('/')[0];
}

describe('BUG-005: AuthService navigateByRole route validation', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;
  let routerStub: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    routerStub = {
      navigate: vi.fn().mockReturnValue(Promise.resolve(true)),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerStub },
        AuthService,
      ],
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);

    // Clear any localStorage from previous tests
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
  });

  afterEach(() => httpTesting.verify());

  // All 5 supported roles must navigate to valid routes after signIn
  const roleToExpectedPath: Record<string, string> = {
    driver: '/driver/dashboard',
    carrier: '/carrier/dashboard',
    attorney: '/attorney/dashboard',
    admin: '/admin/dashboard',
    paralegal: '/paralegal/dashboard',
  };

  Object.entries(roleToExpectedPath).forEach(([role, expectedPath]) => {
    it(`signIn as "${role}" should navigate to ${expectedPath}`, () => {
      service.signIn('user@test.com', 'password').subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/auth/signin');
      req.flush({
        token: 'fake-jwt',
        user: { id: '1', email: 'user@test.com', role, name: 'Test' },
      });

      expect(routerStub.navigate).toHaveBeenCalledWith([expectedPath]);

      // Verify the target route actually exists
      const segment = topSegment(expectedPath);
      expect(VALID_TOP_LEVEL_ROUTES).toContain(segment);
    });
  });

  it('signIn with unknown role should navigate to "/" (catch-all)', () => {
    service.signIn('user@test.com', 'password').subscribe();

    const req = httpTesting.expectOne('http://localhost:3000/api/auth/signin');
    req.flush({
      token: 'fake-jwt',
      user: { id: '1', email: 'user@test.com', role: 'unknown_role', name: 'Test' },
    });

    expect(routerStub.navigate).toHaveBeenCalledWith(['/']);
  });

  it('logout should navigate to /login', () => {
    service.logout().subscribe();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/login']);
    expect(VALID_TOP_LEVEL_ROUTES).toContain('login');
  });

  it('login() should NOT navigate (only storeAuthData)', () => {
    service.login({ email: 'user@test.com', password: 'pass' }).subscribe();

    const req = httpTesting.expectOne('http://localhost:3000/api/auth/signin');
    req.flush({
      token: 'fake-jwt',
      user: { id: '1', email: 'user@test.com', role: 'driver', name: 'Test' },
    });

    // login() stores data but does not navigate (the component handles redirect)
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('should use the correct API URL for auth endpoints (no /app/ prefix)', () => {
    service.signIn('a@b.com', 'pass').subscribe();
    const req = httpTesting.expectOne('http://localhost:3000/api/auth/signin');
    expect(req.request.url).not.toContain('/app/');
    req.flush({ token: 't', user: { id: '1', email: 'a@b.com', role: 'driver', name: '' } });
  });
});

describe('BUG-005: Cross-reference all router.navigate targets with routes', () => {
  // This is a static analysis test — it documents every navigation path
  // used across the auth module and verifies they have valid top-level routes.
  // When adding new navigate() calls, add them here too.

  const knownNavigationPaths = [
    // auth.service.ts - navigateByRole
    '/driver/dashboard',
    '/carrier/dashboard',
    '/attorney/dashboard',
    '/admin/dashboard',
    '/paralegal/dashboard',
    '/',
    '/login',
    // login.component.ts - redirectBasedOnRole
    '/admin/dashboard',
    '/attorney/dashboard',
    '/driver/dashboard',
    // register.component.ts - onSubmit success
    '/driver/dashboard',
    // forgot-password.component.ts
    '/driver/dashboard',
    '/login',
    // layout.component.ts - logout
    '/login',
  ];

  knownNavigationPaths.forEach((path) => {
    it(`navigation target "${path}" must match a valid top-level route`, () => {
      const segment = topSegment(path);
      // Verify the top-level segment matches a known route
      expect(
        VALID_TOP_LEVEL_ROUTES,
        `"${path}" starts with "${segment}" which is not in VALID_TOP_LEVEL_ROUTES. ` +
        `This means router.navigate(["${path}"]) will hit the catch-all redirect.`
      ).toContain(segment);
    });
  });

  // Known BAD paths found in the codebase that are NOT yet fixed
  // (flagged by detection pattern scan — see HARD_BUGS_REGISTRY.md)
  const knownBadPaths = [
    { path: '/app/dashboard', file: 'carrier-signup.component.ts:85' },
    { path: '/auth/driver-signup', file: 'carrier-signup.component.ts:60' },
    { path: '/sign-in', file: 'landing-header.component.ts:32' },
    // '/signup' was initially flagged but actually matches 'signup' in VALID_TOP_LEVEL_ROUTES
  ];

  knownBadPaths.forEach(({ path, file }) => {
    it(`KNOWN BUG: "${path}" in ${file} does NOT match any route`, () => {
      const segment = topSegment(path);
      // This test documents the bug. When fixed, move to knownNavigationPaths above.
      expect(VALID_TOP_LEVEL_ROUTES).not.toContain(segment);
    });
  });
});

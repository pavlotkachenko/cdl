/**
 * Tests for auth guards — Sprint 004 Story 8.4
 */
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {
  authGuard,
  driverGuard,
  adminGuard,
  attorneyGuard,
  operatorGuard,
  carrierGuard,
} from './auth.guard';
import { AuthService } from '../services/auth.service';

function runGuard(
  guard: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => unknown,
  route: Partial<ActivatedRouteSnapshot> = {},
  state: Partial<RouterStateSnapshot> = {}
) {
  return TestBed.runInInjectionContext(() =>
    guard(route as ActivatedRouteSnapshot, state as RouterStateSnapshot)
  );
}

describe('Auth Guards — Sprint 004', () => {
  let authStub: { isAuthenticated: ReturnType<typeof vi.fn>; getUserRole: ReturnType<typeof vi.fn> };
  let routerStub: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authStub = {
      isAuthenticated: vi.fn(),
      getUserRole: vi.fn(),
    };
    routerStub = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: routerStub },
      ],
    });
  });

  afterEach(() => TestBed.resetTestingModule());

  // ----------------------------------------------------------------
  // authGuard
  // ----------------------------------------------------------------
  describe('authGuard', () => {
    it('returns true when authenticated and no roles required', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('driver');
      const result = runGuard(authGuard, { data: {} }, { url: '/driver/dashboard' });
      expect(result).toBe(true);
    });

    it('navigates to /login with returnUrl when not authenticated', () => {
      authStub.isAuthenticated.mockReturnValue(false);
      runGuard(authGuard, { data: {} }, { url: '/driver/dashboard' });
      expect(routerStub.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/driver/dashboard' } }
      );
    });

    it('returns false when not authenticated', () => {
      authStub.isAuthenticated.mockReturnValue(false);
      const result = runGuard(authGuard, { data: {} }, { url: '/any' });
      expect(result).toBe(false);
    });

    it('returns true when authenticated and role matches data.roles', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('admin');
      const result = runGuard(authGuard, { data: { roles: ['admin'] } }, { url: '/admin' });
      expect(result).toBe(true);
    });

    it('navigates to /unauthorized when authenticated but role does not match', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('driver');
      runGuard(authGuard, { data: { roles: ['admin'] } }, { url: '/admin' });
      expect(routerStub.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });

    it('returns false when authenticated but role does not match', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('driver');
      const result = runGuard(authGuard, { data: { roles: ['admin'] } }, { url: '/admin' });
      expect(result).toBe(false);
    });
  });

  // ----------------------------------------------------------------
  // driverGuard
  // ----------------------------------------------------------------
  describe('driverGuard', () => {
    it('allows driver role', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('driver');
      expect(runGuard(driverGuard, { data: {} }, {})).toBe(true);
    });

    it('redirects to /unauthorized for attorney role', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('attorney');
      runGuard(driverGuard, { data: {} }, {});
      expect(routerStub.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });

    it('redirects to /login when unauthenticated', () => {
      authStub.isAuthenticated.mockReturnValue(false);
      runGuard(driverGuard, { data: {} }, { url: '/driver/dashboard' });
      expect(routerStub.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/driver/dashboard' } }
      );
    });
  });

  // ----------------------------------------------------------------
  // adminGuard
  // ----------------------------------------------------------------
  describe('adminGuard', () => {
    it('allows admin role', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('admin');
      expect(runGuard(adminGuard, { data: {} }, {})).toBe(true);
    });

    it('redirects driver to /unauthorized', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('driver');
      runGuard(adminGuard, { data: {} }, {});
      expect(routerStub.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });
  });

  // ----------------------------------------------------------------
  // attorneyGuard
  // ----------------------------------------------------------------
  describe('attorneyGuard', () => {
    it('allows attorney role', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('attorney');
      expect(runGuard(attorneyGuard, { data: {} }, {})).toBe(true);
    });

    it('allows paralegal role', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('paralegal');
      expect(runGuard(attorneyGuard, { data: {} }, {})).toBe(true);
    });

    it('redirects driver to /unauthorized', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('driver');
      runGuard(attorneyGuard, { data: {} }, {});
      expect(routerStub.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });
  });

  // ----------------------------------------------------------------
  // operatorGuard
  // ----------------------------------------------------------------
  describe('operatorGuard', () => {
    it('allows operator role', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('operator');
      expect(runGuard(operatorGuard, { data: {} }, {})).toBe(true);
    });

    it('redirects carrier to /unauthorized', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('carrier');
      runGuard(operatorGuard, { data: {} }, {});
      expect(routerStub.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });

    it('redirects unauthenticated to /login', () => {
      authStub.isAuthenticated.mockReturnValue(false);
      runGuard(operatorGuard, { data: {} }, { url: '/operator/dashboard' });
      expect(routerStub.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/operator/dashboard' } }
      );
    });
  });

  // ----------------------------------------------------------------
  // carrierGuard
  // ----------------------------------------------------------------
  describe('carrierGuard', () => {
    it('allows carrier role', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('carrier');
      expect(runGuard(carrierGuard, { data: {} }, {})).toBe(true);
    });

    it('redirects operator to /unauthorized', () => {
      authStub.isAuthenticated.mockReturnValue(true);
      authStub.getUserRole.mockReturnValue('operator');
      runGuard(carrierGuard, { data: {} }, {});
      expect(routerStub.navigate).toHaveBeenCalledWith(['/unauthorized']);
    });

    it('redirects unauthenticated to /login', () => {
      authStub.isAuthenticated.mockReturnValue(false);
      runGuard(carrierGuard, { data: {} }, { url: '/carrier/dashboard' });
      expect(routerStub.navigate).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/carrier/dashboard' } }
      );
    });
  });
});

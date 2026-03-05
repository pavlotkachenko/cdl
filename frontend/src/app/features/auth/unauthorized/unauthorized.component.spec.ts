/**
 * Tests for UnauthorizedComponent — Sprint 004 Story 8.4
 */
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UnauthorizedComponent } from './unauthorized.component';
import { AuthService } from '../../../core/services/auth.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('UnauthorizedComponent', () => {
  let fixture: ComponentFixture<UnauthorizedComponent>;
  let component: UnauthorizedComponent;
  let authStub: { getUserRole: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let routerStub: { navigate: ReturnType<typeof vi.fn> };

  function setup(role = 'driver') {
    authStub = { getUserRole: vi.fn().mockReturnValue(role), logout: vi.fn() };
    routerStub = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      imports: [UnauthorizedComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: routerStub },
      ],
    });

    fixture = TestBed.createComponent(UnauthorizedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('renders "Access Denied" heading', () => {
    setup();
    const h1: HTMLElement = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Access Denied');
  });

  it('goToDashboard() navigates to driver dashboard for driver role', () => {
    setup('driver');
    component.goToDashboard();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
  });

  it('goToDashboard() navigates to operator dashboard for operator role', () => {
    setup('operator');
    component.goToDashboard();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/operator/dashboard']);
  });

  it('goToDashboard() navigates to carrier dashboard for carrier role', () => {
    setup('carrier');
    component.goToDashboard();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/carrier/dashboard']);
  });

  it('goToDashboard() navigates to attorney dashboard for attorney role', () => {
    setup('attorney');
    component.goToDashboard();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/attorney/dashboard']);
  });

  it('goToDashboard() navigates to attorney dashboard for paralegal role', () => {
    setup('paralegal');
    component.goToDashboard();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/attorney/dashboard']);
  });

  it('signOut() calls authService.logout and navigates to /login', () => {
    setup();
    component.signOut();
    expect(authStub.logout).toHaveBeenCalled();
    expect(routerStub.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('dashboardUrl returns null when user has no role', () => {
    setup('');
    expect(component.dashboardUrl).toBeNull();
  });

  it('renders without crash when no role is set', () => {
    setup('');
    expect(fixture.nativeElement.querySelector('h1')).toBeTruthy();
  });
});

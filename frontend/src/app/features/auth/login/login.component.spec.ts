import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

const VALID = { email: 'test@example.com', password: 'password123' };

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authSpy: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
    getUserRole: ReturnType<typeof vi.fn>;
    currentUserValue: null;
  };
  let router: Router;
  let navigateSpy: ReturnType<typeof vi.spyOn>;
  let navigateByUrlSpy: ReturnType<typeof vi.spyOn>;
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    authSpy = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      login: vi.fn().mockReturnValue(of({ token: 'tok' })),
      getUserRole: vi.fn().mockReturnValue('driver'),
      currentUserValue: null,
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams: {} } } },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  // -------------------------------------------------------------------
  // ngOnInit
  // -------------------------------------------------------------------
  it('redirects already-authenticated users on init', () => {
    authSpy.isAuthenticated.mockReturnValue(true);
    component.ngOnInit();
    expect(navigateSpy).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------
  // onSubmit() — validation guard
  // -------------------------------------------------------------------
  it('does not call login when form is invalid', () => {
    component.loginForm.reset();
    component.onSubmit();
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('marks all fields touched when submitted invalid', () => {
    component.loginForm.reset();
    component.onSubmit();
    expect(component.loginForm.get('email')!.touched).toBe(true);
    expect(component.loginForm.get('password')!.touched).toBe(true);
  });

  // -------------------------------------------------------------------
  // onSubmit() — success paths
  // -------------------------------------------------------------------
  it('calls authService.login with email and password', () => {
    component.loginForm.patchValue(VALID);
    component.onSubmit();
    expect(authSpy.login).toHaveBeenCalledWith(VALID);
  });

  it('navigates to role dashboard after login when no returnUrl', () => {
    authSpy.getUserRole.mockReturnValue('admin');
    component.loginForm.patchValue(VALID);
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  it('navigates to returnUrl after successful login when returnUrl is set', () => {
    component.returnUrl = '/operator/dashboard';
    component.loginForm.patchValue(VALID);
    component.onSubmit();
    expect(navigateByUrlSpy).toHaveBeenCalledWith('/operator/dashboard');
  });

  it('shows success snackbar after login', () => {
    component.loginForm.patchValue(VALID);
    component.onSubmit();
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('successful'),
      expect.anything(),
      expect.any(Object),
    );
  });

  it('sets loading false after success', () => {
    component.loginForm.patchValue(VALID);
    component.onSubmit();
    expect(component.loading).toBe(false);
  });

  // -------------------------------------------------------------------
  // onSubmit() — error paths
  // -------------------------------------------------------------------
  it('shows "Invalid email or password" on 401', () => {
    authSpy.login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.loginForm.patchValue(VALID);
    component.onSubmit();
    expect(component.errorMessage).toContain('Invalid email or password');
  });

  it('shows disabled-account message on 403', () => {
    authSpy.login.mockReturnValue(throwError(() => ({ status: 403 })));
    component.loginForm.patchValue(VALID);
    component.onSubmit();
    expect(component.errorMessage).toContain('disabled');
  });

  it('shows connection error on status 0', () => {
    authSpy.login.mockReturnValue(throwError(() => ({ status: 0 })));
    component.loginForm.patchValue(VALID);
    component.onSubmit();
    expect(component.errorMessage).toContain('Cannot connect');
  });

  it('shows snackbar with error message on failure', () => {
    authSpy.login.mockReturnValue(throwError(() => ({ status: 401 })));
    component.loginForm.patchValue(VALID);
    component.onSubmit();
    expect(snackBarSpy).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------
  // redirectBasedOnRole()
  // -------------------------------------------------------------------
  it.each([
    ['admin', '/admin/dashboard'],
    ['attorney', '/attorney/dashboard'],
    ['paralegal', '/attorney/dashboard'],
    ['operator', '/operator/dashboard'],
    ['carrier', '/carrier/dashboard'],
    ['driver', '/driver/dashboard'],
  ])('redirectBasedOnRole navigates %s → %s', (role, expected) => {
    authSpy.getUserRole.mockReturnValue(role);
    component.redirectBasedOnRole();
    expect(navigateSpy).toHaveBeenCalledWith([expected]);
  });

  it('defaults to /driver/dashboard for unknown role', () => {
    authSpy.getUserRole.mockReturnValue('unknown');
    component.redirectBasedOnRole();
    expect(navigateSpy).toHaveBeenCalledWith(['/driver/dashboard']);
  });

  // -------------------------------------------------------------------
  // getErrorMessage()
  // -------------------------------------------------------------------
  it('getErrorMessage returns empty for untouched field', () => {
    expect(component.getErrorMessage('email')).toBe('');
  });

  it('getErrorMessage returns required message for touched empty email', () => {
    component.loginForm.get('email')!.markAsTouched();
    expect(component.getErrorMessage('email')).toContain('required');
  });

  it('getErrorMessage returns email validation message for invalid email', () => {
    const ctrl = component.loginForm.get('email')!;
    ctrl.setValue('notanemail');
    ctrl.markAsTouched();
    expect(component.getErrorMessage('email')).toContain('valid email');
  });

  // -------------------------------------------------------------------
  // togglePasswordVisibility()
  // -------------------------------------------------------------------
  it('togglePasswordVisibility flips hidePassword', () => {
    expect(component.hidePassword).toBe(true);
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBe(false);
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBe(true);
  });
});

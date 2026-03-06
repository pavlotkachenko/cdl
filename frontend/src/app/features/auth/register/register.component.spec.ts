import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const MOCK_ROUTE_DATA = { snapshot: { data: { role: 'driver' } } };

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authSpy: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
  };
  let navigateSpy: ReturnType<typeof vi.spyOn>;
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    authSpy = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      register: vi.fn().mockReturnValue(of({ user: { role: 'driver' } })),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: MOCK_ROUTE_DATA },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;

    const router = TestBed.inject(Router);
    navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);

    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  it('initialises with role from route data', () => {
    expect(component.role).toBe('driver');
  });

  it('redirects authenticated users on init', () => {
    authSpy.isAuthenticated.mockReturnValue(true);
    component.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/driver/dashboard']);
  });

  it('starts with all signals in default state', () => {
    expect(component.loading()).toBe(false);
    expect(component.errorMessage()).toBe('');
    expect(component.hidePassword()).toBe(true);
    expect(component.hideConfirmPassword()).toBe(true);
  });

  // ------------------------------------------------------------------
  // Password strength (computed)
  // ------------------------------------------------------------------
  it('passwordStrength is 0 for empty password', () => {
    expect(component.passwordStrength()).toBe(0);
    expect(component.passwordStrengthLabel()).toBe('');
  });

  it('passwordStrength computed increases with complexity', () => {
    component.registerForm.get('password')?.setValue('Abc1!xyz99999');
    fixture.detectChanges();
    expect(component.passwordStrength()).toBeGreaterThan(60);
    expect(component.passwordStrengthLabel()).toBe('Strong');
  });

  it('passwordStrengthColor returns warn for weak password', () => {
    component.registerForm.get('password')?.setValue('abc');
    fixture.detectChanges();
    expect(component.passwordStrengthColor()).toBe('warn');
  });

  // ------------------------------------------------------------------
  // onSubmit
  // ------------------------------------------------------------------
  it('onSubmit marks all controls touched when form invalid', () => {
    component.onSubmit();
    const touched = Object.keys(component.registerForm.controls)
      .every(k => component.registerForm.get(k)?.touched);
    expect(touched).toBe(true);
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('onSubmit calls register and navigates on success', () => {
    component.registerForm.setValue({
      name: 'John Doe', email: 'john@test.com', phone: '', cdlNumber: '',
      password: 'Test1!xyz', confirmPassword: 'Test1!xyz', acceptTerms: true,
    });
    component.onSubmit();
    expect(authSpy.register).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/driver/dashboard']);
    expect(component.loading()).toBe(false);
  });

  it('onSubmit sets errorMessage on 409 conflict', () => {
    authSpy.register.mockReturnValue(throwError(() => ({ status: 409 })));
    component.registerForm.setValue({
      name: 'John Doe', email: 'john@test.com', phone: '', cdlNumber: '',
      password: 'Test1!xyz', confirmPassword: 'Test1!xyz', acceptTerms: true,
    });
    component.onSubmit();
    expect(component.errorMessage()).toContain('Email already exists');
    expect(component.loading()).toBe(false);
  });

  it('onSubmit sets errorMessage on server error', () => {
    authSpy.register.mockReturnValue(throwError(() => ({ status: 500, error: { message: 'Server fail' } })));
    component.registerForm.setValue({
      name: 'John Doe', email: 'john@test.com', phone: '', cdlNumber: '',
      password: 'Test1!xyz', confirmPassword: 'Test1!xyz', acceptTerms: true,
    });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Server fail');
  });

  // ------------------------------------------------------------------
  // Validation helpers
  // ------------------------------------------------------------------
  it('getErrorMessage returns empty string for untouched field', () => {
    expect(component.getErrorMessage('email')).toBe('');
  });

  it('getErrorMessage returns required error for touched empty email', () => {
    const ctrl = component.registerForm.get('email')!;
    ctrl.markAsTouched();
    expect(component.getErrorMessage('email')).toContain('required');
  });
});

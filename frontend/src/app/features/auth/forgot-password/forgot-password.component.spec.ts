import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let authSpy: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    forgotPassword: ReturnType<typeof vi.fn>;
  };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    authSpy = {
      isAuthenticated: vi.fn().mockReturnValue(false),
      forgotPassword: vi.fn().mockReturnValue(of({ message: 'Sent' })),
    };
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;

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
  it('redirects authenticated users on init', () => {
    authSpy.isAuthenticated.mockReturnValue(true);
    component.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
  });

  it('starts with default signal state', () => {
    expect(component.loading()).toBe(false);
    expect(component.emailSent()).toBe(false);
    expect(component.errorMessage()).toBe('');
    expect(component.successMessage()).toBe('');
  });

  // ------------------------------------------------------------------
  // onSubmit
  // ------------------------------------------------------------------
  it('onSubmit marks controls touched when form invalid', () => {
    component.onSubmit();
    expect(authSpy.forgotPassword).not.toHaveBeenCalled();
    expect(component.forgotPasswordForm.get('email')?.touched).toBe(true);
  });

  it('onSubmit sets emailSent and successMessage on success', () => {
    component.forgotPasswordForm.setValue({ email: 'user@test.com' });
    component.onSubmit();
    expect(authSpy.forgotPassword).toHaveBeenCalledWith('user@test.com');
    expect(component.emailSent()).toBe(true);
    expect(component.successMessage()).toContain('sent to your email');
    expect(component.loading()).toBe(false);
  });

  it('onSubmit sets errorMessage on 404', () => {
    authSpy.forgotPassword.mockReturnValue(throwError(() => ({ status: 404 })));
    component.forgotPasswordForm.setValue({ email: 'nobody@test.com' });
    component.onSubmit();
    expect(component.errorMessage()).toContain('No account found');
    expect(component.emailSent()).toBe(false);
  });

  it('onSubmit sets errorMessage on server error', () => {
    authSpy.forgotPassword.mockReturnValue(throwError(() => ({ status: 500, error: { message: 'Fail' } })));
    component.forgotPasswordForm.setValue({ email: 'user@test.com' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Fail');
  });

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  it('resendEmail resets emailSent and successMessage', () => {
    component.emailSent.set(true);
    component.successMessage.set('Sent!');
    component.resendEmail();
    expect(component.emailSent()).toBe(false);
    expect(component.successMessage()).toBe('');
  });

  it('backToLogin navigates to /login', () => {
    component.backToLogin();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});

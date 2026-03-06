import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let authSpy: { resetPassword: ReturnType<typeof vi.fn> };
  let navigateSpy: ReturnType<typeof vi.spyOn>;
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    // Provide a valid token via URL hash
    Object.defineProperty(window, 'location', {
      value: { hash: '#access_token=test-token&type=recovery' },
      writable: true,
      configurable: true,
    });

    authSpy = {
      resetPassword: vi.fn().mockReturnValue(of({ message: 'Reset' })),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
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
  it('reads access_token from window.location.hash', () => {
    expect(component.tokenError()).toBe(false);
  });

  it('sets tokenError when hash has no access_token', () => {
    Object.defineProperty(window, 'location', {
      value: { hash: '' },
      writable: true,
      configurable: true,
    });
    component.ngOnInit();
    expect(component.tokenError()).toBe(true);
    expect(component.errorMessage()).toContain('Invalid or missing');
  });

  it('starts with default signal state', () => {
    expect(component.loading()).toBe(false);
    expect(component.successMessage()).toBe('');
    expect(component.hidePassword()).toBe(true);
    expect(component.hideConfirmPassword()).toBe(true);
  });

  // ------------------------------------------------------------------
  // onSubmit — password mismatch
  // ------------------------------------------------------------------
  it('onSubmit sets errorMessage when passwords do not match', () => {
    component.resetForm.setValue({ password: 'Abc123', confirmPassword: 'different' });
    component.onSubmit();
    expect(authSpy.resetPassword).not.toHaveBeenCalled();
    expect(component.errorMessage()).toContain('do not match');
  });

  // ------------------------------------------------------------------
  // onSubmit — success
  // ------------------------------------------------------------------
  it('onSubmit calls resetPassword and sets successMessage on success', () => {
    vi.useFakeTimers();
    component.resetForm.setValue({ password: 'Abc123', confirmPassword: 'Abc123' });
    component.onSubmit();
    expect(authSpy.resetPassword).toHaveBeenCalledWith('test-token', 'Abc123');
    expect(component.successMessage()).toContain('reset successfully');
    expect(component.loading()).toBe(false);
    vi.useRealTimers();
  });

  // ------------------------------------------------------------------
  // onSubmit — error
  // ------------------------------------------------------------------
  it('onSubmit sets errorMessage on server error', () => {
    authSpy.resetPassword.mockReturnValue(
      throwError(() => ({ error: { error: 'Link expired' } }))
    );
    component.resetForm.setValue({ password: 'Abc123', confirmPassword: 'Abc123' });
    component.onSubmit();
    expect(component.errorMessage()).toBe('Link expired');
    expect(component.loading()).toBe(false);
  });
});

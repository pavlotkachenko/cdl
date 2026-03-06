import {
  Component, OnInit, ChangeDetectionStrategy, inject, signal, computed, DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.value;
  if (!password) return null;
  const valid =
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return valid ? null : { passwordStrength: true };
}

function passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
  const pw = form.get('password')?.value;
  const confirm = form.get('confirmPassword')?.value;
  if (!pw || !confirm) return null;
  return pw === confirm ? null : { passwordMismatch: true };
}

const ROLE_DASHBOARDS: Record<string, string[]> = {
  carrier:   ['/carrier/dashboard'],
  attorney:  ['/attorney/dashboard'],
  admin:     ['/admin/dashboard'],
  paralegal: ['/paralegal/dashboard'],
};

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title><h1>Create Account</h1></mat-card-title>
          <mat-card-subtitle>Join CDL Ticket Management</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (errorMessage()) {
            <div class="error-alert" role="alert">
              <mat-icon aria-hidden="true">error</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Full Name</mat-label>
              <input matInput type="text" formControlName="name"
                     placeholder="John Doe" autocomplete="name" />
              <mat-icon matPrefix>person</mat-icon>
              @if (getErrorMessage('name')) {
                <mat-error>{{ getErrorMessage('name') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address</mat-label>
              <input matInput type="email" formControlName="email"
                     placeholder="your.email@example.com" autocomplete="email" />
              <mat-icon matPrefix>email</mat-icon>
              @if (getErrorMessage('email')) {
                <mat-error>{{ getErrorMessage('email') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone Number (Optional)</mat-label>
              <input matInput type="tel" inputmode="tel" formControlName="phone"
                     placeholder="+1234567890" autocomplete="tel" />
              <mat-icon matPrefix>phone</mat-icon>
              @if (getErrorMessage('phone')) {
                <mat-error>{{ getErrorMessage('phone') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>CDL Number (Optional)</mat-label>
              <input matInput type="text" inputmode="numeric" formControlName="cdlNumber"
                     placeholder="Enter your CDL number" autocomplete="off" />
              <mat-icon matPrefix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'"
                     formControlName="password" placeholder="Create a strong password"
                     autocomplete="new-password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      (click)="hidePassword.set(!hidePassword())"
                      [attr.aria-label]="'Toggle password visibility'">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (getErrorMessage('password')) {
                <mat-error>{{ getErrorMessage('password') }}</mat-error>
              }
            </mat-form-field>

            @if (registerForm.get('password')?.value) {
              <div class="password-strength">
                <div class="strength-label">
                  Password Strength:
                  <span [class]="'strength-' + passwordStrengthColor()">
                    {{ passwordStrengthLabel() }}
                  </span>
                </div>
                <mat-progress-bar mode="determinate"
                  [value]="passwordStrength()"
                  [color]="passwordStrengthColor()">
                </mat-progress-bar>
              </div>
            }

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'"
                     formControlName="confirmPassword" placeholder="Re-enter your password"
                     autocomplete="new-password" />
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button"
                      (click)="hideConfirmPassword.set(!hideConfirmPassword())"
                      [attr.aria-label]="'Toggle confirm password visibility'">
                <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (getErrorMessage('confirmPassword')) {
                <mat-error>{{ getErrorMessage('confirmPassword') }}</mat-error>
              }
            </mat-form-field>

            <div class="terms-checkbox">
              <mat-checkbox formControlName="acceptTerms">
                I agree to the
                <a href="/terms" target="_blank">Terms and Conditions</a>
                and
                <a href="/privacy" target="_blank">Privacy Policy</a>
              </mat-checkbox>
              @if (hasError('acceptTerms', 'required') && registerForm.get('acceptTerms')?.touched) {
                <mat-error>You must accept the terms and conditions</mat-error>
              }
            </div>

            <button mat-raised-button color="primary" type="submit"
                    class="full-width submit-button"
                    [disabled]="loading() || registerForm.invalid">
              @if (loading()) {
                <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                Creating account...
              } @else {
                Create Account
              }
            </button>
          </form>

          <div class="login-link">
            <p>Already have an account? <a routerLink="/login">Sign in</a></p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #1dad8c 0%, #0f8a6f 100%); padding: 20px; }
    .register-card { width: 100%; max-width: 550px; padding: 20px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
    mat-card-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
    mat-card-title h1 { margin: 0; font-size: 28px; font-weight: 600; color: #333; text-align: center; }
    mat-card-subtitle { font-size: 14px; color: #666; margin-top: 8px; text-align: center; }
    mat-card-content { padding: 0; }
    .error-alert { display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin-bottom: 20px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 4px; color: #c62828; }
    .full-width { width: 100%; margin-bottom: 4px; }
    .password-strength { margin-bottom: 16px; }
    .strength-label { font-size: 12px; color: #666; margin-bottom: 6px; }
    .strength-warn { color: #f44336; font-weight: 600; }
    .strength-accent { color: #ff9800; font-weight: 600; }
    .strength-primary { color: #4caf50; font-weight: 600; }
    .terms-checkbox { margin-bottom: 20px; }
    .terms-checkbox a { color: #1dad8c; text-decoration: none; }
    .submit-button { height: 48px; font-size: 16px; margin-bottom: 16px; }
    .button-spinner { display: inline-block; margin-right: 8px; }
    .login-link { text-align: center; margin-top: 16px; color: #666; font-size: 14px; }
    .login-link a { color: #1dad8c; text-decoration: none; font-weight: 600; }
  `],
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  role = '';
  registerForm!: FormGroup;

  loading = signal(false);
  errorMessage = signal('');
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);

  private passwordValue = signal('');

  readonly passwordStrength = computed(() => {
    const pw = this.passwordValue();
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s += 20;
    if (/[a-z]/.test(pw)) s += 15;
    if (/[A-Z]/.test(pw)) s += 15;
    if (/[0-9]/.test(pw)) s += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) s += 20;
    if (pw.length >= 12) s += 15;
    return Math.min(s, 100);
  });

  readonly passwordStrengthLabel = computed(() => {
    const s = this.passwordStrength();
    if (!s) return '';
    if (s < 40) return 'Weak';
    if (s < 70) return 'Medium';
    return 'Strong';
  });

  readonly passwordStrengthColor = computed(() => {
    const s = this.passwordStrength();
    if (s < 40) return 'warn';
    if (s < 70) return 'accent';
    return 'primary';
  });

  ngOnInit(): void {
    this.role = this.route.snapshot.data['role'] || 'driver';

    if (this.authService.isAuthenticated()) {
      this.navigateByRole(this.role);
      return;
    }

    this.registerForm = this.fb.group({
      name:            ['', [Validators.required, Validators.minLength(2)]],
      email:           ['', [Validators.required, Validators.email]],
      phone:           ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      cdlNumber:       [''],
      password:        ['', [Validators.required, Validators.minLength(8), passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms:     [false, [Validators.requiredTrue]],
    }, { validators: passwordMatchValidator });

    this.registerForm.get('password')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(pw => this.passwordValue.set(pw ?? ''));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(k =>
        this.registerForm.get(k)?.markAsTouched()
      );
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { name, email, phone, cdlNumber, password } = this.registerForm.value;

    this.authService.register({ name, email, phone: phone || undefined, cdlNumber: cdlNumber || undefined, password, role: this.role })
      .subscribe({
        next: (response: any) => {
          this.loading.set(false);
          this.snackBar.open('Registration successful! Welcome to CDL Ticket Management.', 'Close', { duration: 5000 });
          this.navigateByRole(response?.user?.role || this.role);
        },
        error: (error: any) => {
          this.loading.set(false);
          const msg =
            error.status === 409 ? 'Email already exists. Please use a different email.' :
            error.status === 400 ? (error.error?.message || 'Invalid registration data.') :
            error.status === 0  ? 'Cannot connect to server. Please try again later.' :
            (error.error?.message || 'Registration failed. Please try again.');
          this.errorMessage.set(msg);
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
      });
  }

  getErrorMessage(field: string): string {
    const control = this.registerForm?.get(field);
    if (!control?.touched) return '';
    if (control.hasError('required')) return `${this.fieldLabel(field)} is required`;
    if (control.hasError('email')) return 'Please enter a valid email address';
    if (control.hasError('minlength')) {
      const min = control.errors?.['minlength'].requiredLength;
      return `${this.fieldLabel(field)} must be at least ${min} characters`;
    }
    if (control.hasError('pattern') && field === 'phone') return 'Please enter a valid phone number';
    if (control.hasError('passwordStrength')) return 'Password must contain uppercase, lowercase, number, and special character';
    if (field === 'confirmPassword' && this.registerForm.hasError('passwordMismatch')) return 'Passwords do not match';
    return '';
  }

  hasError(field: string, error: string): boolean {
    const control = this.registerForm?.get(field);
    return !!(control?.hasError(error) && control.touched);
  }

  private fieldLabel(field: string): string {
    const labels: Record<string, string> = {
      name: 'Name', email: 'Email', phone: 'Phone',
      cdlNumber: 'CDL Number', password: 'Password', confirmPassword: 'Confirm Password',
    };
    return labels[field] ?? field;
  }

  private navigateByRole(role: string): void {
    this.router.navigate(ROLE_DASHBOARDS[role] ?? ['/driver/dashboard']);
  }
}

import { ChangeDetectionStrategy, Component, signal, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-carrier-signup-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="wizard-page">
      <div class="wizard-container">

        <!-- Header -->
        <div class="wizard-header">
          <img src="assets/icons/logo.svg" alt="CDL Advisor" class="wizard-logo" routerLink="/">
          <h1 class="wizard-title">Create Your Carrier Account</h1>
          <p class="wizard-step-label">Step {{ currentStep() }} of 4</p>
          <mat-progress-bar
            mode="determinate"
            [value]="progressValue()"
            class="wizard-progress">
          </mat-progress-bar>
        </div>

        <!-- Step 1: Company Info -->
        @if (currentStep() === 1) {
          <div class="wizard-step">
            <h2 class="step-title">Tell us about your company</h2>
            <form [formGroup]="companyForm" class="step-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Company Name</mat-label>
                <input matInput formControlName="companyName"
                       autocomplete="organization"
                       placeholder="Acme Trucking LLC">
                @if (companyForm.get('companyName')?.invalid && companyForm.get('companyName')?.touched) {
                  <mat-error>Company name is required (min 2 characters)</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>DOT Number</mat-label>
                <input matInput formControlName="dotNumber"
                       type="text" inputmode="numeric"
                       autocomplete="off"
                       placeholder="1234567">
                @if (companyForm.get('dotNumber')?.invalid && companyForm.get('dotNumber')?.touched) {
                  <mat-error>DOT number must be 6–8 digits</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Fleet Size (optional)</mat-label>
                <mat-select formControlName="fleetSize">
                  @for (size of fleetSizes; track size.value) {
                    <mat-option [value]="size.value">{{ size.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </form>
          </div>
        }

        <!-- Step 2: Account Credentials -->
        @if (currentStep() === 2) {
          <div class="wizard-step">
            <h2 class="step-title">Set up your account</h2>
            <form [formGroup]="accountForm" class="step-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email"
                       type="email" inputmode="email"
                       autocomplete="email"
                       placeholder="you@company.com">
                @if (accountForm.get('email')?.invalid && accountForm.get('email')?.touched) {
                  <mat-error>Valid email is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone"
                       type="tel" inputmode="tel"
                       autocomplete="tel"
                       placeholder="+1 (555) 000-0000">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput formControlName="password"
                       [type]="hidePassword() ? 'password' : 'text'"
                       autocomplete="new-password">
                <button mat-icon-button matSuffix type="button"
                        (click)="togglePassword()"
                        [attr.aria-label]="hidePassword() ? 'Show password' : 'Hide password'">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (accountForm.get('password')?.invalid && accountForm.get('password')?.touched) {
                  <mat-error>Password must be at least 8 characters</mat-error>
                }
              </mat-form-field>
            </form>
          </div>
        }

        <!-- Step 3: Add First Driver -->
        @if (currentStep() === 3) {
          <div class="wizard-step">
            <h2 class="step-title">Add your first driver</h2>
            <p class="step-description">You can add more drivers after setup</p>
            <form [formGroup]="driverForm" class="step-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Driver Name</mat-label>
                <input matInput formControlName="driverName"
                       autocomplete="name"
                       placeholder="John Smith">
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>CDL Number</mat-label>
                <input matInput formControlName="cdlNumber"
                       type="text" inputmode="numeric"
                       autocomplete="off"
                       placeholder="CDL1234567">
              </mat-form-field>
            </form>
            <p class="skip-hint">Both fields are optional — you can add drivers from your dashboard</p>
          </div>
        }

        <!-- Step 4: Complete -->
        @if (currentStep() === 4) {
          <div class="wizard-step wizard-success">
            <mat-icon class="success-icon">check_circle</mat-icon>
            <h2 class="step-title">You're all set!</h2>
            <ul class="success-list">
              <li><mat-icon>check</mat-icon> Company profile created</li>
              <li><mat-icon>check</mat-icon> Account secured</li>
              @if (driverForm.get('driverName')?.value) {
                <li><mat-icon>check</mat-icon> Driver added</li>
              }
            </ul>
          </div>
        }

        <!-- Error -->
        @if (errorMessage()) {
          <div class="error-alert" role="alert">
            <mat-icon>error_outline</mat-icon>
            {{ errorMessage() }}
          </div>
        }

        <!-- Navigation -->
        <div class="wizard-nav">
          @if (currentStep() > 1 && currentStep() < 4) {
            <button mat-stroked-button (click)="prevStep()" [disabled]="loading()">
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
          }

          @if (currentStep() < 3) {
            <button mat-raised-button color="primary"
                    (click)="nextStep()"
                    [disabled]="loading()"
                    class="next-btn">
              Next
              <mat-icon>arrow_forward</mat-icon>
            </button>
          }

          @if (currentStep() === 3) {
            <button mat-raised-button color="primary"
                    (click)="submit()"
                    [disabled]="loading()"
                    class="next-btn">
              @if (loading()) {
                Creating account...
              } @else {
                Create Account
              }
              <mat-icon>arrow_forward</mat-icon>
            </button>
          }

          @if (currentStep() === 4) {
            <button mat-raised-button color="primary"
                    (click)="goToDashboard()"
                    class="next-btn">
              Go to Dashboard
              <mat-icon>dashboard</mat-icon>
            </button>
          }
        </div>

        @if (currentStep() === 1) {
          <p class="sign-in-prompt">
            Already have an account?
            <a routerLink="/sign-in" class="sign-in-link">Sign in</a>
          </p>
        }
      </div>
    </div>
  `,
  styles: [`
    .wizard-page {
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 24px 16px 48px;
      background: #f5f5f5;
    }

    .wizard-container {
      width: 100%;
      max-width: 480px;
      background: #fff;
      border-radius: 12px;
      padding: 32px 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.08);
    }

    .wizard-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .wizard-logo {
      height: 40px;
      margin-bottom: 16px;
      cursor: pointer;
    }

    .wizard-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 4px;
      color: #1a1a2e;
    }

    .wizard-step-label {
      font-size: 0.85rem;
      color: #999;
      margin: 0 0 12px;
    }

    .wizard-progress {
      border-radius: 4px;
    }

    .wizard-step {
      margin-bottom: 24px;
    }

    .step-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0 0 16px;
      color: #1a1a2e;
    }

    .step-description {
      font-size: 0.9rem;
      color: #666;
      margin: -8px 0 16px;
    }

    .step-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .full-width {
      width: 100%;
    }

    .skip-hint {
      font-size: 0.8rem;
      color: #999;
      margin-top: 8px;
    }

    .wizard-success {
      text-align: center;
      padding: 16px 0;
    }

    .success-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .success-list {
      list-style: none;
      padding: 0;
      margin: 16px 0 0;
      text-align: left;
      display: inline-block;
    }

    .success-list li {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 0.95rem;
      color: #333;
    }

    .success-list mat-icon {
      color: #4caf50;
      font-size: 1.1rem;
      width: 1.1rem;
      height: 1.1rem;
    }

    .error-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fff3f3;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      color: #721c24;
      font-size: 0.9rem;
      margin-bottom: 16px;
    }

    .wizard-nav {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .next-btn {
      flex: 1;
      min-height: 48px;
    }

    .sign-in-prompt {
      text-align: center;
      font-size: 0.9rem;
      color: #666;
      margin-top: 20px;
    }

    .sign-in-link {
      color: #1976d2;
      text-decoration: none;
      font-weight: 500;
    }

    .sign-in-link:hover {
      text-decoration: underline;
    }
  `]
})
export class CarrierSignupWizardComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  currentStep = signal(1);
  loading = signal(false);
  errorMessage = signal('');
  hidePassword = signal(true);

  progressValue = computed(() => ((this.currentStep() - 1) / 3) * 100);

  fleetSizes = [
    { value: 'small', label: '1–10 trucks' },
    { value: 'medium', label: '11–50 trucks' },
    { value: 'large', label: '50+ trucks' }
  ];

  companyForm = this.fb.group({
    companyName: ['', [Validators.required, Validators.minLength(2)]],
    dotNumber: ['', [Validators.required, Validators.pattern(/^\d{6,8}$/)]],
    fleetSize: ['small']
  });

  accountForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  driverForm = this.fb.group({
    driverName: [''],
    cdlNumber: ['']
  });

  togglePassword(): void {
    this.hidePassword.update(v => !v);
  }

  nextStep(): void {
    this.errorMessage.set('');
    if (this.currentStep() === 1 && this.companyForm.invalid) {
      this.companyForm.markAllAsTouched();
      return;
    }
    if (this.currentStep() === 2 && this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }
    this.currentStep.update(s => s + 1);
  }

  prevStep(): void {
    this.errorMessage.set('');
    this.currentStep.update(s => s - 1);
  }

  submit(): void {
    this.errorMessage.set('');
    this.loading.set(true);

    const { companyName, dotNumber, fleetSize } = this.companyForm.value;
    const { email, phone, password } = this.accountForm.value;

    this.authService.register({
      name: companyName!,
      email: email!,
      phone: phone || undefined,
      password: password!,
      role: 'carrier'
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.currentStep.set(4);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 409) {
          this.errorMessage.set('An account with this email already exists.');
        } else if (err.status === 0) {
          this.errorMessage.set('Cannot connect to server. Please try again.');
        } else {
          this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
        }
        this.snackBar.open(this.errorMessage(), 'Close', { duration: 5000 });
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/carrier/dashboard']);
  }
}

import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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
  ],
  template: `
    <div class="rp-container">
      <mat-card class="rp-card">
        <mat-card-header>
          <mat-card-title><h1>Reset Password</h1></mat-card-title>
          <mat-card-subtitle>Enter your new password</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (successMessage()) {
            <div class="success-alert" role="status">
              <mat-icon aria-hidden="true">check_circle</mat-icon>
              <div class="message-content">
                <h3>Password Reset!</h3>
                <p>{{ successMessage() }}</p>
                <p class="small-text">You will be redirected to the login page shortly.</p>
              </div>
            </div>
          }

          @if (errorMessage() && !successMessage()) {
            <div class="error-alert" role="alert">
              <mat-icon aria-hidden="true">error</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          @if (tokenError() && !successMessage()) {
            <div class="token-error-actions">
              <button mat-raised-button color="primary" class="full-width" routerLink="/forgot-password">
                <mat-icon>email</mat-icon>
                Request New Reset Link
              </button>
              <button mat-button class="full-width" routerLink="/login">
                <mat-icon>arrow_back</mat-icon>
                Back to Login
              </button>
            </div>
          }

          @if (!tokenError() && !successMessage()) {
            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'"
                       formControlName="password" placeholder="Enter new password"
                       autocomplete="new-password" />
                <button mat-icon-button matSuffix type="button"
                        (click)="hidePassword.set(!hidePassword())"
                        aria-label="Toggle password visibility">
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (resetForm.get('password')?.touched && resetForm.get('password')?.hasError('required')) {
                  <mat-error>Password is required</mat-error>
                }
                @if (resetForm.get('password')?.touched && resetForm.get('password')?.hasError('minlength')) {
                  <mat-error>Password must be at least 6 characters</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm Password</mat-label>
                <input matInput [type]="hideConfirmPassword() ? 'password' : 'text'"
                       formControlName="confirmPassword" placeholder="Confirm new password"
                       autocomplete="new-password" />
                <button mat-icon-button matSuffix type="button"
                        (click)="hideConfirmPassword.set(!hideConfirmPassword())"
                        aria-label="Toggle confirm password visibility">
                  <mat-icon>{{ hideConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (resetForm.get('confirmPassword')?.touched && resetForm.get('confirmPassword')?.hasError('required')) {
                  <mat-error>Please confirm your password</mat-error>
                }
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit"
                      class="full-width submit-button"
                      [disabled]="loading() || resetForm.invalid">
                @if (loading()) {
                  <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                  Resetting...
                } @else {
                  Reset Password
                }
              </button>

              <div class="back-to-login">
                <button mat-button type="button" routerLink="/login" class="full-width">
                  <mat-icon>arrow_back</mat-icon>
                  Back to Login
                </button>
              </div>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .rp-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #1dad8c 0%, #0f8a6f 100%); padding: 20px; }
    .rp-card { width: 100%; max-width: 500px; padding: 20px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
    mat-card-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
    mat-card-title h1 { margin: 0; font-size: 28px; font-weight: 600; color: #333; text-align: center; }
    mat-card-subtitle { font-size: 14px; color: #666; margin-top: 8px; text-align: center; }
    mat-card-content { padding: 0; }
    .success-alert { display: flex; align-items: flex-start; gap: 12px; padding: 16px; margin-bottom: 20px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px; color: #2e7d32; }
    .success-alert h3 { margin: 0 0 4px; }
    .success-alert p { margin: 0; }
    .small-text { font-size: 12px; color: #666; margin-top: 8px !important; }
    .error-alert { display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin-bottom: 20px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 4px; color: #c62828; }
    .token-error-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
    .full-width { width: 100%; }
    .submit-button { height: 48px; font-size: 16px; margin-bottom: 8px; }
    .button-spinner { display: inline-block; margin-right: 8px; }
    .back-to-login { margin-top: 8px; }
  `],
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  resetForm!: FormGroup;

  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  tokenError = signal(false);

  private accessToken = '';

  ngOnInit(): void {
    this.resetForm = this.fb.group({
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });

    // Supabase redirects with tokens in the URL hash fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    this.accessToken = params.get('access_token') || '';

    if (!this.accessToken) {
      this.route.queryParams.subscribe(qp => {
        this.accessToken = qp['access_token'] || qp['token'] || '';
        if (!this.accessToken) {
          this.tokenError.set(true);
          this.errorMessage.set('Invalid or missing reset token. Please request a new password reset.');
        }
      });
    }
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      Object.keys(this.resetForm.controls).forEach(k =>
        this.resetForm.get(k)?.markAsTouched()
      );
      return;
    }

    const { password, confirmPassword } = this.resetForm.value;

    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.resetPassword(this.accessToken, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Password has been reset successfully!');
        this.snackBar.open('Password reset successful! Redirecting to login...', 'Close', { duration: 3000 });
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (error: any) => {
        this.loading.set(false);
        const msg = error.error?.error || 'Failed to reset password. The link may have expired.';
        this.errorMessage.set(msg);
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      },
    });
  }
}

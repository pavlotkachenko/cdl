import { Component, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
  selector: 'app-forgot-password',
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
    <div class="fp-container">
      <mat-card class="fp-card">
        <mat-card-header>
          <mat-card-title><h1>Forgot Password?</h1></mat-card-title>
          <mat-card-subtitle>Enter your email to reset your password</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (emailSent() && successMessage()) {
            <div class="success-alert" role="status">
              <mat-icon aria-hidden="true">check_circle</mat-icon>
              <div class="message-content">
                <h3>Email Sent!</h3>
                <p>{{ successMessage() }}</p>
                <p class="small-text">
                  Please check your email inbox (and spam folder) for the password reset link.
                </p>
              </div>
            </div>
          }

          @if (errorMessage() && !emailSent()) {
            <div class="error-alert" role="alert">
              <mat-icon aria-hidden="true">error</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          @if (!emailSent()) {
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
              <div class="info-text">
                <mat-icon aria-hidden="true">info</mat-icon>
                <p>Enter the email address associated with your account and we'll send you a link to reset your password.</p>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email Address</mat-label>
                <input matInput type="email" inputmode="email" formControlName="email"
                       placeholder="your.email@example.com" autocomplete="email" />
                <mat-icon matPrefix>email</mat-icon>
                @if (getErrorMessage('email')) {
                  <mat-error>{{ getErrorMessage('email') }}</mat-error>
                }
              </mat-form-field>

              <button mat-raised-button color="primary" type="submit"
                      class="full-width submit-button"
                      [disabled]="loading() || forgotPasswordForm.invalid">
                @if (loading()) {
                  <mat-spinner diameter="20" class="button-spinner"></mat-spinner>
                  Sending...
                } @else {
                  Send Reset Link
                }
              </button>

              <div class="back-to-login">
                <button mat-button type="button" class="full-width" (click)="backToLogin()">
                  <mat-icon>arrow_back</mat-icon>
                  Back to Login
                </button>
              </div>
            </form>
          } @else {
            <div class="email-sent-actions">
              <button mat-raised-button color="primary" class="full-width" (click)="backToLogin()">
                <mat-icon>login</mat-icon>
                Back to Login
              </button>
              <button mat-button class="full-width resend-button" (click)="resendEmail()">
                <mat-icon>refresh</mat-icon>
                Resend Email
              </button>
            </div>
          }

          <div class="help-text">
            <mat-icon aria-hidden="true">help_outline</mat-icon>
            <p>Need help? <a href="mailto:support@cdlticketmanagement.com">Contact Support</a></p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .fp-container { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #1dad8c 0%, #0f8a6f 100%); padding: 20px; }
    .fp-card { width: 100%; max-width: 500px; padding: 20px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
    mat-card-header { display: flex; flex-direction: column; align-items: center; margin-bottom: 24px; }
    mat-card-title h1 { margin: 0; font-size: 28px; font-weight: 600; color: #333; text-align: center; }
    mat-card-subtitle { font-size: 14px; color: #666; margin-top: 8px; text-align: center; }
    mat-card-content { padding: 0; }
    .success-alert { display: flex; align-items: flex-start; gap: 12px; padding: 16px; margin-bottom: 20px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px; color: #2e7d32; }
    .success-alert mat-icon { margin-top: 2px; flex-shrink: 0; }
    .success-alert h3 { margin: 0 0 4px; }
    .success-alert p { margin: 0; }
    .small-text { font-size: 12px; color: #666; margin-top: 8px !important; }
    .error-alert { display: flex; align-items: center; gap: 12px; padding: 12px 16px; margin-bottom: 20px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 4px; color: #c62828; }
    .info-text { display: flex; align-items: flex-start; gap: 8px; color: #666; font-size: 14px; margin-bottom: 20px; }
    .info-text mat-icon { color: #1dad8c; flex-shrink: 0; margin-top: 2px; }
    .info-text p { margin: 0; line-height: 1.5; }
    .full-width { width: 100%; }
    .submit-button { height: 48px; font-size: 16px; margin-bottom: 8px; }
    .button-spinner { display: inline-block; margin-right: 8px; }
    .back-to-login { margin-top: 8px; }
    .email-sent-actions { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .resend-button { color: #666; }
    .help-text { display: flex; align-items: center; gap: 8px; color: #888; font-size: 13px; margin-top: 20px; justify-content: center; }
    .help-text mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .help-text a { color: #1dad8c; text-decoration: none; }
  `],
})
export class ForgotPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  forgotPasswordForm!: FormGroup;

  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  emailSent = signal(false);

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/driver/dashboard']);
      return;
    }

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      Object.keys(this.forgotPasswordForm.controls).forEach(k =>
        this.forgotPasswordForm.get(k)?.markAsTouched()
      );
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.forgotPassword(this.forgotPasswordForm.value.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.emailSent.set(true);
        this.successMessage.set('Password reset instructions have been sent to your email address.');
        this.snackBar.open('Password reset email sent! Please check your inbox.', 'Close', { duration: 5000 });
        this.forgotPasswordForm.reset();
      },
      error: (error: any) => {
        this.loading.set(false);
        const msg =
          error.status === 404 ? 'No account found with this email address.' :
          error.status === 429 ? 'Too many requests. Please try again later.' :
          error.status === 0   ? 'Cannot connect to server. Please try again later.' :
          (error.error?.message || 'Failed to send reset email. Please try again.');
        this.errorMessage.set(msg);
        this.snackBar.open(msg, 'Close', { duration: 5000 });
      },
    });
  }

  resendEmail(): void {
    this.emailSent.set(false);
    this.successMessage.set('');
  }

  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  getErrorMessage(field: string): string {
    const control = this.forgotPasswordForm?.get(field);
    if (!control?.touched) return '';
    if (control.hasError('required')) return 'Email is required';
    if (control.hasError('email')) return 'Please enter a valid email address';
    return '';
  }

  hasError(field: string, error: string): boolean {
    const control = this.forgotPasswordForm?.get(field);
    return !!(control?.hasError(error) && control.touched);
  }
}

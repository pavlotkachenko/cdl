
// ============================================
// FORGOT PASSWORD COMPONENT - Complete Implementation
// Location: frontend/src/app/features/auth/forgot-password/forgot-password.component.ts
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class ForgotPasswordComponent implements OnInit {
  forgotPasswordForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  emailSent = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/driver/dashboard']);
      return;
    }

    // Initialize reactive form
    this.forgotPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // ============================================
  // Submit forgot password form
  // ============================================
  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    if (this.forgotPasswordForm.invalid) {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email } = this.forgotPasswordForm.value;

    // Call auth service forgot password
    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        console.log('✅ Password reset email sent:', response);
        this.loading = false;
        this.emailSent = true;
        this.successMessage = 'Password reset instructions have been sent to your email address.';

        // Show success snackbar
        this.snackBar.open(
          'Password reset email sent! Please check your inbox.',
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          }
        );

        // Reset form
        this.forgotPasswordForm.reset();
      },
      error: (error) => {
        console.error('❌ Forgot password error:', error);
        this.loading = false;

        // Handle different error scenarios
        if (error.status === 404) {
          this.errorMessage = 'No account found with this email address.';
        } else if (error.status === 429) {
          this.errorMessage = 'Too many requests. Please try again later.';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please try again later.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to send reset email. Please try again.';
        }

        // Show error snackbar
        this.snackBar.open(this.errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // ============================================
  // Resend email
  // ============================================
  resendEmail(): void {
    this.emailSent = false;
    this.successMessage = '';
  }

  // ============================================
  // Go back to login
  // ============================================
  backToLogin(): void {
    this.router.navigate(['/login']);
  }

  // ============================================
  // Form validation helpers
  // ============================================
  getErrorMessage(field: string): string {
    const control = this.forgotPasswordForm.get(field);
    
    if (!control || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Email is required';
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }

    return '';
  }

  // ============================================
  // Check if field has error
  // ============================================
  hasError(field: string, error: string): boolean {
    const control = this.forgotPasswordForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }
}

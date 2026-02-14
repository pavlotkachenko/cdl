// ============================================
// Forgot Password Component
// Location: frontend/src/app/features/auth/forgot-password/forgot-password.component.ts
// ============================================

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSnackBarModule
  ]
})
export class ForgotPasswordComponent {
  forgotForm!: FormGroup;
  loading = false;
  emailSent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { email } = this.forgotForm.value;

    // Mock implementation
    setTimeout(() => {
      this.loading = false;
      this.emailSent = true;
      this.snackBar.open('Password reset email sent!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    }, 1500);

    /* Production:
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        this.emailSent = true;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'Error sending email', 'Close');
      }
    });
    */
  }

  getErrorMessage(): string {
    const control = this.forgotForm.get('email');
    if (control?.hasError('required')) return 'Email is required';
    if (control?.hasError('email')) return 'Please enter a valid email';
    return '';
  }
}

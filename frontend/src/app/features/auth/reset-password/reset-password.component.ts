import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
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
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  hidePassword = true;
  hideConfirmPassword = true;
  accessToken = '';
  tokenError = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });

    // Supabase redirects with tokens in the URL hash fragment:
    // /reset-password#access_token=xxx&refresh_token=yyy&type=recovery
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    this.accessToken = params.get('access_token') || '';

    if (!this.accessToken) {
      // Also check query params as fallback
      this.route.queryParams.subscribe(qp => {
        this.accessToken = qp['access_token'] || qp['token'] || '';
        if (!this.accessToken) {
          this.tokenError = true;
          this.errorMessage = 'Invalid or missing reset token. Please request a new password reset.';
        }
      });
    }
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      Object.keys(this.resetForm.controls).forEach(key => {
        this.resetForm.get(key)?.markAsTouched();
      });
      return;
    }

    const { password, confirmPassword } = this.resetForm.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.accessToken, password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Password has been reset successfully!';
        this.snackBar.open('Password reset successful! Redirecting to login...', 'Close', { duration: 3000 });
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.error || 'Failed to reset password. The link may have expired.';
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }
}

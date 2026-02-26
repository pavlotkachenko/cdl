// ============================================
// LOGIN COMPONENT - Complete Implementation
// Location: frontend/src/app/features/auth/login/login.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
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
    MatCheckboxModule,
    MatDividerModule,
    MatSnackBarModule
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';
  returnUrl: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
      return;
    }

    // Get return URL from route parameters or default to empty
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    // Initialize reactive form with validators
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnDestroy(): void {
    // Clean up form to prevent memory leaks
    if (this.loginForm) {
      this.loginForm.reset();
    }
  }

  // ============================================
  // Submit login form
  // ============================================
  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    // Call auth service login
    this.authService.login({ email, password }).subscribe({
      next: (user) => {
        console.log('✅ Login successful:', user);
        this.loading = false;
        
        // Show success message
        this.snackBar.open('Login successful! Welcome back.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Redirect based on role or returnUrl
        if (this.returnUrl && this.returnUrl !== '/login') {
          this.router.navigate([this.returnUrl]);
        } else {
          this.redirectBasedOnRole();
        }
      },
      error: (error) => {
        console.error('❌ Login error:', error);
        this.loading = false;
        
        // Handle different error scenarios
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (error.status === 403) {
          this.errorMessage = 'Your account has been disabled. Please contact support.';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please try again later.';
        } else {
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
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
  // Redirect based on user role
  // ============================================
  private redirectBasedOnRole(): void {
    const user = this.authService.currentUserValue;
    
    if (!user) {
      console.log('No user found, staying on login');
      return;
    }

    console.log('🔄 Redirecting based on role:', user.role);

    // Redirect based on role
    switch (user.role) {
      case 'admin':
        console.log('→ Redirecting to /admin/dashboard');
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'attorney':
        console.log('→ Redirecting to /attorney/dashboard');
        this.router.navigate(['/attorney/dashboard']);
        break;
      case 'paralegal':
        console.log('→ Redirecting to /attorney/dashboard');
        this.router.navigate(['/attorney/dashboard']);
        break;
      case 'driver':
      default:
        console.log('→ Redirecting to /driver/dashboard');
        this.router.navigate(['/driver/dashboard']);
        break;
    }
  }

  // ============================================
  // Toggle password visibility
  // ============================================
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  // ============================================
  // Social login methods (placeholder)
  // ============================================
  loginWithGoogle(): void {
    this.snackBar.open('Google login coming soon!', 'Close', { duration: 3000 });
    // TODO: Implement Google OAuth
  }

  loginWithFacebook(): void {
    this.snackBar.open('Facebook login coming soon!', 'Close', { duration: 3000 });
    // TODO: Implement Facebook OAuth
  }

  // ============================================
  // Form validation helpers
  // ============================================
  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    
    if (!control || !control.touched) {
      return '';
    }

    if (control.hasError('required')) {
      return `${this.getFieldName(field)} is required`;
    }

    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }

    if (control.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `${this.getFieldName(field)} must be at least ${minLength} characters`;
    }

    return '';
  }

  private getFieldName(field: string): string {
    const fieldNames: { [key: string]: string } = {
      email: 'Email',
      password: 'Password'
    };
    return fieldNames[field] || field;
  }

  // ============================================
  // Check if field has error
  // ============================================
  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }
}

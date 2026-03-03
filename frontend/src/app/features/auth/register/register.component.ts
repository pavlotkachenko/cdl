// ============================================
// REGISTER COMPONENT - Complete Implementation
// Location: frontend/src/app/features/auth/register/register.component.ts
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
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
    MatSelectModule,
    MatProgressBarModule,
    MatSnackBarModule
  ]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';
  passwordStrength: number = 0;
  passwordStrengthLabel: string = '';

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

    // Initialize reactive form with validators
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      cdlNumber: [''],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Watch password field for strength calculation
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password);
    });
  }

  // ============================================
  // Submit registration form
  // ============================================
  onSubmit(): void {
    // Mark all fields as touched to show validation errors
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { name, email, phone, cdlNumber, password } = this.registerForm.value;

    // Call auth service register
    this.authService.register({
      name,
      email,
      phone: phone || undefined,
      cdlNumber: cdlNumber || undefined,
      password
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Registration successful:', response);
        this.loading = false;

        // Show success message
        this.snackBar.open('Registration successful! Welcome to CDL Ticket Management.', 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });

        // Redirect to dashboard
        this.router.navigate(['/driver/dashboard']);
      },
      error: (error: any) => {
        console.error('❌ Registration error:', error);
        this.loading = false;

        // Handle different error scenarios
        if (error.status === 409) {
          this.errorMessage = 'Email already exists. Please use a different email.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.message || 'Invalid registration data. Please check your inputs.';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please try again later.';
        } else {
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
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
  // Password strength validator
  // ============================================
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    
    if (!password) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumeric = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return passwordValid ? null : { passwordStrength: true };
  }

  // ============================================
  // Password match validator
  // ============================================
  private passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // ============================================
  // Calculate password strength (0-100)
  // ============================================
  private calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthLabel = '';
      return;
    }

    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numeric: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      longLength: password.length >= 12
    };

    // Calculate strength
    if (checks.length) strength += 20;
    if (checks.lowercase) strength += 15;
    if (checks.uppercase) strength += 15;
    if (checks.numeric) strength += 15;
    if (checks.special) strength += 20;
    if (checks.longLength) strength += 15;

    this.passwordStrength = Math.min(strength, 100);

    // Set label
    if (this.passwordStrength < 40) {
      this.passwordStrengthLabel = 'Weak';
    } else if (this.passwordStrength < 70) {
      this.passwordStrengthLabel = 'Medium';
    } else {
      this.passwordStrengthLabel = 'Strong';
    }
  }

  // ============================================
  // Get password strength color
  // ============================================
  getPasswordStrengthColor(): string {
    if (this.passwordStrength < 40) return 'warn';
    if (this.passwordStrength < 70) return 'accent';
    return 'primary';
  }

  // ============================================
  // Toggle password visibility
  // ============================================
  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.hidePassword = !this.hidePassword;
    } else {
      this.hideConfirmPassword = !this.hideConfirmPassword;
    }
  }

  // ============================================
  // Form validation helpers
  // ============================================
  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    
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

    if (control.hasError('pattern')) {
      if (field === 'phone') {
        return 'Please enter a valid phone number';
      }
    }

    if (control.hasError('passwordStrength')) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }

    if (field === 'confirmPassword' && this.registerForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }

    return '';
  }

  private getFieldName(field: string): string {
    const fieldNames: { [key: string]: string } = {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      cdlNumber: 'CDL Number',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      acceptTerms: 'Terms and Conditions'
    };
    return fieldNames[field] || field;
  }

  // ============================================
  // Check if field has error
  // ============================================
  hasError(field: string, error: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }
}

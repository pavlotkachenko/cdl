// ============================================
// Register Component (COMPLETE - All methods)
// Location: frontend/src/app/features/auth/register/register.component.ts
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { AuthService, User } from '../../../core/services/auth.service';

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
    MatProgressBarModule,
    MatCheckboxModule,
    MatDividerModule
  ]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  errorMessage = '';
  
  // Password strength
  passwordStrength = 0;
  passwordStrengthLabel = '';
  passwordStrengthColor: 'primary' | 'accent' | 'warn' = 'primary';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
      return;
    }

    // Initialize form
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      cdlNumber: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{8,}$/)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });

    // Subscribe to password changes for strength indicator
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.calculatePasswordStrength(password || '');
    });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { name, email, password, phone, cdlNumber } = this.registerForm.value;

    // Use mock register for development
    this.authService.mockRegister({
      name,
      email,
      password,
      phone,
      cdlNumber
    }).subscribe({
      next: (user: User) => {
        console.log('✅ Registration successful:', user);
        this.loading = false;
        
        // Redirect based on role
        this.redirectBasedOnRole();
      },
      error: (error: any) => {
        console.error('❌ Registration error:', error);
        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  private redirectBasedOnRole(): void {
    const user = this.authService.currentUserValue;
    
    if (!user) {
      console.log('No user found, staying on register');
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

  // Social registration methods
  registerWithGoogle(): void {
    console.log('Google registration not implemented yet');
    // TODO: Implement Google OAuth
  }

  registerWithFacebook(): void {
    console.log('Facebook registration not implemented yet');
    // TODO: Implement Facebook OAuth
  }

  // Password strength calculator
  private calculatePasswordStrength(password: string): void {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    this.passwordStrength = Math.min(strength, 100);

    // Set label and color
    if (this.passwordStrength < 30) {
      this.passwordStrengthLabel = 'Weak';
      this.passwordStrengthColor = 'warn';
    } else if (this.passwordStrength < 70) {
      this.passwordStrengthLabel = 'Medium';
      this.passwordStrengthColor = 'primary';
    } else {
      this.passwordStrengthLabel = 'Strong';
      this.passwordStrengthColor = 'accent';
    }
  }

  // Form validation helpers
  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    
    if (!control) {
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
        return 'Please enter a valid 10-digit phone number';
      }
      if (field === 'cdlNumber') {
        return 'Please enter a valid CDL number';
      }
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
      confirmPassword: 'Confirm Password'
    };
    return fieldNames[field] || field;
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}

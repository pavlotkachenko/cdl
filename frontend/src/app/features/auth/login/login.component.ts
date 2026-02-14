// ============================================
// Login Component (COMPLETE - with cleanup)
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

// Services
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
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
    MatDividerModule
  ]
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  loading = false;
  hidePassword = true;
  errorMessage = '';
  returnUrl: string = '/login';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
      return;
    }

    // Get return URL or use role-based redirect
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    // Initialize form
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnDestroy(): void {
    // Clean up form to prevent FormGroup error during navigation
    if (this.loginForm) {
      this.loginForm.reset();
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    // Use mock login for development
    this.authService.mockLogin(email, password).subscribe({
      next: (user) => {
        console.log('✅ Login successful:', user);
        this.loading = false;
        
        // Redirect based on role or returnUrl
        if (this.returnUrl && this.returnUrl !== '/login') {
          this.router.navigate([this.returnUrl]);
        } else {
          this.redirectBasedOnRole();
        }
      },
      error: (error) => {
        console.error('❌ Login error:', error);
        this.errorMessage = 'Invalid email or password';
        this.loading = false;
      }
    });
  }

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

  // Social login methods
  loginWithGoogle(): void {
    console.log('Google login not implemented yet');
    // TODO: Implement Google OAuth
  }

  loginWithFacebook(): void {
    console.log('Facebook login not implemented yet');
    // TODO: Implement Facebook OAuth
  }

  // Form validation helpers
  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    
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

    return '';
  }

  private getFieldName(field: string): string {
    const fieldNames: { [key: string]: string } = {
      email: 'Email',
      password: 'Password'
    };
    return fieldNames[field] || field;
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LandingHeaderComponent } from '../landing-header/landing-header.component';
import { LandingFooterComponent } from '../landing-footer/landing-footer.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sign-in-page',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    LandingHeaderComponent,
    LandingFooterComponent
  ]
})
export class SignInPageComponent implements OnInit {
  loginForm!: FormGroup;
  driversForm!: FormGroup;
  carriesForm!: FormGroup;

  hideLoginPassword = true;
  hideSignupPassword = true;
  hideSignupConfirmPassword = true;
  loading = false;
  errorMessage = '';
  signupRole: 'drivers' | 'carriers' = 'drivers';
  carrierSizes = ['1 - 49', '50 - 99', '100 - 249', '250+'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });

    this.driversForm = this.fb.group({
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      passwordConfirm: ['', [Validators.required]],
      privacyPolicy: [false, [Validators.requiredTrue]]
    });

    this.carriesForm = this.fb.group({
      company: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      usdot: ['', [Validators.required]],
      carrierSize: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      passwordConfirm: ['', [Validators.required]],
      privacyPolicy: [false, [Validators.requiredTrue]]
    });
  }

  get isDrivers(): boolean {
    return this.signupRole === 'drivers';
  }

  setSignupRole(role: 'drivers' | 'carriers'): void {
    this.signupRole = role;
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.signIn(email, password).subscribe({
      next: () => {
        // Navigation handled by AuthService
        this.loading = false;
        this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.loading = false;
        // Handle different error types
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Please provide email and password';
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to server. Please try again later.';
        } else {
          this.errorMessage = error.error?.error || 'Login failed. Please try again.';
        }
        this.snackBar.open(this.errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  onSignup(): void {
    const form = this.isDrivers ? this.driversForm : this.carriesForm;
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        form.get(key)?.markAsTouched();
      });
      return;
    }
    this.snackBar.open('Registration coming soon!', 'Close', { duration: 3000 });
  }
}

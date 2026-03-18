import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin/dashboard',
  attorney: '/attorney/dashboard',
  paralegal: '/attorney/dashboard',
  operator: '/operator/dashboard',
  carrier: '/carrier/dashboard',
  driver: '/driver/dashboard',
};

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatSnackBarModule,
  ],
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  loading = false;
  biometricLoading = false;
  hidePassword = true;
  errorMessage = '';
  returnUrl = '';

  get biometricEnrolled(): boolean {
    return localStorage.getItem('webauthn_enrolled') === 'true';
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.redirectBasedOnRole();
      return;
    }
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
  }

  ngOnDestroy(): void {
    this.loginForm.reset();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Login successful! Welcome back.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        });

        if (this.returnUrl && this.returnUrl !== '/login') {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.redirectBasedOnRole();
        }
      },
      error: (error: any) => {
        this.loading = false;
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password';
        } else if (error.status === 403) {
          this.errorMessage = 'Your account has been disabled. Please contact support.';
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Please try again later.';
        } else {
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
        }
        this.snackBar.open(this.errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  redirectBasedOnRole(): void {
    const role = this.authService.getUserRole();
    const destination = ROLE_DASHBOARDS[role] ?? '/driver/dashboard';
    this.router.navigate([destination]);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  loginWithGoogle(): void {
    this.loading = true;
    this.authService.signInWithGoogle().subscribe({
      error: () => {
        this.loading = false;
        this.snackBar.open('Google login failed. Please try again.', 'Close', { duration: 4000 });
      }
    });
  }

  loginWithFacebook(): void {
    this.loading = true;
    this.authService.signInWithFacebook().subscribe({
      error: () => {
        this.loading = false;
        this.snackBar.open('Facebook login failed. Please try again.', 'Close', { duration: 4000 });
      }
    });
  }

  async loginWithBiometric(): Promise<void> {
    const email = this.loginForm.value.email;
    if (!email) {
      this.snackBar.open('Enter your email first, then tap the biometric button.', 'Close', { duration: 3000 });
      return;
    }
    this.biometricLoading = true;
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const base = `${environment.apiUrl}/auth/webauthn`;
      const options = await firstValueFrom(
        this.http.post<any>(`${base}/auth/options`, { email })
      );
      const response = await startAuthentication({ optionsJSON: options });
      const result = await firstValueFrom(
        this.http.post<{ token: string; user: any }>(`${base}/auth/verify`, { email, response })
      );
      localStorage.setItem('token', result.token);
      localStorage.setItem('currentUser', JSON.stringify(result.user));
      this.biometricLoading = false;
      this.redirectBasedOnRole();
    } catch {
      this.biometricLoading = false;
      this.snackBar.open('Biometric login failed. Try your password.', 'Close', { duration: 4000 });
    }
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (!control || !control.touched) return '';
    if (control.hasError('required')) return `${this.getFieldName(field)} is required`;
    if (control.hasError('email')) return 'Please enter a valid email address';
    if (control.hasError('minlength')) {
      return `${this.getFieldName(field)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    return '';
  }

  private getFieldName(field: string): string {
    return ({ email: 'Email', password: 'Password' } as Record<string, string>)[field] ?? field;
  }

  hasError(field: string, error: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control?.hasError(error) && control.touched);
  }
}

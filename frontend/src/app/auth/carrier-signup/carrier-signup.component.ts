import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-carrier-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule
  ],
  templateUrl: './carrier-signup.component.html',
  styleUrls: ['./carrier-signup.component.css']
})
export class CarrierSignupComponent {
  hidePassword = true;
  hideConfirmPassword = true;
  userType = 'carrier';

  signupForm = new FormGroup({
    company_name: new FormControl('', [Validators.required, Validators.minLength(2)]),
    phone_number: new FormControl('', [Validators.required]),
    usdot_number: new FormControl('', [Validators.required, Validators.pattern(/^\d{6,8}$/)]),
    carrier_size: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirm_password: new FormControl('', [Validators.required]),
    privacy_policy: new FormControl(false, [Validators.requiredTrue])
  });

  carrierSizes = [
    { value: 'small', label: '1-10 trucks' },
    { value: 'medium', label: '11-50 trucks' },
    { value: 'large', label: '50+ trucks' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  onUserTypeChange(type: string) {
    if (type === 'driver') {
      this.router.navigate(['/sign-in']);
    }
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const password = this.signupForm.get('password')?.value;
    const confirmPassword = this.signupForm.get('confirm_password')?.value;

    if (password !== confirmPassword) {
      this.signupForm.get('confirm_password')?.setErrors({ mismatch: true });
      return;
    }

    const { confirm_password, privacy_policy, ...formData } = this.signupForm.value;

    this.http.post<{ token: string; user: any }>('/api/carriers/register', formData)
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.router.navigate(['/carrier/dashboard']);
        },
        error: (error) => {
          console.error('Registration failed:', error);
          alert('Registration failed. Please try again.');
        }
      });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.signupForm.get(fieldName);
    
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return 'This field is required';
    }
    if (field.errors['minlength']) {
      return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email';
    }
    if (field.errors['pattern']) {
      return 'USDOT number must be 6-8 digits';
    }
    if (field.errors['mismatch']) {
      return 'Passwords do not match';
    }

    return '';
  }
}

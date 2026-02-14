// ============================================
// Profile Component
// Location: frontend/src/app/features/driver/profile/profile.component.ts
// ============================================
// ============================================
// Profile Component - FIXED
// Location: frontend/src/app/features/driver/profile/profile.component.ts
// ============================================

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Services
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ]
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  currentUser: any = null;
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  editingProfile = false;
  editingPassword = false;
  savingProfile = false;
  savingPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      cdlNumber: [''],
      cdlState: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  private loadUserData(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: any) => {
          this.currentUser = user;
          if (user) {
            // Extract first and last name from full_name if individual fields don't exist
            const nameParts = user.full_name?.split(' ') || [];
            const firstName = user.first_name || nameParts[0] || '';
            const lastName = user.last_name || nameParts.slice(1).join(' ') || '';

            this.profileForm.patchValue({
              firstName: firstName,
              lastName: lastName,
              email: user.email || '',
              phone: user.phone || '',
              cdlNumber: user.cdl_number || '',
              cdlState: user.cdl_state || ''
            });
          }
        },
        error: (err) => {
          console.error('Error loading user data:', err);
        }
      });
  }

  toggleEditProfile(): void {
    this.editingProfile = !this.editingProfile;
    if (!this.editingProfile) {
      // Reset form if cancelled
      this.loadUserData();
    }
  }

  toggleEditPassword(): void {
    this.editingPassword = !this.editingPassword;
    if (!this.editingPassword) {
      this.passwordForm.reset();
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 3000
      });
      return;
    }

    this.savingProfile = true;

    // TODO: Replace with actual API call
    setTimeout(() => {
      this.savingProfile = false;
      this.editingProfile = false;
      this.snackBar.open('Profile updated successfully', 'Close', {
        duration: 3000
      });
    }, 1000);
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      if (this.passwordForm.hasError('passwordMismatch')) {
        this.snackBar.open('Passwords do not match', 'Close', {
          duration: 3000
        });
      } else {
        this.snackBar.open('Please fill in all fields correctly', 'Close', {
          duration: 3000
        });
      }
      return;
    }

    this.savingPassword = true;

    // TODO: Replace with actual API call
    setTimeout(() => {
      this.savingPassword = false;
      this.editingPassword = false;
      this.passwordForm.reset();
      this.snackBar.open('Password changed successfully', 'Close', {
        duration: 3000
      });
    }, 1000);
  }

  goToDashboard(): void {
    this.router.navigate(['/driver/dashboard']);
  }

  get fullName(): string {
    return this.currentUser?.full_name || 
           `${this.currentUser?.first_name || ''} ${this.currentUser?.last_name || ''}`.trim() ||
           'User';
  }

  get memberSince(): string {
    const createdAt = this.currentUser?.created_at || this.currentUser?.createdAt;
    if (!createdAt) return 'Recently';
    
    return new Date(createdAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }
}
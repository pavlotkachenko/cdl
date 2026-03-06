import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule,
  ],
  template: `
    <div class="profile-page">
      <div class="profile-header">
        <button mat-icon-button (click)="goToDashboard()" aria-label="Back to dashboard">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>{{ fullName() }}</h1>
          <p class="member-since">{{ memberSince() }}</p>
        </div>
      </div>

      <mat-card class="profile-card">
        <mat-card-header>
          <mat-card-title>Profile Information</mat-card-title>
          <div class="card-header-action">
            <button mat-button (click)="toggleEditProfile()">
              {{ editingProfile() ? 'Cancel' : 'Edit' }}
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          @if (editingProfile()) {
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="edit-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" type="text" autocomplete="given-name" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" type="text" autocomplete="family-name" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" inputmode="email" autocomplete="email" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" type="tel" inputmode="tel" autocomplete="tel" />
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="savingProfile()">
                @if (savingProfile()) { Saving... } @else { Save Changes }
              </button>
            </form>
          } @else {
            @if (currentUser()) {
              <div class="info-grid">
                <div><span class="lbl">Name</span><span>{{ currentUser()!.name }}</span></div>
                <div><span class="lbl">Email</span><span>{{ currentUser()!.email }}</span></div>
                @if (currentUser()!.phone) {
                  <div><span class="lbl">Phone</span><span>{{ currentUser()!.phone }}</span></div>
                }
              </div>
            }
          }
        </mat-card-content>
      </mat-card>

      <mat-divider></mat-divider>

      <mat-card class="profile-card">
        <mat-card-header>
          <mat-card-title>Change Password</mat-card-title>
          <div class="card-header-action">
            <button mat-button (click)="toggleEditPassword()">
              {{ editingPassword() ? 'Cancel' : 'Change' }}
            </button>
          </div>
        </mat-card-header>
        @if (editingPassword()) {
          <mat-card-content>
            <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="edit-form">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Current Password</mat-label>
                <input matInput formControlName="currentPassword" type="password" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input matInput formControlName="newPassword" type="password" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New Password</mat-label>
                <input matInput formControlName="confirmPassword" type="password" />
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="savingPassword()">
                @if (savingPassword()) { Updating... } @else { Update Password }
              </button>
            </form>
          </mat-card-content>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-page { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
    .profile-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .profile-header h1 { margin: 0; font-size: 1.4rem; }
    .member-since { margin: 2px 0 0; font-size: 0.85rem; color: #888; }
    .profile-card { margin-bottom: 16px; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .card-header-action { margin-left: auto; }
    .info-grid { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
    .info-grid div { display: flex; flex-direction: column; gap: 2px; }
    .lbl { font-size: 0.7rem; color: #888; text-transform: uppercase; }
    .edit-form { display: flex; flex-direction: column; gap: 4px; padding-top: 8px; }
    .full-width { width: 100%; }
  `],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  currentUser = signal<any>(null);
  editingProfile = signal(false);
  editingPassword = signal(false);
  savingProfile = signal(false);
  savingPassword = signal(false);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  fullName = computed(() => this.currentUser()?.name || 'Driver');
  memberSince = computed(() => {
    const u = this.currentUser();
    const date = u?.created_at ?? u?.createdAt;
    if (!date) return 'Recently joined';
    return 'Member since ' + new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  });

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });

    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      if (user) {
        const nameParts = (user.name ?? '').split(' ');
        this.profileForm.patchValue({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' '),
          email: user.email ?? '',
          phone: user.phone ?? '',
        });
      }
    });
  }

  private passwordMatchValidator(group: FormGroup) {
    const n = group.get('newPassword')?.value;
    const c = group.get('confirmPassword')?.value;
    return n === c ? null : { passwordMismatch: true };
  }

  toggleEditProfile(): void {
    const editing = !this.editingProfile();
    this.editingProfile.set(editing);
    if (!editing) {
      const u = this.currentUser();
      if (u) {
        const nameParts = (u.name ?? '').split(' ');
        this.profileForm.patchValue({
          firstName: nameParts[0] ?? '',
          lastName: nameParts.slice(1).join(' '),
          email: u.email ?? '',
          phone: u.phone ?? '',
        });
      }
    }
  }

  toggleEditPassword(): void {
    const editing = !this.editingPassword();
    this.editingPassword.set(editing);
    if (!editing) this.passwordForm.reset();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.snackBar.open('Please fill in all required fields correctly.', 'Close', { duration: 3000 });
      return;
    }
    const { firstName, lastName, phone } = this.profileForm.value;
    this.savingProfile.set(true);
    this.authService.updateProfile({ name: `${firstName} ${lastName}`.trim(), phone }).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.editingProfile.set(false);
        this.snackBar.open('Profile updated successfully.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.savingProfile.set(false);
        this.snackBar.open('Failed to update profile.', 'Close', { duration: 3000 });
      },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      const msg = this.passwordForm.hasError('passwordMismatch')
        ? 'Passwords do not match.'
        : 'Please fill in all fields correctly.';
      this.snackBar.open(msg, 'Close', { duration: 3000 });
      return;
    }
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.savingPassword.set(true);
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.editingPassword.set(false);
        this.passwordForm.reset();
        this.snackBar.open('Password changed successfully.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.savingPassword.set(false);
        this.snackBar.open('Failed to change password.', 'Close', { duration: 3000 });
      },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/driver/dashboard']);
  }
}

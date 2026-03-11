import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

import { CarrierService, CarrierProfile } from '../../../core/services/carrier.service';

@Component({
  selector: 'app-carrier-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSlideToggleModule, MatProgressSpinnerModule,
    MatDividerModule, TranslateModule,
  ],
  template: `
    <div class="settings-page">
      <h1>Settings</h1>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <!-- Company Info -->
        <mat-card class="settings-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon aria-hidden="true">business</mat-icon> Company Information
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="settings-form">
              <mat-form-field appearance="outline">
                <mat-label>Company Name</mat-label>
                <input matInput formControlName="company_name">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>USDOT Number</mat-label>
                <input matInput formControlName="usdot_number">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone_number" type="tel">
              </mat-form-field>
              <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                @if (saving()) { <mat-spinner diameter="20"></mat-spinner> } @else { Save Changes }
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Notification Preferences -->
        <mat-card class="settings-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon aria-hidden="true">notifications</mat-icon> Notification Preferences
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="toggle-row">
              <div class="toggle-info">
                <p class="toggle-label">New ticket alerts</p>
                <p class="toggle-desc">Get notified when a driver submits a new ticket</p>
              </div>
              <mat-slide-toggle [checked]="notifyNewTicket()" (change)="toggleNotify('new_ticket')"></mat-slide-toggle>
            </div>
            <mat-divider></mat-divider>
            <div class="toggle-row">
              <div class="toggle-info">
                <p class="toggle-label">Case status updates</p>
                <p class="toggle-desc">Email notifications for case status changes</p>
              </div>
              <mat-slide-toggle [checked]="notifyCaseStatus()" (change)="toggleNotify('case_status')"></mat-slide-toggle>
            </div>
            <mat-divider></mat-divider>
            <div class="toggle-row">
              <div class="toggle-info">
                <p class="toggle-label">Payment alerts</p>
                <p class="toggle-desc">Get notified about payment successes and failures</p>
              </div>
              <mat-slide-toggle [checked]="notifyPayments()" (change)="toggleNotify('payments')"></mat-slide-toggle>
            </div>
            <mat-divider></mat-divider>
            <div class="toggle-row">
              <div class="toggle-info">
                <p class="toggle-label">Weekly compliance digest</p>
                <p class="toggle-desc">Receive a weekly summary of fleet compliance status</p>
              </div>
              <mat-slide-toggle [checked]="notifyWeeklyDigest()" (change)="toggleNotify('weekly_digest')"></mat-slide-toggle>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Security -->
        <mat-card class="settings-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon aria-hidden="true">security</mat-icon> Security
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <button mat-stroked-button class="security-btn">
              <mat-icon>lock</mat-icon> Change Password
            </button>
            <button mat-stroked-button class="security-btn">
              <mat-icon>fingerprint</mat-icon> Enable Biometric Login
            </button>
            <button mat-stroked-button class="security-btn">
              <mat-icon>devices</mat-icon> Manage Active Sessions
            </button>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .settings-page { max-width: 640px; margin: 0 auto; padding: 24px 16px; }
    h1 { margin: 0 0 20px; font-size: 1.4rem; }
    .loading { display: flex; justify-content: center; padding: 32px; }

    .settings-card { margin-bottom: 20px; }
    .settings-card mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; }
    .settings-form { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
    .settings-form mat-form-field { width: 100%; }

    .toggle-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; }
    .toggle-info { flex: 1; }
    .toggle-label { margin: 0; font-size: 0.9rem; font-weight: 500; }
    .toggle-desc { margin: 2px 0 0; font-size: 0.78rem; color: #999; }

    .security-btn { display: flex; align-items: center; gap: 8px; width: 100%; justify-content: flex-start;
      margin-bottom: 10px; min-height: 44px; }
  `],
})
export class CarrierSettingsComponent implements OnInit {
  private carrierService = inject(CarrierService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  saving = signal(false);
  notifyNewTicket = signal(true);
  notifyCaseStatus = signal(true);
  notifyPayments = signal(true);
  notifyWeeklyDigest = signal(false);

  profileForm = this.fb.group({
    company_name: ['', Validators.required],
    usdot_number: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone_number: ['', Validators.required],
  });

  ngOnInit(): void {
    this.carrierService.getProfile().subscribe({
      next: ({ carrier }) => {
        this.profileForm.patchValue(carrier);
        this.notifyNewTicket.set(carrier.notify_on_new_ticket);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) { this.profileForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.carrierService.updateProfile(this.profileForm.value as Partial<CarrierProfile>).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Settings saved.', 'Close', { duration: 3000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save settings.', 'Close', { duration: 3000 });
      },
    });
  }

  toggleNotify(pref: string): void {
    switch (pref) {
      case 'new_ticket': this.notifyNewTicket.update(v => !v); break;
      case 'case_status': this.notifyCaseStatus.update(v => !v); break;
      case 'payments': this.notifyPayments.update(v => !v); break;
      case 'weekly_digest': this.notifyWeeklyDigest.update(v => !v); break;
    }
    this.snackBar.open('Preference updated.', 'Close', { duration: 2000 });
  }
}

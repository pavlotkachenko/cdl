import {
  Component, inject, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-admin-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSlideToggleModule, MatSelectModule,
    MatDividerModule, TranslateModule,
  ],
  template: `
    <div class="settings-page">
      <h1>{{ 'ADMIN.SETTINGS' | translate }}</h1>

      <!-- Firm Information -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon aria-hidden="true">business</mat-icon> {{ 'ADMIN.SETTINGS_FIRM_INFO' | translate }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="firmForm" (ngSubmit)="saveSettings()" class="settings-form">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'ADMIN.SETTINGS_FIRM_NAME' | translate }}</mat-label>
              <input matInput formControlName="firmName">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ 'ADMIN.SETTINGS_EMAIL' | translate }}</mat-label>
              <input matInput formControlName="contactEmail" type="email">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ 'ADMIN.SETTINGS_PHONE' | translate }}</mat-label>
              <input matInput formControlName="contactPhone" type="tel">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>{{ 'ADMIN.SETTINGS_ADDRESS' | translate }}</mat-label>
              <input matInput formControlName="address">
            </mat-form-field>
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field-city">
                <mat-label>{{ 'ADMIN.SETTINGS_CITY' | translate }}</mat-label>
                <input matInput formControlName="city">
              </mat-form-field>
              <mat-form-field appearance="outline" class="form-field-state">
                <mat-label>{{ 'ADMIN.SETTINGS_STATE' | translate }}</mat-label>
                <input matInput formControlName="state">
              </mat-form-field>
              <mat-form-field appearance="outline" class="form-field-zip">
                <mat-label>{{ 'ADMIN.SETTINGS_ZIP' | translate }}</mat-label>
                <input matInput formControlName="zip">
              </mat-form-field>
            </div>
            <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) {
                {{ 'ADMIN.SETTINGS_SAVE' | translate }}...
              } @else {
                {{ 'ADMIN.SETTINGS_SAVE' | translate }}
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Notification Preferences -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon aria-hidden="true">notifications</mat-icon> {{ 'ADMIN.SETTINGS_NOTIFICATIONS' | translate }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_NEW_CASE_ALERTS' | translate }}</p>
              <p class="toggle-desc">{{ 'ADMIN.SETTINGS_NEW_CASE_DESC' | translate }}</p>
            </div>
            <mat-slide-toggle [checked]="notifyNewCase()" (change)="toggleNotify('new_case')"></mat-slide-toggle>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_STATUS_UPDATES' | translate }}</p>
              <p class="toggle-desc">{{ 'ADMIN.SETTINGS_STATUS_DESC' | translate }}</p>
            </div>
            <mat-slide-toggle [checked]="notifyStatusUpdates()" (change)="toggleNotify('status_updates')"></mat-slide-toggle>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_PAYMENT_ALERTS' | translate }}</p>
              <p class="toggle-desc">{{ 'ADMIN.SETTINGS_PAYMENT_DESC' | translate }}</p>
            </div>
            <mat-slide-toggle [checked]="notifyPayments()" (change)="toggleNotify('payments')"></mat-slide-toggle>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_STAFF_ACTIVITY' | translate }}</p>
              <p class="toggle-desc">{{ 'ADMIN.SETTINGS_STAFF_DESC' | translate }}</p>
            </div>
            <mat-slide-toggle [checked]="notifyStaffActivity()" (change)="toggleNotify('staff_activity')"></mat-slide-toggle>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_DAILY_DIGEST' | translate }}</p>
              <p class="toggle-desc">{{ 'ADMIN.SETTINGS_DAILY_DESC' | translate }}</p>
            </div>
            <mat-slide-toggle [checked]="notifyDailyDigest()" (change)="toggleNotify('daily_digest')"></mat-slide-toggle>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Security Settings -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon aria-hidden="true">security</mat-icon> {{ 'ADMIN.SETTINGS_SECURITY' | translate }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_2FA' | translate }}</p>
              <p class="toggle-desc">{{ 'ADMIN.SETTINGS_2FA_DESC' | translate }}</p>
            </div>
            <mat-slide-toggle [checked]="twoFactorEnabled()" (change)="toggle2FA()"></mat-slide-toggle>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_SESSION_TIMEOUT' | translate }}</p>
            </div>
            <mat-form-field appearance="outline" class="select-field">
              <mat-select [value]="sessionTimeout()" (selectionChange)="sessionTimeout.set($event.value)">
                <mat-option value="15">15 min</mat-option>
                <mat-option value="30">30 min</mat-option>
                <mat-option value="60">1 hour</mat-option>
                <mat-option value="240">4 hours</mat-option>
                <mat-option value="480">8 hours</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_FORCE_RESET' | translate }}</p>
              <p class="toggle-desc">{{ 'ADMIN.SETTINGS_FORCE_RESET_DESC' | translate }}</p>
            </div>
            <mat-slide-toggle [checked]="forcePasswordReset()" (change)="toggleForceReset()"></mat-slide-toggle>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row ip-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_IP_WHITELIST' | translate }}</p>
            </div>
            <mat-form-field appearance="outline" class="ip-field">
              <input matInput [value]="ipWhitelist()" (input)="ipWhitelist.set(ipInput.value)" #ipInput
                     [placeholder]="'ADMIN.SETTINGS_IP_PLACEHOLDER' | translate">
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- System Preferences -->
      <mat-card class="settings-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon aria-hidden="true">tune</mat-icon> {{ 'ADMIN.SETTINGS_SYSTEM' | translate }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_DEFAULT_PRIORITY' | translate }}</p>
            </div>
            <mat-form-field appearance="outline" class="select-field">
              <mat-select [value]="defaultPriority()" (selectionChange)="defaultPriority.set($event.value)">
                <mat-option value="low">Low</mat-option>
                <mat-option value="medium">Medium</mat-option>
                <mat-option value="high">High</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_AUTO_ASSIGN' | translate }}</p>
              <p class="toggle-desc">{{ 'ADMIN.SETTINGS_AUTO_ASSIGN_DESC' | translate }}</p>
            </div>
            <mat-slide-toggle [checked]="autoAssignCases()" (change)="toggleAutoAssign()"></mat-slide-toggle>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_REQUIRE_COURT' | translate }}</p>
              <p class="toggle-desc">{{ 'ADMIN.SETTINGS_REQUIRE_COURT_DESC' | translate }}</p>
            </div>
            <mat-slide-toggle [checked]="requireCourtDate()" (change)="toggleRequireCourt()"></mat-slide-toggle>
          </div>
          <mat-divider></mat-divider>
          <div class="toggle-row">
            <div class="toggle-info">
              <p class="toggle-label">{{ 'ADMIN.SETTINGS_MAX_CASES' | translate }}</p>
            </div>
            <mat-form-field appearance="outline" class="number-field">
              <input matInput type="number" [value]="maxCasesPerAttorney()" min="1" max="100"
                     (input)="maxCasesPerAttorney.set(+maxCasesInput.value)" #maxCasesInput>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Danger Zone -->
      <mat-card class="settings-card danger-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon aria-hidden="true">warning</mat-icon> {{ 'ADMIN.SETTINGS_DANGER_ZONE' | translate }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="danger-actions">
            <button mat-stroked-button (click)="exportData()">
              <mat-icon>download</mat-icon> {{ 'ADMIN.SETTINGS_EXPORT_DATA' | translate }}
            </button>
            <button mat-stroked-button color="warn" (click)="deleteTestData()">
              <mat-icon>delete_forever</mat-icon> {{ 'ADMIN.SETTINGS_DELETE_TEST_DATA' | translate }}
            </button>
            @if (confirmDelete()) {
              <p class="confirm-text">Are you sure? This action cannot be undone. Click the button again to confirm.</p>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-page { max-width: 800px; margin: 0 auto; padding: 24px 16px; }
    h1 { margin: 0 0 20px; font-size: 1.4rem; }

    .settings-card { margin-bottom: 16px; }
    .settings-card mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1rem; }
    .settings-form { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
    .settings-form mat-form-field { width: 100%; }

    .form-row { display: flex; gap: 12px; }
    .form-field-city { flex: 2; }
    .form-field-state { flex: 1; }
    .form-field-zip { flex: 1; }

    .toggle-row {
      display: flex; justify-content: space-between; align-items: center;
      min-height: 56px; padding: 10px 0;
    }
    .toggle-info { flex: 1; }
    .toggle-label { margin: 0; font-size: 0.9rem; font-weight: 500; color: #333; }
    .toggle-desc { margin: 2px 0 0; font-size: 0.78rem; color: #888; }

    .select-field { width: 150px; margin: 0; }
    .select-field .mat-mdc-form-field-subscript-wrapper { display: none; }
    .number-field { width: 100px; margin: 0; }
    .number-field .mat-mdc-form-field-subscript-wrapper { display: none; }

    .ip-row { flex-wrap: wrap; }
    .ip-field { width: 100%; margin-top: 4px; }

    .danger-card { border: 2px solid #ef5350; }
    .danger-card mat-card-title { color: #ef5350; }
    .danger-actions { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
    .danger-actions button { justify-content: flex-start; gap: 8px; }
    .confirm-text { margin: 0; font-size: 0.85rem; color: #ef5350; font-weight: 500; }

    @media (max-width: 480px) {
      .form-row { flex-direction: column; gap: 4px; }
      .form-field-city, .form-field-state, .form-field-zip { flex: 1; }
    }
  `],
})
export class AdminSettingsComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  saving = signal(false);

  // Notification signals
  notifyNewCase = signal(true);
  notifyStatusUpdates = signal(true);
  notifyPayments = signal(true);
  notifyStaffActivity = signal(false);
  notifyDailyDigest = signal(true);

  // Security signals
  twoFactorEnabled = signal(false);
  sessionTimeout = signal('60');
  forcePasswordReset = signal(false);
  ipWhitelist = signal('');

  // System preference signals
  defaultPriority = signal('medium');
  autoAssignCases = signal(true);
  requireCourtDate = signal(true);
  maxCasesPerAttorney = signal(20);

  // Danger zone
  confirmDelete = signal(false);

  firmForm = this.fb.group({
    firmName: ['CDL Legal Partners', Validators.required],
    contactEmail: ['admin@cdllegal.com', [Validators.required, Validators.email]],
    contactPhone: ['(555) 100-2000', Validators.required],
    address: ['500 Justice Blvd', Validators.required],
    city: ['Houston', Validators.required],
    state: ['TX', Validators.required],
    zip: ['77001', Validators.required],
  });

  saveSettings(): void {
    if (this.firmForm.invalid) {
      this.firmForm.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.snackBar.open('Settings saved successfully', 'Close', { duration: 3000 });
    }, 500);
  }

  toggle2FA(): void {
    this.twoFactorEnabled.update(v => !v);
  }

  toggleForceReset(): void {
    this.forcePasswordReset.update(v => !v);
  }

  toggleAutoAssign(): void {
    this.autoAssignCases.update(v => !v);
  }

  toggleRequireCourt(): void {
    this.requireCourtDate.update(v => !v);
  }

  toggleNotify(pref: string): void {
    switch (pref) {
      case 'new_case': this.notifyNewCase.update(v => !v); break;
      case 'status_updates': this.notifyStatusUpdates.update(v => !v); break;
      case 'payments': this.notifyPayments.update(v => !v); break;
      case 'staff_activity': this.notifyStaffActivity.update(v => !v); break;
      case 'daily_digest': this.notifyDailyDigest.update(v => !v); break;
    }
  }

  exportData(): void {
    this.snackBar.open('Preparing data export...', 'Close', { duration: 3000 });
  }

  deleteTestData(): void {
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      return;
    }
    this.confirmDelete.set(false);
    this.snackBar.open('Test data deleted.', 'Close', { duration: 3000 });
  }
}

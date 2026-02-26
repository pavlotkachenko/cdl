// ============================================
// Notification Preferences Component
// Location: frontend/src/app/features/driver/settings/notification-preferences/notification-preferences.component.ts
// ============================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { NotificationService, NotificationPreferences } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  templateUrl: './notification-preferences.component.html',
  styleUrls: ['./notification-preferences.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatTooltipModule
  ]
})
export class NotificationPreferencesComponent implements OnInit {
  preferencesForm!: FormGroup;
  saving = false;

  constructor(
    private fb: FormBuilder,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPreferences();
  }

  private initializeForm(): void {
    this.preferencesForm = this.fb.group({
      // In-App Notifications
      inApp: this.fb.group({
        caseUpdates: [true],
        comments: [true],
        documents: [true],
        courtDates: [true],
        attorneyMessages: [true],
        system: [true]
      }),
      // Email Notifications
      email: this.fb.group({
        caseUpdates: [true],
        comments: [false],
        documents: [true],
        courtDates: [true],
        attorneyMessages: [true],
        weeklyDigest: [true]
      }),
      // SMS Notifications
      sms: this.fb.group({
        courtDateReminders: [true],
        urgentUpdates: [true],
        reminderDaysBefore: [7]
      }),
      // General Settings
      sound: [true],
      browserNotifications: [true]
    });
  }

  private loadPreferences(): void {
    this.notificationService.getPreferences().subscribe({
      next: (preferences) => {
        this.preferencesForm.patchValue(preferences);
      },
      error: (error) => {
        console.error('Failed to load preferences:', error);
      }
    });
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid) return;

    this.saving = true;
    const preferences: NotificationPreferences = this.preferencesForm.value;

    this.notificationService.savePreferences(preferences).subscribe({
      next: () => {
        this.saving = false;
        this.snackBar.open('Notification preferences saved successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      error: (error) => {
        this.saving = false;
        console.error('Failed to save preferences:', error);
        this.snackBar.open('Failed to save preferences', 'Close', {
          duration: 3000
        });
      }
    });
  }

  resetToDefaults(): void {
    if (confirm('Reset all notification preferences to defaults?')) {
      this.notificationService.getPreferences().subscribe({
        next: (defaults) => {
          this.preferencesForm.patchValue(defaults);
          this.savePreferences();
        }
      });
    }
  }

  testNotification(): void {
    this.snackBar.open('Test notification sent! Check your notification bell.', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });

    // In production, this would trigger a real test notification
    console.log('Test notification would be sent here');
  }

  requestBrowserPermission(): void {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.snackBar.open('Browser notifications enabled!', 'Close', {
            duration: 3000
          });
          this.preferencesForm.patchValue({ browserNotifications: true });
        } else {
          this.snackBar.open('Browser notifications permission denied', 'Close', {
            duration: 3000
          });
          this.preferencesForm.patchValue({ browserNotifications: false });
        }
      });
    }
  }

  get browserNotificationStatus(): string {
    if (!('Notification' in window)) {
      return 'not-supported';
    }
    return Notification.permission;
  }

  get canEnableBrowserNotifications(): boolean {
    return this.browserNotificationStatus === 'default' || 
           this.browserNotificationStatus === 'denied';
  }
}

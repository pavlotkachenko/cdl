import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { UserPreferencesService } from '../../../../core/services/user-preferences.service';

const PUSH_DISMISSED_KEY = 'cdl_push_prompt_dismissed';

@Component({
  selector: 'app-notification-preferences',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatCardModule, MatSlideToggleModule,
    MatButtonModule, MatIconModule,
  ],
  template: `
    <div class="prefs-page">
      <h1>Notification Preferences</h1>

      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-card class="prefs-card">
          <mat-card-content>
            <h2>SMS Notifications</h2>
            <div class="toggle-row">
              <div>
                <p class="toggle-label">Case status updates via SMS</p>
                <p class="toggle-hint">Receive text messages when your case status changes.</p>
              </div>
              <mat-slide-toggle formControlName="smsOptIn" aria-label="SMS notifications"></mat-slide-toggle>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="prefs-card">
          <mat-card-content>
            <h2>Push Notifications</h2>
            <div class="toggle-row">
              <div>
                <p class="toggle-label">Browser push notifications</p>
                <p class="toggle-hint">
                  Status: <strong>{{ pushStatus() }}</strong>
                </p>
              </div>
              @if (canRequestPush()) {
                <button mat-stroked-button type="button" (click)="enablePush()"
                        aria-label="Enable push notifications">
                  <mat-icon aria-hidden="true">notifications</mat-icon> Enable
                </button>
              } @else if (pushStatus() === 'granted') {
                <mat-icon class="granted-icon" aria-label="Push notifications enabled">check_circle</mat-icon>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <div class="actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Saving…' : 'Save Preferences' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .prefs-page { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
    h1 { margin: 0 0 20px; font-size: 1.4rem; }
    h2 { margin: 0 0 12px; font-size: 1rem; font-weight: 600; }
    .prefs-card { margin-bottom: 16px; }
    .toggle-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .toggle-label { margin: 0; font-weight: 500; font-size: 0.9rem; }
    .toggle-hint { margin: 2px 0 0; font-size: 0.8rem; color: #666; }
    .granted-icon { color: #388e3c; font-size: 28px; width: 28px; height: 28px; }
    .actions { margin-top: 8px; }
  `],
})
export class NotificationPreferencesComponent implements OnInit {
  private preferencesService = inject(UserPreferencesService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  saving = signal(false);

  pushStatus = signal<string>('not-supported');
  canRequestPush = signal(false);

  ngOnInit(): void {
    this.form = this.fb.group({ smsOptIn: [false] });
    this.checkPushStatus();
  }

  private checkPushStatus(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      this.pushStatus.set('not-supported');
      return;
    }
    this.pushStatus.set(Notification.permission);
    this.canRequestPush.set(Notification.permission !== 'granted');
  }

  enablePush(): void {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(permission => {
      this.pushStatus.set(permission);
      this.canRequestPush.set(permission !== 'granted');
      if (permission === 'granted') {
        localStorage.setItem(PUSH_DISMISSED_KEY, '1');
        const token = `web_${Date.now()}`;
        this.preferencesService.savePushToken(token).subscribe({
          next: () => this.snackBar.open('Push notifications enabled!', 'Close', { duration: 3000 }),
          error: () => this.snackBar.open('Failed to register device.', 'Close', { duration: 3000 }),
        });
      } else {
        this.snackBar.open('Push notifications were not enabled.', 'Close', { duration: 3000 });
      }
    });
  }

  save(): void {
    this.saving.set(true);
    const { smsOptIn } = this.form.value;
    this.preferencesService.updateSmsOptIn(smsOptIn).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('Preferences saved!', 'Close', { duration: 3000 });
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to save preferences.', 'Close', { duration: 3000 });
      },
    });
  }
}

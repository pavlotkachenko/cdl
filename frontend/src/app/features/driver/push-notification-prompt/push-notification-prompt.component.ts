import {
  Component, OnInit, inject, signal, ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserPreferencesService } from '../../../core/services/user-preferences.service';

const DISMISSED_KEY = 'cdl_push_prompt_dismissed';

@Component({
  selector: 'app-push-notification-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (visible()) {
      <div class="prompt-banner" role="alert" aria-live="polite">
        <mat-icon class="prompt-icon" aria-hidden="true">notifications</mat-icon>
        <div class="prompt-text">
          <strong>Enable push notifications</strong>
          <span>Stay updated on your case status in real time.</span>
        </div>
        <div class="prompt-actions">
          <button mat-raised-button color="primary" (click)="enable()" aria-label="Enable push notifications">
            Enable
          </button>
          <button mat-button (click)="dismiss()" aria-label="Dismiss push notification prompt">
            Later
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .prompt-banner {
      display: flex; align-items: center; gap: 12px;
      background: #e3f2fd; border: 1px solid #90caf9; border-radius: 8px;
      padding: 12px 16px; margin-bottom: 16px; flex-wrap: wrap;
    }
    .prompt-icon { color: #1976d2; }
    .prompt-text { flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 0.9rem; }
    .prompt-text strong { font-weight: 600; }
    .prompt-text span { color: #555; font-size: 0.8rem; }
    .prompt-actions { display: flex; gap: 8px; align-items: center; }
  `],
})
export class PushNotificationPromptComponent implements OnInit {
  private preferencesService = inject(UserPreferencesService);

  visible = signal(false);

  ngOnInit(): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') return;
    if (localStorage.getItem(DISMISSED_KEY)) return;
    this.visible.set(true);
  }

  enable(): void {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        this.visible.set(false);
        localStorage.setItem(DISMISSED_KEY, '1');
        // In production, a OneSignal SDK would provide the player ID.
        // Here we signal the backend with a placeholder that gets replaced by the real SDK token.
        const mockToken = `web_${Date.now()}`;
        this.preferencesService.savePushToken(mockToken).subscribe({
          error: (err) => console.error('[PushPrompt] Failed to save token:', err),
        });
      }
    });
  }

  dismiss(): void {
    localStorage.setItem(DISMISSED_KEY, '1');
    this.visible.set(false);
  }
}

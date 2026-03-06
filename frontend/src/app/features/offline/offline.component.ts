import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-offline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="offline-page" role="main">
      <mat-icon aria-hidden="true" class="offline-icon">wifi_off</mat-icon>
      <h1>You're offline</h1>
      <p>Check your internet connection and try again.</p>
      <button mat-raised-button color="primary" (click)="reload()">
        <mat-icon>refresh</mat-icon> Try Again
      </button>
    </div>
  `,
  styles: [`
    .offline-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      gap: 16px;
      text-align: center;
      padding: 24px 16px;
    }
    .offline-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #9e9e9e;
    }
    h1 { margin: 0; font-size: 1.8rem; color: #424242; }
    p { margin: 0; color: #757575; font-size: 1rem; }
  `],
})
export class OfflineComponent {
  reload(): void {
    window.location.reload();
  }
}

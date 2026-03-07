/**
 * BiometricSetupComponent — enroll device fingerprint/Face ID for passwordless login.
 * Sprint 037 BIO-2
 */

import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-biometric-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <mat-card class="bio-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>fingerprint</mat-icon>
        <mat-card-title>Biometric Login</mat-card-title>
        <mat-card-subtitle>Use Face ID or fingerprint to sign in</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        @if (enrolled()) {
          <p class="status enrolled">
            <mat-icon>check_circle</mat-icon> Biometric login is enabled on this device.
          </p>
        } @else {
          <p class="status">Tap the button below to register your device biometric for faster login.</p>
        }
      </mat-card-content>
      <mat-card-actions>
        @if (!enrolled()) {
          <button mat-raised-button color="primary" [disabled]="loading()" (click)="enroll()">
            @if (loading()) { <mat-spinner diameter="18" /> Enrolling… }
            @else { Enable Biometric Login }
          </button>
        } @else {
          <button mat-stroked-button color="warn" (click)="remove()">Remove Biometric</button>
        }
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .bio-card { max-width: 480px; margin: 24px auto; }
    .status { display: flex; align-items: center; gap: 8px; }
    .status.enrolled { color: #2e7d32; }
  `],
})
export class BiometricSetupComponent {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  enrolled = signal(localStorage.getItem('webauthn_enrolled') === 'true');
  loading = signal(false);

  private get base() { return `${environment.apiUrl}/auth/webauthn`; }

  async enroll(): Promise<void> {
    this.loading.set(true);
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      const options = await firstValueFrom(
        this.http.post<any>(`${this.base}/register/options`, {})
      );
      const response = await startRegistration({ optionsJSON: options });
      await firstValueFrom(
        this.http.post(`${this.base}/register/verify`, response)
      );
      localStorage.setItem('webauthn_enrolled', 'true');
      this.enrolled.set(true);
      this.snackBar.open('Biometric login enabled!', undefined, { duration: 3000 });
    } catch {
      this.snackBar.open('Enrollment failed. Please try again.', 'Close', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  remove(): void {
    localStorage.removeItem('webauthn_enrolled');
    this.enrolled.set(false);
    this.snackBar.open('Biometric login removed from this device.', undefined, { duration: 3000 });
  }
}

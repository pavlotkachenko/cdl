/**
 * RT-2 — RatingPromptComponent
 * Appears after a case is closed/resolved, letting the driver rate their attorney.
 */
import {
  Component, input, output, signal, ChangeDetectionStrategy, inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-rating-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  template: `
    @if (!submitted()) {
      <mat-card class="rating-card">
        <mat-card-content>
          <h3>How was your attorney?</h3>
          <p class="sub">Your feedback helps other drivers choose the right representation.</p>
          <div class="stars" role="group" aria-label="Rate your attorney">
            @for (star of stars; track star) {
              <button mat-icon-button
                      [class.filled]="star <= selectedScore()"
                      (click)="selectStar(star)"
                      [attr.aria-label]="star + ' star' + (star === 1 ? '' : 's')"
                      [attr.aria-pressed]="star <= selectedScore()">
                <mat-icon>{{ star <= selectedScore() ? 'star' : 'star_border' }}</mat-icon>
              </button>
            }
          </div>
          <div class="rating-actions">
            <button mat-raised-button color="primary"
                    [disabled]="selectedScore() === 0 || saving()"
                    (click)="submit()">
              {{ saving() ? 'Submitting…' : 'Submit Rating' }}
            </button>
            <button mat-button (click)="dismiss.emit()" aria-label="Dismiss rating prompt">
              Not now
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    } @else {
      <div class="thank-you" role="status">
        <mat-icon class="ty-icon" aria-hidden="true">check_circle</mat-icon>
        <p>Thanks for your feedback!</p>
      </div>
    }
  `,
  styles: [`
    .rating-card { margin: 16px 0; }
    h3 { margin: 0 0 4px; font-size: 1rem; font-weight: 600; }
    .sub { margin: 0 0 12px; font-size: 0.8rem; color: #666; }
    .stars { display: flex; gap: 4px; margin-bottom: 16px; }
    .stars button { color: #ccc; }
    .stars button.filled { color: #f9a825; }
    .rating-actions { display: flex; gap: 8px; align-items: center; }
    .thank-you { display: flex; align-items: center; gap: 8px; padding: 12px 0; color: #388e3c; }
    .ty-icon { font-size: 28px; width: 28px; height: 28px; }
  `],
})
export class RatingPromptComponent {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  caseId = input.required<string>();

  dismiss = output<void>();

  stars = [1, 2, 3, 4, 5];
  selectedScore = signal(0);
  saving = signal(false);
  submitted = signal(false);

  selectStar(star: number): void {
    this.selectedScore.set(star);
  }

  submit(): void {
    const score = this.selectedScore();
    if (score === 0) return;
    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/ratings`, {
      case_id: this.caseId(),
      score,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.saving.set(false);
        this.snackBar.open('Failed to submit rating. Please try again.', 'Close', { duration: 3000 });
      },
    });
  }
}

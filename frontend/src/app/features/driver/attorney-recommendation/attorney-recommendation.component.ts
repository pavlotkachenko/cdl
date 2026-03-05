import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PercentPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CaseService } from '../../../core/services/case.service';

export interface AttorneyCard {
  id: string;
  fullName: string;
  rating: number;
  successRate: number;
  specializations: string[];
  isRecommended: boolean;
}

@Component({
  selector: 'app-attorney-recommendation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, PercentPipe
  ],
  template: `
    <div class="rec-container">
      <div class="rec-header">
        <h1>Choose Your Attorney</h1>
        @if (caseNumber()) {
          <p class="case-ref">Case #{{ caseNumber() }}</p>
        }
        <p class="sub">Our top matches for your case type and state</p>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
          <p>Finding the best attorneys for your case…</p>
        </div>
      } @else if (attorneys().length === 0) {
        <mat-card class="empty-card">
          <mat-card-content>
            <mat-icon aria-hidden="true">search</mat-icon>
            <h3>Finding Your Attorney</h3>
            <p>We're matching you with the right attorney. You'll be notified within 24 hours.</p>
            <button mat-button (click)="goBack()">Back to Dashboard</button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="attorney-list" role="list">
          @for (attorney of attorneys(); track attorney.id) {
            <mat-card class="attorney-card" [class.recommended]="attorney.isRecommended" role="listitem">
              @if (attorney.isRecommended) {
                <div class="recommended-badge" aria-label="Recommended">
                  <mat-icon aria-hidden="true">verified</mat-icon>
                  RECOMMENDED
                </div>
              }
              <mat-card-content>
                <div class="attorney-body">
                  <div class="attorney-avatar" aria-hidden="true">
                    <mat-icon>account_circle</mat-icon>
                  </div>
                  <div class="attorney-info">
                    <h2>{{ attorney.fullName }}</h2>
                    <div class="rating" [attr.aria-label]="attorney.rating + ' out of 5 stars'">
                      @for (star of [1,2,3,4,5]; track star) {
                        <mat-icon class="star" [class.filled]="star <= attorney.rating" aria-hidden="true">star</mat-icon>
                      }
                    </div>
                    <p class="win-rate">
                      <strong>{{ attorney.successRate | percent }}</strong> win rate for cases like yours
                    </p>
                    @if (attorney.specializations.length > 0) {
                      <div class="specializations" aria-label="Specializations">
                        @for (spec of attorney.specializations.slice(0, 3); track spec) {
                          <mat-chip>{{ spec }}</mat-chip>
                        }
                      </div>
                    }
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button
                  mat-raised-button
                  [color]="attorney.isRecommended ? 'primary' : 'basic'"
                  [disabled]="!!selecting()"
                  (click)="selectAttorney(attorney.id)"
                  [attr.aria-label]="'Select ' + attorney.fullName">
                  @if (selecting() === attorney.id) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Select
                  }
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .rec-container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
    .rec-header { text-align: center; margin-bottom: 24px; }
    .rec-header h1 { font-size: 1.5rem; margin: 0 0 4px; }
    .case-ref, .sub { color: #666; font-size: 0.875rem; margin: 2px 0; }
    .loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px; }
    .empty-card mat-card-content { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; padding: 32px; }
    .empty-card mat-icon { font-size: 48px; width: 48px; height: 48px; color: #999; }
    .attorney-list { display: flex; flex-direction: column; gap: 16px; }
    .attorney-card { position: relative; overflow: hidden; }
    .attorney-card.recommended { outline: 2px solid #1976d2; }
    .recommended-badge { background: #1976d2; color: #fff; display: flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; }
    .recommended-badge mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .attorney-body { display: flex; gap: 16px; align-items: flex-start; }
    .attorney-avatar mat-icon { font-size: 64px; width: 64px; height: 64px; color: #1976d2; }
    .attorney-info h2 { margin: 0 0 6px; font-size: 1.1rem; }
    .rating { display: flex; gap: 2px; margin-bottom: 6px; }
    .star { font-size: 18px; width: 18px; height: 18px; color: #ddd; }
    .star.filled { color: #f59e0b; }
    .win-rate { margin: 0 0 8px; font-size: 0.9rem; }
    .specializations { display: flex; flex-wrap: wrap; gap: 4px; }
    mat-card-actions { padding: 8px 16px 16px; }
    mat-card-actions button { width: 100%; }
  `]
})
export class AttorneyRecommendationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private snackBar = inject(MatSnackBar);

  caseId = signal('');
  caseNumber = signal('');
  attorneys = signal<AttorneyCard[]>([]);
  loading = signal(true);
  selecting = signal<string | null>(null);

  ngOnInit(): void {
    this.caseId.set(this.route.snapshot.params['caseId']);
    this.loadData();
  }

  private loadData(): void {
    this.caseService.getCaseById(this.caseId()).subscribe({
      next: (response) => {
        const c = response.data;
        if (c?.case_number) this.caseNumber.set(c.case_number);
      }
    });

    this.caseService.getRecommendedAttorneys(this.caseId()).subscribe({
      next: (response: any) => {
        this.attorneys.set(response.attorneys || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectAttorney(attorneyId: string): void {
    this.selecting.set(attorneyId);
    this.caseService.selectAttorney(this.caseId(), attorneyId).subscribe({
      next: () => {
        this.snackBar.open('Attorney selected! Your case is now being reviewed.', 'Close', { duration: 3000 });
        this.router.navigate(['/driver/cases', this.caseId()]);
      },
      error: () => {
        this.selecting.set(null);
        this.snackBar.open('Failed to select attorney. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/driver/dashboard']);
  }
}

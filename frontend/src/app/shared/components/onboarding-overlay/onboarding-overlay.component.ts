import {
  Component, OnInit, inject, input, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OnboardingService } from '../../../core/services/onboarding.service';

export interface OnboardingStep {
  title: string;
  text: string;
  icon?: string;
}

@Component({
  selector: 'app-onboarding-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (visible()) {
      <div class="ob-backdrop" role="dialog" aria-modal="true" [attr.aria-label]="'Onboarding step ' + (currentStep() + 1) + ' of ' + steps().length">
        <div class="ob-card">
          <p class="ob-counter" aria-live="polite">Step {{ currentStep() + 1 }} of {{ steps().length }}</p>
          <mat-icon class="ob-icon" aria-hidden="true">{{ currentStepData()?.icon || 'lightbulb' }}</mat-icon>
          <h2 class="ob-title">{{ currentStepData()?.title }}</h2>
          <p class="ob-text">{{ currentStepData()?.text }}</p>
          <div class="ob-actions">
            <button mat-button (click)="skip()" aria-label="Skip tour">Skip tour</button>
            @if (isLastStep()) {
              <button mat-raised-button color="primary" (click)="done()">Done</button>
            } @else {
              <button mat-raised-button color="primary" (click)="next()">Next</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .ob-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
    }
    .ob-card {
      background: #fff; border-radius: 12px; padding: 32px 28px;
      max-width: 420px; width: 90%; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,.18);
    }
    .ob-counter { font-size: 0.75rem; color: #999; margin: 0 0 12px; }
    .ob-icon { font-size: 48px; width: 48px; height: 48px; color: #1976d2; margin-bottom: 12px; }
    .ob-title { font-size: 1.2rem; font-weight: 700; margin: 0 0 10px; }
    .ob-text { font-size: 0.9rem; color: #555; margin: 0 0 24px; line-height: 1.5; }
    .ob-actions { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
  `],
})
export class OnboardingOverlayComponent implements OnInit {
  private onboardingService = inject(OnboardingService);

  tourId = input<string>('driver');
  steps = input<OnboardingStep[]>([]);

  visible     = signal(false);
  currentStep = signal(0);

  currentStepData = computed(() => this.steps()[this.currentStep()] ?? null);
  isLastStep      = computed(() => this.currentStep() >= this.steps().length - 1);

  ngOnInit(): void {
    if (this.steps().length > 0 && !this.onboardingService.isComplete(this.tourId())) {
      const saved = this.onboardingService.getCurrentStep(this.tourId());
      this.currentStep.set(saved < this.steps().length ? saved : 0);
      this.visible.set(true);
    }
  }

  next(): void {
    const next = this.currentStep() + 1;
    this.currentStep.set(next);
    this.onboardingService.saveStep(this.tourId(), next);
  }

  skip(): void {
    this.onboardingService.markComplete(this.tourId());
    this.visible.set(false);
  }

  done(): void {
    this.onboardingService.markComplete(this.tourId());
    this.visible.set(false);
  }
}

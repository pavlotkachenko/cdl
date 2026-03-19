import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface WizardStep {
  label: string;
}

@Component({
  selector: 'app-wizard-stepper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <nav class="wizard-stepper" role="navigation" aria-label="Form progress">
      <ol class="stepper-list">
        @for (step of steps(); track $index) {
          <li
            class="stepper-item"
            [class.done]="$index < currentStep()"
            [class.current]="$index === currentStep()"
            [class.todo]="$index > currentStep()"
            [attr.aria-current]="$index === currentStep() ? 'step' : null"
          >
            <div class="step-circle" [attr.aria-label]="stepAriaLabel($index, step.label)">
              @if ($index < currentStep()) {
                <svg class="check-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              } @else {
                <span class="step-number" aria-hidden="true">{{ $index + 1 }}</span>
              }
            </div>

            @if ($index < steps().length - 1) {
              <div
                class="step-connector"
                [class.done]="$index < currentStep()"
                aria-hidden="true"
              ></div>
            }

            <span class="step-label">{{ step.label }}</span>
          </li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './wizard-stepper.component.scss'
})
export class WizardStepperComponent {
  readonly steps = input.required<WizardStep[]>();
  readonly currentStep = input.required<number>();

  stepAriaLabel(index: number, label: string): string {
    const current = this.currentStep();
    if (index < current) return `Step ${index + 1}: ${label} - completed`;
    if (index === current) return `Step ${index + 1}: ${label} - current step`;
    return `Step ${index + 1}: ${label} - upcoming`;
  }
}

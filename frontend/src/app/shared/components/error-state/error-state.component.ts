import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="error-state" role="alert">
      <mat-icon aria-hidden="true">error_outline</mat-icon>
      <p>{{ message() }}</p>
      @if (retryLabel()) {
        <button mat-stroked-button (click)="retry.emit()">{{ retryLabel() }}</button>
      }
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px 16px;
      color: #d32f2f;
      text-align: center;
    }
    .error-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    .error-state p {
      margin: 0;
      font-size: 0.95rem;
    }
  `],
})
export class ErrorStateComponent {
  message = input.required<string>();
  retryLabel = input('');
  retry = output<void>();
}

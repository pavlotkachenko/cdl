import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-success',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="success-container">
      <mat-card class="success-card">
        <mat-card-content>
          <div class="success-icon" aria-hidden="true">
            <mat-icon class="check-icon">check_circle</mat-icon>
          </div>

          <h1>Payment Received!</h1>
          <p class="subtitle">Your attorney has been notified and will begin working on your defense.</p>

          <div class="payment-details" aria-label="Payment summary">
            @if (amount()) {
              <div class="detail-row">
                <span>Amount paid</span>
                <strong>{{ amount() | currency }}</strong>
              </div>
            }
            @if (transactionId()) {
              <div class="detail-row">
                <span>Transaction ID</span>
                <code>{{ transactionId() }}</code>
              </div>
            }
          </div>

          <p class="email-notice">
            <mat-icon aria-hidden="true">email</mat-icon>
            A confirmation email has been sent to your registered address.
          </p>

          <div class="actions">
            <button mat-raised-button color="primary" (click)="viewCase()">
              View Case
            </button>
            <button mat-button (click)="goToDashboard()">
              Back to Dashboard
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .success-container {
      display: flex; justify-content: center; align-items: flex-start;
      min-height: 70vh; padding: 32px 16px;
    }
    .success-card { max-width: 480px; width: 100%; }
    mat-card-content { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; padding: 32px 24px; }
    .success-icon { margin-bottom: 8px; }
    .check-icon { font-size: 72px; width: 72px; height: 72px; color: #4caf50; animation: pop 0.4s ease-out; }
    @keyframes pop { 0% { transform: scale(0); opacity: 0; } 80% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
    h1 { margin: 0; font-size: 1.8rem; color: #1a1a1a; }
    .subtitle { color: #555; margin: 0; }
    .payment-details { background: #f5f5f5; border-radius: 8px; padding: 16px; width: 100%; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 0.9rem; }
    .detail-row code { font-size: 0.75rem; background: #e0e0e0; padding: 2px 6px; border-radius: 4px; word-break: break-all; }
    .email-notice { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #666; margin: 0; }
    .email-notice mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .actions { display: flex; flex-direction: column; gap: 8px; width: 100%; }
    .actions button { width: 100%; }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  caseId = signal('');
  amount = signal(0);
  transactionId = signal('');

  ngOnInit(): void {
    this.caseId.set(this.route.snapshot.params['caseId']);

    // Read state passed via router navigation
    const state = history.state as Record<string, unknown>;
    if (!state?.['amount']) {
      // Direct URL access without payment flow — redirect gracefully
      this.router.navigate(['/driver/cases', this.caseId()]);
      return;
    }
    this.amount.set(Number(state['amount']) || 0);
    this.transactionId.set(String(state['transactionId'] || ''));
  }

  viewCase(): void {
    this.router.navigate(['/driver/cases', this.caseId()]);
  }

  goToDashboard(): void {
    this.router.navigate(['/driver/dashboard']);
  }
}

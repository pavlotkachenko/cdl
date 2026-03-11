import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

import { CarrierService, CarrierPayment } from '../../../core/services/carrier.service';

@Component({
  selector: 'app-carrier-payments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe, DatePipe,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    TranslateModule,
  ],
  template: `
    <div class="payments-page">
      <header class="page-header">
        <h1>Payments</h1>
      </header>

      <!-- Summary Cards -->
      <div class="summary-grid">
        <mat-card class="summary-card">
          <mat-card-content>
            <mat-icon aria-hidden="true">attach_money</mat-icon>
            <p class="summary-value">{{ totalPaid() | currency:'USD':'symbol':'1.0-0' }}</p>
            <p class="summary-label">Total Paid</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card pending">
          <mat-card-content>
            <mat-icon aria-hidden="true">schedule</mat-icon>
            <p class="summary-value">{{ totalPending() | currency:'USD':'symbol':'1.0-0' }}</p>
            <p class="summary-label">Pending</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="summary-card">
          <mat-card-content>
            <mat-icon aria-hidden="true">receipt_long</mat-icon>
            <p class="summary-value">{{ payments().length }}</p>
            <p class="summary-label">Transactions</p>
          </mat-card-content>
        </mat-card>
      </div>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else if (payments().length === 0) {
        <div class="empty-state">
          <mat-icon aria-hidden="true">payment</mat-icon>
          <p>No payment history yet.</p>
        </div>
      } @else {
        <div class="payment-list" role="list">
          @for (p of payments(); track p.id) {
            <mat-card class="payment-card" role="listitem">
              <mat-card-content>
                <div class="payment-row">
                  <div class="payment-icon" [class]="'status-' + p.status">
                    <mat-icon aria-hidden="true">
                      @switch (p.status) {
                        @case ('paid') { check_circle }
                        @case ('pending') { schedule }
                        @case ('failed') { error }
                      }
                    </mat-icon>
                  </div>
                  <div class="payment-info">
                    <p class="payment-desc">{{ p.description }}</p>
                    <p class="payment-date">{{ p.date | date:'mediumDate' }}</p>
                  </div>
                  <div class="payment-amount" [class]="'status-' + p.status">
                    {{ p.amount | currency:'USD':'symbol':'1.2-2' }}
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .payments-page { max-width: 680px; margin: 0 auto; padding: 24px 16px; }
    .page-header { margin-bottom: 20px; }
    .page-header h1 { margin: 0; font-size: 1.4rem; }

    .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
    .summary-card mat-card-content { display: flex; flex-direction: column; align-items: center; padding: 16px; gap: 4px; }
    .summary-card mat-icon { color: #1dad8c; font-size: 28px; width: 28px; height: 28px; }
    .summary-card.pending mat-icon { color: #f57c00; }
    .summary-value { font-size: 1.5rem; font-weight: 700; margin: 0; color: #1f2937; }
    .summary-label { font-size: 0.78rem; color: #666; margin: 0; }

    .loading { display: flex; justify-content: center; padding: 32px; }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 48px; color: #999; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    .payment-list { display: flex; flex-direction: column; gap: 8px; }
    .payment-row { display: flex; align-items: center; gap: 14px; }
    .payment-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0; }
    .payment-icon.status-paid { background: #e8f5e9; }
    .payment-icon.status-paid mat-icon { color: #2e7d32; }
    .payment-icon.status-pending { background: #fff3e0; }
    .payment-icon.status-pending mat-icon { color: #f57c00; }
    .payment-icon.status-failed { background: #ffebee; }
    .payment-icon.status-failed mat-icon { color: #c62828; }
    .payment-info { flex: 1; }
    .payment-desc { margin: 0; font-size: 0.9rem; font-weight: 500; }
    .payment-date { margin: 2px 0 0; font-size: 0.78rem; color: #999; }
    .payment-amount { font-size: 1rem; font-weight: 700; white-space: nowrap; }
    .payment-amount.status-paid { color: #2e7d32; }
    .payment-amount.status-pending { color: #f57c00; }
    .payment-amount.status-failed { color: #c62828; text-decoration: line-through; }

    @media (max-width: 480px) {
      .summary-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class CarrierPaymentsComponent implements OnInit {
  private carrierService = inject(CarrierService);

  loading = signal(true);
  payments = signal<CarrierPayment[]>([]);

  totalPaid = computed(() =>
    this.payments().filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  );
  totalPending = computed(() =>
    this.payments().filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
  );

  ngOnInit(): void {
    this.carrierService.getPayments().subscribe({
      next: (data) => { this.payments.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}

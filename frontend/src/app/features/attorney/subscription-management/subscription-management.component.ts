import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UpperCasePipe, CurrencyPipe, DatePipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import {
  SubscriptionService, Subscription, SubscriptionPlan, CheckoutResult, BillingInvoice,
} from '../../../services/subscription.service';

@Component({
  selector: 'app-subscription-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UpperCasePipe, CurrencyPipe, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="sub-page">
      <h1>Subscription</h1>

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <mat-card class="current-plan">
          <mat-card-content>
            @if (subscription()) {
              <div class="plan-row">
                <div>
                  <p class="plan-name">{{ currentPlanName() }}</p>
                  <p class="plan-status status-{{ subscription()!.status }}">
                    {{ subscription()!.status | uppercase }}
                  </p>
                </div>
                <div class="plan-actions">
                  <button mat-stroked-button (click)="openBillingPortal()" aria-label="Manage billing in Stripe portal">
                    <mat-icon aria-hidden="true">open_in_new</mat-icon> Manage Billing
                  </button>
                  @if (subscription()!.status === 'active' || subscription()!.status === 'trialing') {
                    <button mat-stroked-button color="warn" (click)="cancelSubscription()">
                      Cancel Plan
                    </button>
                  }
                </div>
              </div>
              @if (subscription()!.cancel_at_period_end) {
                <p class="cancel-notice">
                  <mat-icon aria-hidden="true">info</mat-icon>
                  Your plan will cancel at the end of the billing period.
                </p>
              }
            } @else {
              <p class="no-sub">No active subscription.</p>
            }
          </mat-card-content>
        </mat-card>

        @if (plans().length > 0) {
          <h2>Available Plans</h2>
          <div class="plan-grid">
            @for (plan of plans(); track plan.id) {
              <mat-card class="plan-card" [class.current]="isCurrentPlan(plan)">
                <mat-card-content>
                  <p class="plan-card-name">{{ plan.name }}</p>
                  <p class="plan-price">
                    \${{ plan.price }}<span class="interval">/{{ plan.interval }}</span>
                  </p>
                  <ul class="features" aria-label="Plan features">
                    @for (f of plan.features; track f) {
                      <li><mat-icon aria-hidden="true">check</mat-icon> {{ f }}</li>
                    }
                  </ul>
                  @if (isCurrentPlan(plan)) {
                    <p class="current-badge">Current Plan</p>
                  } @else {
                    <button mat-raised-button color="primary"
                            (click)="selectPlan(plan)"
                            [attr.aria-label]="'Select ' + plan.name + ' plan'">
                      Select
                    </button>
                  }
                </mat-card-content>
              </mat-card>
            }
          </div>
        }

        @if (invoices().length > 0) {
          <h2>Billing History</h2>
          <mat-card class="invoices-card">
            <mat-card-content>
              <table class="invoice-table" aria-label="Billing history">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Status</th>
                    <th scope="col">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  @for (inv of invoices(); track inv.id) {
                    <tr>
                      <td>{{ inv.date | date:'mediumDate' }}</td>
                      <td>{{ inv.amount | currency:inv.currency.toUpperCase() }}</td>
                      <td class="inv-status">{{ inv.status | uppercase }}</td>
                      <td>
                        @if (inv.pdf_url) {
                          <a [href]="inv.pdf_url" target="_blank" rel="noopener noreferrer"
                             aria-label="Download invoice PDF">PDF</a>
                        }
                        @if (inv.hosted_url) {
                          <a [href]="inv.hosted_url" target="_blank" rel="noopener noreferrer"
                             aria-label="View invoice online" class="hosted-link">View</a>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .sub-page { max-width: 680px; margin: 0 auto; padding: 24px 16px; }
    h1 { margin: 0 0 20px; font-size: 1.4rem; }
    h2 { margin: 24px 0 12px; font-size: 1.1rem; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .current-plan { margin-bottom: 8px; }
    .plan-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .plan-actions { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
    .plan-name { margin: 0; font-size: 1.1rem; font-weight: 600; }
    .plan-status { margin: 4px 0 0; font-size: 0.75rem; font-weight: 600; }
    .status-active { color: #388e3c; }
    .status-trialing { color: #1976d2; }
    .status-past_due { color: #d32f2f; }
    .status-canceled { color: #757575; }
    .cancel-notice { display: flex; align-items: center; gap: 6px; font-size: 0.8rem;
      color: #f57c00; margin: 10px 0 0; }
    .cancel-notice mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .no-sub { color: #999; margin: 0; }
    .plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .plan-card { border: 2px solid transparent; }
    .plan-card.current { border-color: #1976d2; }
    .plan-card-name { margin: 0 0 4px; font-weight: 600; font-size: 0.95rem; }
    .plan-price { font-size: 1.4rem; font-weight: 700; margin: 4px 0 8px; }
    .interval { font-size: 0.8rem; font-weight: 400; color: #666; }
    .features { list-style: none; padding: 0; margin: 0 0 12px; font-size: 0.8rem; }
    .features li { display: flex; align-items: center; gap: 4px; padding: 2px 0; }
    .features mat-icon { font-size: 14px; width: 14px; height: 14px; color: #388e3c; }
    .current-badge { font-size: 0.75rem; font-weight: 600; color: #1976d2; margin: 0; }
    .invoices-card { margin-top: 4px; }
    .invoice-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .invoice-table th { text-align: left; padding: 8px 12px; font-weight: 600;
      border-bottom: 2px solid #e0e0e0; color: #555; }
    .invoice-table td { padding: 8px 12px; border-bottom: 1px solid #f0f0f0; }
    .invoice-table a { color: #1976d2; text-decoration: none; margin-right: 8px; }
    .invoice-table a:hover { text-decoration: underline; }
    .inv-status { font-size: 0.75rem; font-weight: 600; color: #388e3c; }
  `],
})
export class SubscriptionManagementComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private snackBar = inject(MatSnackBar);

  loading = signal(true);
  subscription = signal<Subscription | null>(null);
  plans = signal<SubscriptionPlan[]>([]);
  invoices = signal<BillingInvoice[]>([]);

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (s) => { this.subscription.set(s); this.loadPlansAndInvoices(); },
      error: (err) => {
        if (err.status === 404) {
          this.subscription.set(null);
          this.loadPlansAndInvoices();
        } else {
          this.loading.set(false);
          this.snackBar.open('Failed to load subscription.', 'Close', { duration: 3000 });
        }
      },
    });
  }

  private loadPlansAndInvoices(): void {
    this.subscriptionService.getPlans().subscribe({
      next: (p) => {
        this.plans.set(p);
        this.loadInvoices();
      },
      error: () => {
        this.plans.set([]);
        this.loading.set(false);
      },
    });
  }

  private loadInvoices(): void {
    this.subscriptionService.getInvoices().subscribe({
      next: (inv) => { this.invoices.set(inv); this.loading.set(false); },
      error: () => { this.invoices.set([]); this.loading.set(false); },
    });
  }

  currentPlanName(): string {
    const sub = this.subscription();
    if (!sub) return 'No Plan';
    const match = this.plans().find(p => p.id === sub.plan_name);
    return match?.name ?? sub.plan_name ?? 'Unknown Plan';
  }

  isCurrentPlan(plan: SubscriptionPlan): boolean {
    return plan.id === this.subscription()?.plan_name;
  }

  openBillingPortal(): void {
    this.subscriptionService.getBillingPortalUrl().subscribe({
      next: ({ url }) => { window.open(url, '_blank', 'noopener,noreferrer'); },
      error: () => {
        this.snackBar.open('Failed to open billing portal.', 'Close', { duration: 3000 });
      },
    });
  }

  selectPlan(plan: SubscriptionPlan): void {
    if (!confirm(`Switch to ${plan.name}?`)) return;
    this.loading.set(true);
    this.subscriptionService.createCheckoutSession(plan.price_id).subscribe({
      next: (result: CheckoutResult) => {
        if (result.subscription) {
          this.subscription.set(result.subscription);
          this.loading.set(false);
          this.snackBar.open(`Switched to ${plan.name}!`, 'Close', { duration: 3000 });
        } else if (result.url) {
          window.location.href = result.url;
        }
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to change plan.', 'Close', { duration: 3000 });
      },
    });
  }

  cancelSubscription(): void {
    if (!confirm('Cancel your subscription? Access continues until the end of the billing period.')) return;
    this.loading.set(true);
    this.subscriptionService.cancelSubscription(this.subscription()!.id, false).subscribe({
      next: (s) => {
        this.subscription.set(s);
        this.loading.set(false);
        this.snackBar.open('Subscription will cancel at period end.', 'Close', { duration: 4000 });
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Failed to cancel subscription.', 'Close', { duration: 3000 });
      },
    });
  }
}

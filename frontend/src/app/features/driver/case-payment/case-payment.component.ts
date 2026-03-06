import {
  Component, OnInit, OnDestroy, AfterViewInit,
  signal, inject, ChangeDetectionStrategy,
  ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';

@Component({
  selector: 'app-case-payment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe, MatCardModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="payment-container">
      <div class="payment-header">
        <button mat-icon-button (click)="goBack()" aria-label="Go back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Pay Attorney Fee</h1>
      </div>

      @if (loadingCase()) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else {
        <mat-card class="fee-card">
          <mat-card-content>
            <div class="fee-row">
              <span>Case</span>
              <span>{{ caseNumber() }}</span>
            </div>
            <div class="fee-row">
              <span>Attorney</span>
              <span>{{ attorneyName() }}</span>
            </div>
            @if (violationType()) {
              <div class="fee-row">
                <span>Violation</span>
                <span>{{ violationType() }}</span>
              </div>
            }
            <mat-divider style="margin: 12px 0;"></mat-divider>
            <div class="fee-row total">
              <span>Total</span>
              <span class="amount">{{ amount() | currency }}</span>
            </div>
            <p class="trust-line">
              <mat-icon aria-hidden="true">lock</mat-icon>
              No hidden fees. Secure payment via Stripe.
            </p>
          </mat-card-content>
        </mat-card>

        <mat-card class="payment-card">
          <mat-card-header>
            <mat-card-title>Card Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div #cardEl class="card-element-host" aria-label="Credit or debit card input"></div>
            @if (cardError()) {
              <p class="card-error" role="alert">{{ cardError() }}</p>
            }
            @if (!stripeReady() && !loadingCase()) {
              <p class="stripe-unavailable">Payment form loading…</p>
            }
          </mat-card-content>
          <mat-card-actions>
            <button
              mat-raised-button
              color="primary"
              class="pay-button"
              [disabled]="paying() || !stripeReady()"
              (click)="pay()"
              [attr.aria-label]="'Pay ' + (amount() | currency)">
              @if (paying()) {
                <mat-spinner diameter="20"></mat-spinner>
                Processing…
              } @else {
                <mat-icon aria-hidden="true">lock</mat-icon>
                Pay {{ amount() | currency }}
              }
            </button>
          </mat-card-actions>
        </mat-card>

        <p class="escape-hatch">
          Need a payment plan?
          <a href="mailto:support@cdlticket.com">Contact support</a>
        </p>
      }
    </div>
  `,
  styles: [`
    .payment-container { max-width: 480px; margin: 0 auto; padding: 16px; }
    .payment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .payment-header h1 { margin: 0; font-size: 1.4rem; }
    .loading-state { display: flex; justify-content: center; padding: 48px; }
    .fee-card, .payment-card { margin-bottom: 16px; }
    .fee-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .fee-row.total { font-size: 1.2rem; font-weight: 700; }
    .amount { color: #1976d2; }
    .trust-line { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #666; margin-top: 8px; }
    .trust-line mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .card-element-host { padding: 12px; border: 1px solid #ccc; border-radius: 4px; margin: 12px 0; min-height: 44px; }
    .card-error { color: #d32f2f; font-size: 0.875rem; margin: 4px 0; }
    .stripe-unavailable { color: #999; font-size: 0.875rem; }
    mat-card-actions { padding: 8px 16px 16px; }
    .pay-button { width: 100%; height: 48px; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .escape-hatch { text-align: center; font-size: 0.875rem; color: #666; }
    .escape-hatch a { color: #1976d2; }
  `]
})
export class CasePaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cardEl') cardElRef!: ElementRef;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  private readonly apiUrl = environment.apiUrl;

  caseId = signal('');
  caseNumber = signal('');
  attorneyName = signal('');
  violationType = signal('');
  amount = signal(0);
  loadingCase = signal(true);
  paying = signal(false);
  stripeReady = signal(false);
  cardError = signal('');

  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;
  private clientSecret = '';
  private paymentIntentId = '';

  ngOnInit(): void {
    this.caseId.set(this.route.snapshot.params['caseId']);
    this.loadCaseAndIntent();
  }

  private loadCaseAndIntent(): void {
    this.http.get<any>(`${this.apiUrl}/cases/${this.caseId()}`).subscribe({
      next: (response) => {
        const c = response.case || response;
        this.caseNumber.set(c.case_number || this.caseId());
        this.attorneyName.set(c.attorney?.full_name || 'Assigned Attorney');
        this.violationType.set(c.violation_type || '');
        this.amount.set(c.attorney_price || 0);
        this.loadingCase.set(false);
        this.createPaymentIntent();
      },
      error: () => {
        this.loadingCase.set(false);
        this.snackBar.open('Failed to load case details.', 'Close', { duration: 3000 });
      }
    });
  }

  private createPaymentIntent(): void {
    this.http.post<any>(`${this.apiUrl}/cases/${this.caseId()}/payments`, {}).subscribe({
      next: (response) => {
        this.clientSecret = response.clientSecret;
        this.paymentIntentId = response.paymentIntentId;
      },
      error: () => {
        this.snackBar.open('Failed to initialize payment. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }

  ngAfterViewInit(): void {
    this.initStripe();
  }

  private async initStripe(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/payments/config`)
      );
      const publishableKey = config?.publishableKey;
      if (!publishableKey) return;

      this.stripe = await loadStripe(publishableKey);
      if (!this.stripe || !this.cardElRef) return;

      const elements = this.stripe.elements();
      this.cardElement = elements.create('card', {
        style: { base: { fontSize: '16px', color: '#424770', lineHeight: '24px' } }
      });
      this.cardElement.mount(this.cardElRef.nativeElement);
      this.cardElement.on('change', (event) => {
        this.cardError.set(event.error?.message ?? '');
      });
      this.stripeReady.set(true);
    } catch {
      // Stripe failed to load — form remains disabled
    }
  }

  async pay(): Promise<void> {
    if (!this.stripe || !this.cardElement || !this.clientSecret) return;

    this.paying.set(true);
    this.cardError.set('');

    const { error, paymentIntent } = await this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: { card: this.cardElement }
    });

    if (error) {
      this.cardError.set(error.message ?? 'Payment failed. Please try again.');
      this.paying.set(false);
      return;
    }

    this.http.post<any>(`${this.apiUrl}/payments/confirm`, {
      paymentIntentId: this.paymentIntentId
    }).subscribe({
      next: () => {
        this.paying.set(false);
        this.router.navigate(
          ['/driver/cases', this.caseId(), 'payment-success'],
          { state: { amount: this.amount(), transactionId: paymentIntent?.id ?? this.paymentIntentId } }
        );
      },
      error: () => {
        this.paying.set(false);
        this.snackBar.open(
          'Payment processed but confirmation failed. Please contact support.',
          'Close', { duration: 7000 }
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.cardElement?.destroy();
  }

  goBack(): void {
    this.router.navigate(['/driver/cases', this.caseId()]);
  }
}

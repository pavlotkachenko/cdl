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

interface PlanOption {
  label: string;
  weeks: number;
  installments: number;
  weeklyAmount?: number;
  amount?: number;
  popular?: boolean;
}

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

        <!-- Payment plan selector -->
        @if (loadingPlans()) {
          <mat-card class="plan-card">
            <mat-card-content class="plan-loading">
              <mat-spinner diameter="24"></mat-spinner>
              <span>Loading payment options…</span>
            </mat-card-content>
          </mat-card>
        } @else {
          <mat-card class="plan-card">
            <mat-card-header>
              <mat-card-title>Choose Payment Option</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <!-- Pay Now -->
              <div class="plan-option" [class.selected]="selectedPlan() === 'full'"
                (click)="selectPlan('full')" role="radio"
                [attr.aria-checked]="selectedPlan() === 'full'" tabindex="0"
                (keydown.enter)="selectPlan('full')">
                <div class="plan-radio">
                  <mat-icon>{{ selectedPlan() === 'full' ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
                </div>
                <div class="plan-info">
                  <span class="plan-label">Pay Now</span>
                  <span class="plan-amount">{{ amount() | currency }} total</span>
                </div>
              </div>

              <!-- Installment plans -->
              @for (plan of planOptions(); track plan.weeks) {
                <div class="plan-option" [class.selected]="selectedPlan() === plan.weeks.toString()"
                  (click)="selectPlan(plan.weeks.toString())" role="radio"
                  [attr.aria-checked]="selectedPlan() === plan.weeks.toString()" tabindex="0"
                  (keydown.enter)="selectPlan(plan.weeks.toString())">
                  <div class="plan-radio">
                    <mat-icon>{{ selectedPlan() === plan.weeks.toString() ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
                  </div>
                  <div class="plan-info">
                    <span class="plan-label">
                      {{ plan.label }}
                      @if (plan.popular) { <span class="popular-badge">Most Popular</span> }
                    </span>
                    <span class="plan-amount">{{ plan.weeklyAmount | currency }}/week × {{ plan.installments }} payments</span>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>
        }

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
              [attr.aria-label]="payButtonLabel()">
              @if (paying()) {
                <mat-spinner diameter="20"></mat-spinner>
                Processing…
              } @else {
                <mat-icon aria-hidden="true">lock</mat-icon>
                {{ payButtonLabel() }}
              }
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- Success: installment schedule -->
        @if (planSchedule().length > 0) {
          <mat-card class="schedule-card">
            <mat-card-header>
              <mat-card-title>Payment Schedule</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @for (item of planSchedule(); track item.installment_num) {
                <div class="schedule-row" [class.paid]="item.status === 'paid'">
                  <span>#{{ item.installment_num }}</span>
                  <span>{{ item.amount | currency }}</span>
                  <span>{{ item.due_date }}</span>
                  @if (item.status === 'paid') { <mat-icon class="paid-icon">check_circle</mat-icon> }
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .payment-container { max-width: 480px; margin: 0 auto; padding: 16px; }
    .payment-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .payment-header h1 { margin: 0; font-size: 1.4rem; }
    .loading-state { display: flex; justify-content: center; padding: 48px; }
    .fee-card, .payment-card, .plan-card, .schedule-card { margin-bottom: 16px; }
    .fee-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .fee-row.total { font-size: 1.2rem; font-weight: 700; }
    .amount { color: #1976d2; }
    .trust-line { display: flex; align-items: center; gap: 4px; font-size: 0.8rem; color: #666; margin-top: 8px; }
    .trust-line mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .plan-loading { display: flex; align-items: center; gap: 12px; padding: 16px; }
    .plan-option { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 8px; cursor: pointer;
      border: 2px solid transparent; margin-bottom: 8px; transition: border-color 0.15s; }
    .plan-option:hover { background: #f5f5f5; }
    .plan-option.selected { border-color: #1976d2; background: #e3f2fd; }
    .plan-radio mat-icon { color: #1976d2; }
    .plan-info { display: flex; flex-direction: column; }
    .plan-label { font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 8px; }
    .plan-amount { font-size: 0.85rem; color: #555; }
    .popular-badge { background: #1976d2; color: #fff; border-radius: 4px; padding: 1px 6px; font-size: 0.7rem; font-weight: 700; }
    .card-element-host { padding: 12px; border: 1px solid #ccc; border-radius: 4px; margin: 12px 0; min-height: 44px; }
    .card-error { color: #d32f2f; font-size: 0.875rem; margin: 4px 0; }
    .stripe-unavailable { color: #999; font-size: 0.875rem; }
    mat-card-actions { padding: 8px 16px 16px; }
    .pay-button { width: 100%; height: 48px; font-size: 1rem; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .schedule-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 0.875rem; }
    .schedule-row:last-child { border-bottom: none; }
    .schedule-row.paid { color: #388e3c; }
    .paid-icon { font-size: 16px; width: 16px; height: 16px; color: #388e3c; }
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
  loadingPlans = signal(true);
  paying = signal(false);
  stripeReady = signal(false);
  cardError = signal('');
  selectedPlan = signal('4'); // default: 4-week plan (most popular)
  planOptions = signal<PlanOption[]>([]);
  planSchedule = signal<any[]>([]);

  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;
  private clientSecret = '';
  private paymentIntentId = '';

  payButtonLabel(): string {
    const plan = this.selectedPlan();
    const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    if (plan === 'full') return `Pay ${fmt(this.amount())}`;
    const weeks = Number(plan);
    const opt = this.planOptions().find(p => p.weeks === weeks);
    if (opt) return `Pay ${fmt(opt.weeklyAmount ?? 0)}/week`;
    return 'Pay';
  }

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
        this.loadPlanOptions();
        this.createPaymentIntent();
      },
      error: () => {
        this.loadingCase.set(false);
        this.snackBar.open('Failed to load case details.', 'Close', { duration: 3000 });
      }
    });
  }

  private loadPlanOptions(): void {
    this.http.get<any>(`${this.apiUrl}/payments/plan-options/${this.caseId()}`).subscribe({
      next: (res) => {
        const d = res.data;
        this.planOptions.set([d.twoWeek, d.fourWeek, d.eightWeek]);
        this.loadingPlans.set(false);
      },
      error: () => {
        this.loadingPlans.set(false);
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

  selectPlan(plan: string): void {
    this.selectedPlan.set(plan);
  }

  async pay(): Promise<void> {
    if (!this.stripe || !this.cardElement) return;

    this.paying.set(true);
    this.cardError.set('');

    const plan = this.selectedPlan();

    if (plan === 'full') {
      if (!this.clientSecret) { this.paying.set(false); return; }
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
          this.snackBar.open('Payment processed but confirmation failed. Please contact support.', 'Close', { duration: 7000 });
        }
      });
    } else {
      // Installment plan flow
      const { error: pmError, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardElement,
      });
      if (pmError) {
        this.cardError.set(pmError.message ?? 'Card error. Please try again.');
        this.paying.set(false);
        return;
      }
      this.http.post<any>(`${this.apiUrl}/payments/create-plan`, {
        caseId: this.caseId(),
        weeks: Number(plan),
        paymentMethodId: paymentMethod?.id,
      }).subscribe({
        next: (res) => {
          this.paying.set(false);
          this.planSchedule.set(res.data?.schedule ?? []);
          this.snackBar.open('Payment plan created! First payment processed.', 'Close', { duration: 4000 });
        },
        error: (err) => {
          this.paying.set(false);
          this.cardError.set(err?.error?.message ?? 'Failed to create payment plan.');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.cardElement?.destroy();
  }

  goBack(): void {
    this.router.navigate(['/driver/cases', this.caseId()]);
  }
}

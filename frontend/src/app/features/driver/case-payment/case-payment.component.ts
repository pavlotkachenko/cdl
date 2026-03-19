import {
  Component, OnInit, OnDestroy, AfterViewInit,
  signal, computed, inject, ChangeDetectionStrategy,
  ViewChild, ElementRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  loadStripe,
  Stripe,
  StripeElements,
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement,
} from '@stripe/stripe-js';

interface PlanOption {
  key: 'full' | '2' | '4' | '8';
  label: string;
  weeks: number;
  installments: number;
  weeklyAmount?: number;
  amount?: number;
  popular?: boolean;
}

interface AttorneyStats {
  name: string;
  win_rate: number;
  years_experience: number;
  cases_won: number;
}

@Component({
  selector: 'app-case-payment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, MatProgressSpinnerModule],
  templateUrl: './case-payment.component.html',
  styleUrl: './case-payment.component.scss'
})
export class CasePaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cardNumber') cardNumberRef!: ElementRef;
  @ViewChild('cardExpiry') cardExpiryRef!: ElementRef;
  @ViewChild('cardCvc')    cardCvcRef!: ElementRef;

  private route    = inject(ActivatedRoute);
  private router   = inject(Router);
  private http     = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  private readonly apiUrl = environment.apiUrl;

  // ─── Case data ───────────────────────────────────────────────────
  caseId        = signal('');
  caseNumber    = signal('');
  violationType = signal('');
  courtDate     = signal('');
  courtLocation = signal('');
  amount        = signal(0);

  // ─── Attorney stats ───────────────────────────────────────────────
  attorney = signal<AttorneyStats | null>(null);

  // ─── UI state ─────────────────────────────────────────────────────
  loadingCase  = signal(true);
  loadingPlans = signal(true);
  paying       = signal(false);
  stripeReady  = signal(false);

  // ─── Stripe field errors ──────────────────────────────────────────
  cardNumberError = signal('');
  cardExpiryError = signal('');
  cardCvcError    = signal('');

  // ─── Plan selection ───────────────────────────────────────────────
  selectedPlan = signal<'full' | '2' | '4' | '8'>('4');
  planOptions  = signal<PlanOption[]>([]);
  planSchedule = signal<{ installment_num: number; due_date: string; amount: number; status: string }[]>([]);

  // ─── Computed ─────────────────────────────────────────────────────
  processingFee = computed(() =>
    Math.round((this.amount() * 0.029 + 0.30) * 100) / 100
  );

  totalAmount = computed(() => this.amount() + this.processingFee());

  firstInstallment = computed(() => {
    const key = this.selectedPlan();
    if (key === 'full') return 0;
    const opt = this.planOptions().find(p => p.key === key);
    return opt?.weeklyAmount ?? 0;
  });

  // ─── Stripe private state ─────────────────────────────────────────
  private stripe: Stripe | null = null;
  private stripeElements: StripeElements | null = null;
  private cardNumberElement: StripeCardNumberElement | null = null;
  private cardExpiryElement: StripeCardExpiryElement | null = null;
  private cardCvcElement: StripeCardCvcElement | null = null;
  private clientSecret = '';
  private paymentIntentId = '';

  payButtonLabel(): string {
    const fmt = (n: number) =>
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    if (this.selectedPlan() === 'full') return `Pay ${fmt(this.totalAmount())}`;
    return `Pay ${fmt(this.firstInstallment())} now`;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.caseId.set(this.route.snapshot.params['caseId']);
    // Load Stripe SDK early (parallel with case data), but don't mount yet
    this.loadStripeSDK();
    this.loadCaseData();
  }

  ngAfterViewInit(): void {
    // Mounting happens after case data loads so DOM refs are available
  }

  ngOnDestroy(): void {
    this.cardNumberElement?.destroy();
    this.cardExpiryElement?.destroy();
    this.cardCvcElement?.destroy();
  }

  // ─── Data loading ─────────────────────────────────────────────────
  private loadCaseData(): void {
    this.http.get<{ case: Record<string, unknown> }>(`${this.apiUrl}/cases/${this.caseId()}`).subscribe({
      next: (response) => {
        const c = response.case as Record<string, unknown>;
        this.caseNumber.set((c['case_number'] as string) || this.caseId());
        this.violationType.set((c['violation_type'] as string) || '');
        this.courtDate.set((c['court_date'] as string) || '');
        this.courtLocation.set(((c['court_location'] as string) || (c['court_name'] as string)) || '');
        this.amount.set((c['attorney_price'] as number) || 0);

        const att = c['attorney'] as Record<string, unknown> | null | undefined;
        if (att) {
          this.attorney.set({
            name: (att['full_name'] as string) || 'Assigned Attorney',
            win_rate: (att['win_rate'] as number) ?? 0,
            years_experience: (att['years_experience'] as number) ?? 1,
            cases_won: (att['cases_won'] as number) ?? 0,
          });
        }

        this.loadingCase.set(false);
        this.loadPlanOptions();
        this.createPaymentIntent();
        // Defer Stripe element mounting until after Angular re-renders the @else block
        setTimeout(() => this.mountStripeElements(), 0);
      },
      error: () => {
        this.loadingCase.set(false);
        this.snackBar.open('Failed to load case details.', 'Close', { duration: 3000 });
      }
    });
  }

  private loadPlanOptions(): void {
    this.http.get<{ data: Record<string, Record<string, unknown>> }>(
      `${this.apiUrl}/payments/plan-options/${this.caseId()}`
    ).subscribe({
      next: (res) => {
        const d = res.data;
        this.planOptions.set([
          { key: 'full', label: 'Pay in Full', weeks: 0, installments: 1, amount: d['payNow']?.['amount'] as number },
          { key: '4',    label: '4 Weeks',     weeks: 4, installments: 4, weeklyAmount: d['fourWeek']?.['weeklyAmount'] as number, popular: true },
          { key: '8',    label: '8 Weeks',     weeks: 8, installments: 8, weeklyAmount: d['eightWeek']?.['weeklyAmount'] as number },
        ]);
        this.loadingPlans.set(false);
      },
      error: () => this.loadingPlans.set(false)
    });
  }

  private createPaymentIntent(): void {
    this.http.post<{ clientSecret: string; paymentIntentId: string }>(
      `${this.apiUrl}/cases/${this.caseId()}/payments`, {}
    ).subscribe({
      next: (response) => {
        this.clientSecret    = response.clientSecret;
        this.paymentIntentId = response.paymentIntentId;
      },
      error: () => {
        this.snackBar.open('Failed to initialize payment. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }

  // ─── Stripe init ──────────────────────────────────────────────────
  // Phase 1: load SDK (runs early, parallel with case data fetch)
  private async loadStripeSDK(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.http.get<{ publishableKey?: string; data?: { publishableKey: string } }>(`${this.apiUrl}/payments/config`)
      );
      const publishableKey = config?.publishableKey ?? config?.data?.publishableKey;
      if (!publishableKey) return;

      this.stripe = await loadStripe(publishableKey);
      if (!this.stripe) return;

      this.stripeElements = this.stripe.elements();
    } catch {
      // Stripe SDK failed to load
    }
  }

  // Phase 2: mount elements into DOM (runs after loadingCase → false so refs exist)
  private mountStripeElements(): void {
    // If SDK hasn't finished loading yet, retry until it's ready
    if (!this.stripe || !this.stripeElements) {
      setTimeout(() => this.mountStripeElements(), 200);
      return;
    }
    if (!this.cardNumberRef?.nativeElement) return;

    const elementStyle = {
      base: {
        fontSize: '16px',
        color: '#1a1a2e',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        '::placeholder': { color: '#9ca3af' },
      },
      invalid: { color: '#ef4444' },
    };

    // All three elements must be from the same stripeElements instance
    this.cardNumberElement = this.stripeElements.create('cardNumber', { style: elementStyle });
    this.cardNumberElement.mount(this.cardNumberRef.nativeElement);
    this.cardNumberElement.on('change', (e) => this.cardNumberError.set(e.error?.message ?? ''));

    this.cardExpiryElement = this.stripeElements.create('cardExpiry', { style: elementStyle });
    this.cardExpiryElement.mount(this.cardExpiryRef.nativeElement);
    this.cardExpiryElement.on('change', (e) => this.cardExpiryError.set(e.error?.message ?? ''));

    this.cardCvcElement = this.stripeElements.create('cardCvc', { style: elementStyle });
    this.cardCvcElement.mount(this.cardCvcRef.nativeElement);
    this.cardCvcElement.on('change', (e) => this.cardCvcError.set(e.error?.message ?? ''));

    this.stripeReady.set(true);
  }

  // ─── Actions ──────────────────────────────────────────────────────
  selectPlan(plan: 'full' | '2' | '4' | '8'): void {
    this.selectedPlan.set(plan);
  }

  async pay(): Promise<void> {
    if (!this.stripe || !this.cardNumberElement) return;

    this.paying.set(true);
    this.cardNumberError.set('');

    const plan = this.selectedPlan();

    if (plan === 'full') {
      if (!this.clientSecret) { this.paying.set(false); return; }

      const { error, paymentIntent } = await this.stripe.confirmCardPayment(this.clientSecret, {
        payment_method: { card: this.cardNumberElement }
      });

      if (error) {
        this.cardNumberError.set(error.message ?? 'Payment failed. Please try again.');
        this.paying.set(false);
        return;
      }

      this.http.post<void>(`${this.apiUrl}/payments/confirm`, {
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
            'Close',
            { duration: 7000 }
          );
        }
      });

    } else {
      // Installment plan — create a PaymentMethod and pass to backend
      const { error: pmError, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardNumberElement,
      });

      if (pmError) {
        this.cardNumberError.set(pmError.message ?? 'Card error. Please try again.');
        this.paying.set(false);
        return;
      }

      this.http.post<{
        data: { schedule: { installment_num: number; due_date: string; amount: number; status: string }[] }
      }>(
        `${this.apiUrl}/payments/create-plan`,
        { caseId: this.caseId(), weeks: Number(plan), paymentMethodId: paymentMethod?.id }
      ).subscribe({
        next: (res) => {
          this.paying.set(false);
          this.planSchedule.set(res.data?.schedule ?? []);
          this.snackBar.open('Payment plan created! First payment processed.', 'Close', { duration: 4000 });
        },
        error: (err) => {
          this.paying.set(false);
          this.cardNumberError.set((err?.error?.message as string) ?? 'Failed to create payment plan.');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/driver/cases', this.caseId()]);
  }
}

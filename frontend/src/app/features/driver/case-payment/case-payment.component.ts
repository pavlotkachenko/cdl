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
import {
  loadStripe,
  Stripe,
  StripeElements,
  StripeCardNumberElement,
  StripeCardExpiryElement,
  StripeCardCvcElement,
} from '@stripe/stripe-js';

interface PlanOption {
  key: string;
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
  imports: [CurrencyPipe],
  templateUrl: './case-payment.component.html',
  styleUrl: './case-payment.component.scss'
})
export class CasePaymentComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cardNumber') cardNumberRef!: ElementRef;
  @ViewChild('cardExpiry') cardExpiryRef!: ElementRef;
  @ViewChild('cardCvc')    cardCvcRef!: ElementRef;

  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private http   = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  // ─── Case data ───────────────────────────────────────────────────
  caseId        = signal('');
  caseNumber    = signal('');
  violationType = signal('');
  courtDate     = signal('');
  courtLocation = signal('');
  caseStatus    = signal('');
  amount        = signal(0);

  // ─── Attorney stats ───────────────────────────────────────────────
  attorney = signal<AttorneyStats | null>(null);

  attorneyInitials = computed(() => {
    const name = this.attorney()?.name;
    if (!name) return '';
    return name.split(' ').map(w => w.charAt(0).toUpperCase()).join('');
  });

  // ─── UI state ─────────────────────────────────────────────────────
  loadingCase  = signal(true);
  loadingPlans = signal(true);
  paying       = signal(false);
  stripeReady  = signal(false);

  // ─── Feedback (replaces MatSnackBar) ──────────────────────────────
  paymentError   = signal('');
  loadError      = signal('');

  // ─── Stripe field errors ──────────────────────────────────────────
  cardNumberError = signal('');
  cardExpiryError = signal('');
  cardCvcError    = signal('');

  // ─── Cardholder name (non-sensitive, regular input) ───────────────
  cardholderName = signal('');

  // ─── Plan selection ───────────────────────────────────────────────
  selectedPlan = signal<'full' | 'plan'>('full');
  planOptions  = signal<PlanOption[]>([]);
  planSchedule = signal<{ installment_num: number; due_date: string; amount: number; status: string }[]>([]);

  // ─── Computed ─────────────────────────────────────────────────────
  defaultPlanOption = computed(() => {
    return this.planOptions().find(p => p.popular) ?? this.planOptions().find(p => p.key !== 'full');
  });

  planDescription = computed(() => {
    const opt = this.defaultPlanOption();
    if (!opt) return '';
    return `Split into ${opt.installments} weekly payments of ${this.formatCurrency(opt.weeklyAmount ?? 0)}.`;
  });

  planSchedulePreview = computed(() => {
    const opt = this.defaultPlanOption();
    if (!opt || !opt.weeklyAmount) return [];
    const today = new Date();
    return Array.from({ length: opt.installments }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i * 7);
      return {
        num: i + 1,
        date: i === 0 ? `Today — ${this.formatDate(date)}` : this.formatDate(date),
        amount: opt.weeklyAmount!,
        isFirst: i === 0,
      };
    });
  });

  orderTotal = computed(() => {
    if (this.selectedPlan() === 'full') return this.amount();
    const opt = this.defaultPlanOption();
    return opt?.weeklyAmount ?? this.amount();
  });

  payButtonAmount = computed(() => this.formatCurrency(this.orderTotal()));

  // ─── Stripe private state ─────────────────────────────────────────
  private stripe: Stripe | null = null;
  private stripeElements: StripeElements | null = null;
  private cardNumberElement: StripeCardNumberElement | null = null;
  private cardExpiryElement: StripeCardExpiryElement | null = null;
  private cardCvcElement: StripeCardCvcElement | null = null;
  private clientSecret = '';
  private paymentIntentId = '';

  // ─── Helpers ──────────────────────────────────────────────────────
  private formatCurrency(n: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  private formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      new: 'Submitted', reviewed: 'Under Review', in_progress: 'In Progress',
      assigned_to_attorney: 'Attorney Assigned', pay_attorney: 'Payment Required',
      closed: 'Case Closed', resolved: 'Resolved',
    };
    return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getViolationLabel(type: string): string {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  payButtonLabel(): string {
    if (this.selectedPlan() === 'full') return `Pay ${this.payButtonAmount()}`;
    return `Pay ${this.payButtonAmount()} today`;
  }

  // ─── Lifecycle ────────────────────────────────────────────────────
  ngOnInit(): void {
    this.caseId.set(this.route.snapshot.params['caseId']);
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
        this.caseStatus.set((c['status'] as string) || '');
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
        setTimeout(() => this.mountStripeElements(), 0);
      },
      error: () => {
        this.loadingCase.set(false);
        this.loadError.set('Failed to load case details. Please go back and try again.');
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
        this.paymentError.set('Failed to initialize payment. Please try again.');
      }
    });
  }

  // ─── Stripe init ──────────────────────────────────────────────────
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

  private mountStripeElements(): void {
    if (!this.stripe || !this.stripeElements) {
      setTimeout(() => this.mountStripeElements(), 200);
      return;
    }
    if (!this.cardNumberRef?.nativeElement) return;

    const elementStyle = {
      base: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#0f2137',
        fontFamily: "'Mulish', -apple-system, sans-serif",
        '::placeholder': { color: '#98a8b4' },
      },
      invalid: { color: '#ef4444' },
    };

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
  selectPlan(plan: 'full' | 'plan'): void {
    this.selectedPlan.set(plan);
  }

  onCardholderInput(event: Event): void {
    this.cardholderName.set((event.target as HTMLInputElement).value);
  }

  onPlanKeydown(event: KeyboardEvent): void {
    if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      this.selectPlan(this.selectedPlan() === 'full' ? 'plan' : 'full');
      const active = (event.currentTarget as HTMLElement)
        .querySelector<HTMLElement>('[aria-checked="true"]');
      active?.focus();
    }
  }

  async pay(): Promise<void> {
    if (!this.stripe || !this.cardNumberElement) return;

    this.paying.set(true);
    this.paymentError.set('');
    this.cardNumberError.set('');

    const billingDetails = { name: this.cardholderName() || undefined };

    if (this.selectedPlan() === 'full') {
      if (!this.clientSecret) { this.paying.set(false); return; }

      const { error, paymentIntent } = await this.stripe.confirmCardPayment(this.clientSecret, {
        payment_method: { card: this.cardNumberElement, billing_details: billingDetails }
      });

      if (error) {
        this.paymentError.set(error.message ?? 'Payment failed. Please try again.');
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
          this.paymentError.set('Payment processed but confirmation failed. Please contact support.');
        }
      });

    } else {
      const planOpt = this.defaultPlanOption();
      const weeks = planOpt?.weeks ?? 4;

      const { error: pmError, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardNumberElement,
        billing_details: billingDetails,
      });

      if (pmError) {
        this.paymentError.set(pmError.message ?? 'Card error. Please try again.');
        this.paying.set(false);
        return;
      }

      this.http.post<{
        data: { schedule: { installment_num: number; due_date: string; amount: number; status: string }[] }
      }>(
        `${this.apiUrl}/payments/create-plan`,
        { caseId: this.caseId(), weeks, paymentMethodId: paymentMethod?.id }
      ).subscribe({
        next: (res) => {
          this.paying.set(false);
          this.planSchedule.set(res.data?.schedule ?? []);
        },
        error: (err) => {
          this.paying.set(false);
          this.paymentError.set((err?.error?.message as string) ?? 'Failed to create payment plan.');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/driver/cases', this.caseId()]);
  }

  navigateToCase(): void {
    this.router.navigate(['/driver/cases', this.caseId()]);
  }
}

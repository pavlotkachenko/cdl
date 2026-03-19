import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CurrencyPipe, DatePipe, UpperCasePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';

interface ConfirmationData {
  payment_id: string;
  amount: number;
  currency: string;
  status: string;
  transaction_id: string;
  stripe_payment_intent_id: string;
  paid_at: string | null;
  card_brand: string | null;
  card_last4: string | null;
  case: {
    id: string;
    case_number: string;
    violation_type: string;
    violation_location: string;
  } | null;
  attorney: {
    name: string;
    initials: string;
  } | null;
  driver_email: string | null;
}

@Component({
  selector: 'app-payment-success',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, UpperCasePipe],
  template: `
    <div class="success-container">
      <div class="success-card">
        <!-- Top gradient bar -->
        <div class="top-bar" aria-hidden="true"></div>

        <!-- Green header section -->
        <div class="header-section">
          <!-- Animated success icon -->
          <div class="success-icon" role="status" aria-label="Payment confirmed">
            <div class="icon-ring">
              <div class="icon-circle">
                <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          </div>

          <h1>Payment <strong>Received!</strong> <span aria-hidden="true">🎉</span></h1>
          <p class="subtitle">Your attorney has been notified and will begin working on your defense immediately.</p>
        </div>

        @if (loading()) {
          <div class="loading-section">
            <p>Loading payment details...</p>
          </div>
        }

        <!-- Receipt block -->
        @if (confirmationData() || fallbackMode()) {
          <section class="receipt-block" aria-label="Payment receipt">
            <div class="receipt-header">
              <div class="receipt-title">
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span>PAYMENT RECEIPT</span>
              </div>
              <span class="confirmed-badge">Confirmed</span>
            </div>

            <div class="receipt-rows">
              <!-- Amount -->
              <div class="receipt-row">
                <div class="receipt-label">
                  <span aria-hidden="true">💰</span> Amount Paid
                </div>
                <div class="receipt-value amount-value">{{ displayAmount() | currency }}</div>
              </div>

              <!-- Transaction ID -->
              @if (displayTransactionId()) {
                <div class="receipt-row">
                  <div class="receipt-label">
                    <span aria-hidden="true">🔖</span> Transaction ID
                  </div>
                  <div class="receipt-value txn-row">
                    <code>{{ displayTransactionId() }}</code>
                    <button type="button" class="copy-btn" (click)="copyTransactionId()" aria-label="Copy transaction ID">
                      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      <span aria-live="polite">{{ copyFeedback() }}</span>
                    </button>
                  </div>
                </div>
              }

              <!-- Date & Time -->
              @if (displayDate()) {
                <div class="receipt-row">
                  <div class="receipt-label">
                    <span aria-hidden="true">📅</span> Date &amp; Time
                  </div>
                  <div class="receipt-value">{{ displayDate() | date:'MMMM d, y · h:mm a' }}</div>
                </div>
              }

              <!-- Payment Method -->
              @if (displayCardBrand() || displayCardLast4()) {
                <div class="receipt-row">
                  <div class="receipt-label">
                    <span aria-hidden="true">💳</span> Payment Method
                  </div>
                  <div class="receipt-value card-row">
                    @if (displayCardBrand()) {
                      <span class="card-badge">{{ displayCardBrand() | uppercase }}</span>
                    }
                    <span>ending in {{ displayCardLast4() || '****' }}</span>
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- Case snippet -->
        @if (confirmationData()?.case) {
          <section class="case-snippet" aria-label="Case details">
            <div class="case-info">
              <div class="case-header">
                <span aria-hidden="true">⚖️</span>
                <strong>{{ confirmationData()!.case!.case_number }}</strong>
              </div>
              <div class="case-meta">
                <span class="violation-badge">
                  <span aria-hidden="true">🚗</span> {{ confirmationData()!.case!.violation_type }}
                </span>
                @if (confirmationData()!.case!.violation_location) {
                  <span class="case-location">{{ confirmationData()!.case!.violation_location }}</span>
                }
              </div>
            </div>
            @if (confirmationData()!.attorney) {
              <div class="attorney-card">
                <div class="attorney-avatar">{{ confirmationData()!.attorney!.initials }}</div>
                <div class="attorney-info">
                  <span class="attorney-name">{{ confirmationData()!.attorney!.name }}</span>
                  <span class="attorney-role">Attorney</span>
                </div>
              </div>
            }
          </section>
        }

        <!-- Email notice -->
        @if (displayEmail()) {
          <div class="email-notice" role="note">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <span>A confirmation receipt has been sent to <strong>{{ displayEmail() }}</strong></span>
          </div>
        }

        <!-- What Happens Next -->
        <section class="next-steps" aria-label="What happens next">
          <h2>What Happens Next</h2>
          <div class="steps-grid">
            <div class="step-card">
              <span class="step-icon" aria-hidden="true">⚖️</span>
              <strong>Attorney notified</strong>
              <p>Begins your defense strategy immediately</p>
            </div>
            <div class="step-card">
              <span class="step-icon" aria-hidden="true">📋</span>
              <strong>Filings prepared</strong>
              <p>Motion to dismiss filed before your court date</p>
            </div>
            <div class="step-card">
              <span class="step-icon" aria-hidden="true">📱</span>
              <strong>Real-time updates</strong>
              <p>Track every step in your case dashboard 24/7</p>
            </div>
          </div>
        </section>

        <!-- CTAs -->
        <div class="actions">
          <button type="button" class="btn-primary" (click)="viewCase()">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            View My Case
          </button>
          @if (confirmationData()?.payment_id) {
            <button type="button" class="btn-secondary" (click)="downloadReceipt()" aria-label="Download payment receipt">
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Receipt
            </button>
          }
          <button type="button" class="btn-ghost" (click)="goToDashboard()">
            Back to Dashboard
          </button>
        </div>

        <!-- Secure footer -->
        <div class="secure-footer" aria-label="Security information">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>Secured by Stripe · AES-256 encrypted · PCI DSS compliant</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .success-container {
      display: flex; justify-content: center; align-items: flex-start;
      min-height: 70vh; padding: 32px 16px;
    }

    .success-card {
      max-width: 560px; width: 100%;
      background: #fff; border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .top-bar {
      height: 4px;
      background: linear-gradient(90deg, #4caf50, #00897b);
    }

    /* --- Header section --- */
    .header-section {
      background: linear-gradient(180deg, #e8f5e9 0%, #fff 100%);
      padding: 32px 24px 24px;
      display: flex; flex-direction: column; align-items: center; text-align: center;
    }

    .success-icon { margin-bottom: 16px; }

    .icon-ring {
      width: 80px; height: 80px; border-radius: 50%;
      background: linear-gradient(135deg, rgba(76,175,80,0.2), rgba(0,137,123,0.2));
      display: flex; align-items: center; justify-content: center;
      animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1);
    }

    .icon-circle {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #4caf50, #00897b);
      display: flex; align-items: center; justify-content: center;
    }

    @keyframes pop-in {
      0% { transform: scale(0); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes pulse-ring {
      0% { box-shadow: 0 0 0 0 rgba(76,175,80,0.3); }
      70% { box-shadow: 0 0 0 12px rgba(76,175,80,0); }
      100% { box-shadow: 0 0 0 0 rgba(76,175,80,0); }
    }

    .icon-ring { animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1), pulse-ring 2s infinite 0.5s; }

    h1 { margin: 0; font-size: 1.7rem; color: #1a1a1a; font-weight: 400; }
    h1 strong { font-weight: 700; }
    .subtitle { color: #555; margin: 8px 0 0; font-size: 0.95rem; line-height: 1.5; }

    .loading-section { text-align: center; padding: 24px; color: #888; }

    /* --- Receipt block --- */
    .receipt-block {
      margin: 0 24px; padding: 20px;
      border: 1px solid #e8e8e8; border-radius: 12px;
      background: #fafafa;
    }

    .receipt-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px; padding-bottom: 12px;
      border-bottom: 1px dashed #ddd;
    }

    .receipt-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.75rem; font-weight: 600; color: #666;
      letter-spacing: 0.05em; text-transform: uppercase;
    }

    .confirmed-badge {
      font-size: 0.7rem; font-weight: 600; color: #2e7d32;
      background: #e8f5e9; padding: 3px 10px; border-radius: 20px;
    }

    .receipt-rows { display: flex; flex-direction: column; gap: 14px; }

    .receipt-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.9rem;
    }

    .receipt-label {
      display: flex; align-items: center; gap: 6px; color: #666;
    }

    .receipt-value { color: #1a1a1a; font-weight: 500; }

    .amount-value { color: #2e7d32; font-size: 1.25rem; font-weight: 700; }

    .txn-row { display: flex; align-items: center; gap: 8px; }
    .txn-row code {
      font-family: 'SF Mono', 'Fira Code', monospace;
      font-size: 0.75rem; background: #e8e8e8;
      padding: 2px 8px; border-radius: 4px;
      word-break: break-all;
    }

    .copy-btn {
      display: inline-flex; align-items: center; gap: 4px;
      border: none; background: none; cursor: pointer;
      color: #1976d2; font-size: 0.75rem; font-weight: 500;
      padding: 4px 8px; border-radius: 4px;
      min-height: 32px;
    }
    .copy-btn:hover { background: #e3f2fd; }
    .copy-btn:focus-visible { outline: 2px solid #1976d2; outline-offset: 2px; }

    .card-row { display: flex; align-items: center; gap: 8px; }
    .card-badge {
      font-size: 0.65rem; font-weight: 700; color: #1a237e;
      background: #e8eaf6; padding: 2px 8px; border-radius: 4px;
      letter-spacing: 0.04em;
    }

    /* --- Case snippet --- */
    .case-snippet {
      margin: 20px 24px 0; padding: 16px;
      background: #f5f5f5; border-radius: 12px;
      display: flex; justify-content: space-between; align-items: center;
      gap: 12px; flex-wrap: wrap;
    }

    .case-header {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.95rem;
    }

    .case-meta {
      display: flex; align-items: center; gap: 8px;
      margin-top: 6px; flex-wrap: wrap;
    }

    .violation-badge {
      font-size: 0.75rem; font-weight: 500;
      background: #fff3e0; color: #e65100;
      padding: 2px 10px; border-radius: 20px;
    }

    .case-location { font-size: 0.8rem; color: #888; }

    .attorney-card {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; background: #fff;
      border-radius: 8px; border: 1px solid #e0e0e0;
    }

    .attorney-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #4caf50, #00897b);
      color: #fff; font-weight: 700; font-size: 0.8rem;
      display: flex; align-items: center; justify-content: center;
    }

    .attorney-name { font-weight: 600; font-size: 0.85rem; color: #1a1a1a; }
    .attorney-role { font-size: 0.7rem; color: #888; display: block; }

    /* --- Email notice --- */
    .email-notice {
      display: flex; align-items: center; gap: 8px;
      margin: 20px 24px 0; padding: 12px 16px;
      background: #e3f2fd; border-radius: 8px;
      font-size: 0.85rem; color: #1565c0;
    }

    /* --- What Happens Next --- */
    .next-steps { padding: 24px 24px 0; }
    .next-steps h2 { font-size: 1rem; font-weight: 600; color: #1a1a1a; margin: 0 0 16px; }

    .steps-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .step-card {
      background: #f5f5f5; border-radius: 10px;
      padding: 16px 12px; text-align: center;
    }

    .step-icon { font-size: 1.5rem; display: block; margin-bottom: 8px; }
    .step-card strong { font-size: 0.8rem; color: #1a1a1a; display: block; margin-bottom: 4px; }
    .step-card p { font-size: 0.72rem; color: #666; margin: 0; line-height: 1.4; }

    /* --- CTAs --- */
    .actions {
      display: flex; flex-direction: column; gap: 10px;
      padding: 24px;
    }

    .btn-primary, .btn-secondary, .btn-ghost {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; border: none; border-radius: 10px;
      font-size: 0.95rem; font-weight: 600; cursor: pointer;
      min-height: 48px; padding: 12px 24px;
      transition: opacity 0.2s;
    }
    .btn-primary:hover, .btn-secondary:hover, .btn-ghost:hover { opacity: 0.85; }
    .btn-primary:focus-visible, .btn-secondary:focus-visible, .btn-ghost:focus-visible {
      outline: 2px solid #1976d2; outline-offset: 2px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #00897b, #00695c);
      color: #fff;
    }

    .btn-secondary {
      background: #fff; color: #1a1a1a;
      border: 1.5px solid #ddd;
    }

    .btn-ghost {
      background: transparent; color: #666;
    }

    /* --- Secure footer --- */
    .secure-footer {
      display: flex; align-items: center; justify-content: center; gap: 6px;
      padding: 16px 24px 20px; font-size: 0.72rem; color: #999;
    }

    /* --- Responsive --- */
    @media (max-width: 480px) {
      .steps-grid { grid-template-columns: 1fr; }
      .receipt-row { flex-direction: column; align-items: flex-start; gap: 4px; }
      .case-snippet { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  caseId = signal('');
  confirmationData = signal<ConfirmationData | null>(null);
  loading = signal(false);
  copyFeedback = signal('Copy');
  fallbackMode = signal(false);

  // Fallback values from router state
  private fallbackAmount = signal(0);
  private fallbackTransactionId = signal('');

  displayAmount = computed(() => this.confirmationData()?.amount ?? this.fallbackAmount());
  displayTransactionId = computed(() => this.confirmationData()?.transaction_id ?? this.fallbackTransactionId());
  displayDate = computed(() => this.confirmationData()?.paid_at ?? null);
  displayCardBrand = computed(() => this.confirmationData()?.card_brand ?? null);
  displayCardLast4 = computed(() => this.confirmationData()?.card_last4 ?? null);
  displayEmail = computed(() => this.confirmationData()?.driver_email ?? null);

  ngOnInit(): void {
    this.caseId.set(this.route.snapshot.params['caseId']);

    const state = history.state as Record<string, unknown>;
    const paymentIntentId = state?.['paymentIntentId'] as string | undefined;
    const amount = state?.['amount'];

    if (!paymentIntentId && !amount) {
      this.router.navigate(['/driver/cases', this.caseId()]);
      return;
    }

    // Store fallback values from router state
    this.fallbackAmount.set(Number(amount) || 0);
    this.fallbackTransactionId.set(String(state?.['transactionId'] || ''));

    if (paymentIntentId) {
      this.loading.set(true);
      this.http.get<{ success: boolean; data: ConfirmationData }>(
        `${this.apiUrl}/payments/confirmation/${paymentIntentId}`
      ).subscribe({
        next: (res) => {
          this.confirmationData.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.fallbackMode.set(true);
          this.loading.set(false);
        }
      });
    } else {
      this.fallbackMode.set(true);
    }
  }

  viewCase(): void {
    this.router.navigate(['/driver/cases', this.caseId()]);
  }

  goToDashboard(): void {
    this.router.navigate(['/driver/dashboard']);
  }

  copyTransactionId(): void {
    const txnId = this.displayTransactionId();
    if (!txnId) return;
    navigator.clipboard.writeText(txnId).then(() => {
      this.copyFeedback.set('Copied!');
      setTimeout(() => this.copyFeedback.set('Copy'), 2000);
    });
  }

  downloadReceipt(): void {
    const paymentId = this.confirmationData()?.payment_id;
    if (!paymentId) return;
    this.http.get(`${this.apiUrl}/payments/${paymentId}/receipt`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${paymentId}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
    });
  }
}

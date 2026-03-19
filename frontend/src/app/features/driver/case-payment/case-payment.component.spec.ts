import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CasePaymentComponent } from './case-payment.component';

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn().mockResolvedValue(null),
}));

import { environment } from '../../../../environments/environment';

const CASE_ID = 'case-42';
const API = environment.apiUrl;

const MOCK_CASE = {
  case_number: 'CDL-001',
  attorney: {
    full_name: 'Jane Smith',
    win_rate: 92,
    years_experience: 8,
    cases_won: 145,
  },
  attorney_price: 350,
  violation_type: 'Speeding',
  court_date: '2026-04-15',
  court_location: 'Houston Municipal Court',
};

const MOCK_INTENT = { clientSecret: 'cs_secret_123', paymentIntentId: 'pi_123' };

// Matches what backend's getPaymentPlanOptions returns
const MOCK_PLAN_OPTIONS = {
  data: {
    caseId: CASE_ID,
    totalAmount: 350,
    payNow: { label: 'Pay Now', amount: 350, weeks: 0, installments: 1 },
    twoWeek: { label: '2 weeks', weeklyAmount: 175.00, weeks: 2, installments: 2 },
    fourWeek: { label: '4 weeks', weeklyAmount: 87.50, weeks: 4, installments: 4, popular: true },
    eightWeek: { label: '8 weeks', weeklyAmount: 43.75, weeks: 8, installments: 8 },
  }
};

describe('CasePaymentComponent', () => {
  let fixture: ComponentFixture<CasePaymentComponent>;
  let component: CasePaymentComponent;
  let controller: HttpTestingController;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let snackBarSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CasePaymentComponent, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { caseId: CASE_ID } } } },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    controller = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CasePaymentComponent);
    component = fixture.componentInstance;

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as never);
  });

  afterEach(() => {
    controller.verify();
    TestBed.resetTestingModule();
  });

  /**
   * Trigger ngOnInit + ngAfterViewInit, then flush all initialisation requests:
   *   1. GET  /api/cases/:id                  (case load)
   *   2. GET  /api/payments/config            (Stripe publishable key)
   *   3. GET  /api/payments/plan-options/:id  (payment plan options)
   *   4. POST /api/cases/:id/payments         (payment intent creation)
   */
  function flushInit(caseData = MOCK_CASE) {
    fixture.detectChanges(); // triggers ngOnInit + ngAfterViewInit

    controller.expectOne(`${API}/cases/${CASE_ID}`).flush({ case: caseData });
    controller.expectOne(`${API}/payments/config`).flush({ publishableKey: 'pk_test_xxx' });

    fixture.detectChanges(); // case loaded → loadPlanOptions() + createPaymentIntent() queued

    controller.expectOne(`${API}/payments/plan-options/${CASE_ID}`).flush(MOCK_PLAN_OPTIONS);
    controller.expectOne(`${API}/cases/${CASE_ID}/payments`).flush(MOCK_INTENT);
    fixture.detectChanges();
  }

  // ── Initialisation ─────────────────────────────────────────────────────────

  it('sets loadingCase to false after case data loads', () => {
    flushInit();
    expect(component.loadingCase()).toBe(false);
  });

  it('stores clientSecret from payment intent response', () => {
    flushInit();
    expect((component as never as { clientSecret: string }).clientSecret).toBe('cs_secret_123');
  });

  it('populates case signals from API response', () => {
    flushInit();
    expect(component.caseNumber()).toBe('CDL-001');
    expect(component.violationType()).toBe('Speeding');
    expect(component.amount()).toBe(350);
    expect(component.courtDate()).toBe('2026-04-15');
    expect(component.courtLocation()).toBe('Houston Municipal Court');
  });

  it('populates attorney signal with stats from case response', () => {
    flushInit();
    const att = component.attorney();
    expect(att).not.toBeNull();
    expect(att!.name).toBe('Jane Smith');
    expect(att!.win_rate).toBe(92);
    expect(att!.years_experience).toBe(8);
    expect(att!.cases_won).toBe(145);
  });

  it('attorney() is null when case has no assigned attorney', () => {
    const caseNoAttorney = { ...MOCK_CASE, attorney: null };
    flushInit(caseNoAttorney as never);
    expect(component.attorney()).toBeNull();
  });

  it('shows case number and attorney name in template', () => {
    flushInit();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CDL-001');
    expect(text).toContain('Jane Smith');
  });

  it('shows attorney stats in template', () => {
    flushInit();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('92%');  // win rate
    expect(text).toContain('8+');   // years exp
    expect(text).toContain('145');  // cases won
  });

  it('goBack() navigates to /driver/cases/:caseId', () => {
    flushInit();
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/cases', CASE_ID]);
  });

  it('shows error snackbar when case load fails', () => {
    fixture.detectChanges();

    controller
      .expectOne(`${API}/cases/${CASE_ID}`)
      .flush('Not Found', { status: 404, statusText: 'Not Found' });
    controller.expectOne(`${API}/payments/config`).flush({ publishableKey: 'pk_test_xxx' });

    fixture.detectChanges();

    expect(component.loadingCase()).toBe(false);
    expect(snackBarSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to load'),
      expect.anything(),
      expect.any(Object),
    );
  });

  // ── Stripe (mocked as null) ────────────────────────────────────────────────

  it('stripeReady stays false when loadStripe returns null', () => {
    flushInit();
    expect(component.stripeReady()).toBe(false);
  });

  it('pay() is a no-op when stripe not ready', async () => {
    flushInit();
    await component.pay();
    expect(component.paying()).toBe(false);
  });

  // ── Payment plan selection ─────────────────────────────────────────────────

  it('defaults selectedPlan to "4" (4-week, most popular)', () => {
    expect(component.selectedPlan()).toBe('4');
  });

  it('selectPlan() changes the selected plan', () => {
    flushInit();
    component.selectPlan('full');
    expect(component.selectedPlan()).toBe('full');

    component.selectPlan('8');
    expect(component.selectedPlan()).toBe('8');
  });

  it('loadingPlans becomes false after plan options load', () => {
    flushInit();
    expect(component.loadingPlans()).toBe(false);
  });

  it('planOptions contains 3 entries: full, 4-week, 8-week', () => {
    flushInit();
    const opts = component.planOptions();
    expect(opts).toHaveLength(3);
    expect(opts[0].key).toBe('full');
    expect(opts[1].key).toBe('4');
    expect(opts[2].key).toBe('8');
  });

  it('4-week plan is marked popular', () => {
    flushInit();
    const fourWeek = component.planOptions().find(o => o.key === '4');
    expect(fourWeek?.popular).toBe(true);
  });

  // ── Computed: processingFee + totalAmount ──────────────────────────────────

  it('processingFee is calculated as 2.9% + $0.30', () => {
    flushInit();
    const expected = Math.round((350 * 0.029 + 0.30) * 100) / 100;
    expect(component.processingFee()).toBeCloseTo(expected, 2);
  });

  it('totalAmount equals amount + processingFee', () => {
    flushInit();
    expect(component.totalAmount()).toBeCloseTo(component.amount() + component.processingFee(), 2);
  });

  // ── payButtonLabel ─────────────────────────────────────────────────────────

  it('payButtonLabel() starts with "Pay $" for full plan', () => {
    flushInit();
    component.selectPlan('full');
    const label = component.payButtonLabel();
    expect(label).toMatch(/^Pay \$[\d,]+\.\d{2}$/);
  });

  it('payButtonLabel() contains "now" for installment plans', () => {
    flushInit();
    component.selectPlan('4');
    expect(component.payButtonLabel()).toContain('now');
  });

  it('firstInstallment() returns the weekly amount for selected plan', () => {
    flushInit();
    component.selectPlan('4');
    expect(component.firstInstallment()).toBeCloseTo(87.50, 2);

    component.selectPlan('8');
    expect(component.firstInstallment()).toBeCloseTo(43.75, 2);
  });

  it('firstInstallment() returns 0 for full plan', () => {
    flushInit();
    component.selectPlan('full');
    expect(component.firstInstallment()).toBe(0);
  });

  // ── Split Stripe Elements error signals ────────────────────────────────────

  it('cardNumberError, cardExpiryError, cardCvcError all start empty', () => {
    expect(component.cardNumberError()).toBe('');
    expect(component.cardExpiryError()).toBe('');
    expect(component.cardCvcError()).toBe('');
  });

  it('cardNumberError can be set independently without affecting other error signals', () => {
    component.cardNumberError.set('Your card number is incomplete.');
    expect(component.cardNumberError()).toBe('Your card number is incomplete.');
    expect(component.cardExpiryError()).toBe('');
    expect(component.cardCvcError()).toBe('');
  });

  it('cardExpiryError can be set independently', () => {
    component.cardExpiryError.set("Your card's expiration date is incomplete.");
    expect(component.cardExpiryError()).toBe("Your card's expiration date is incomplete.");
    expect(component.cardNumberError()).toBe('');
    expect(component.cardCvcError()).toBe('');
  });
});

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
  attorney: { full_name: 'Jane Smith' },
  attorney_price: 350,
  violation_type: 'Speeding',
};

const MOCK_INTENT = { clientSecret: 'cs_secret_123', paymentIntentId: 'pi_123' };

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
    snackBarSpy = vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  });

  afterEach(() => {
    controller.verify();
    TestBed.resetTestingModule();
  });

  const MOCK_PLAN_OPTIONS = {
    data: {
      twoWeek:   { label: '2-week', weeks: 2, installments: 2, weeklyAmount: 87.50 },
      fourWeek:  { label: '4-week', weeks: 4, installments: 4, weeklyAmount: 43.75, popular: true },
      eightWeek: { label: '8-week', weeks: 8, installments: 8, weeklyAmount: 21.88 },
    }
  };

  /**
   * Trigger ngOnInit + ngAfterViewInit, then flush all four requests that
   * a successful initialisation produces:
   *   1. GET  /api/cases/:id                     (case load)
   *   2. GET  /api/payments/config               (Stripe publishable key)
   *   3. GET  /api/payments/plan-options/:id     (payment plan options)
   *   4. POST /api/cases/:id/payments            (payment intent creation)
   */
  function flushInit(caseData = MOCK_CASE) {
    fixture.detectChanges(); // triggers ngOnInit + ngAfterViewInit

    // Both GETs are in the queue at this point
    controller.expectOne(`${API}/cases/${CASE_ID}`).flush({ case: caseData });
    controller.expectOne(`${API}/payments/config`).flush({ publishableKey: 'pk_test_xxx' });

    fixture.detectChanges(); // processes case response → loadPlanOptions() + createPaymentIntent() queued

    controller.expectOne(`${API}/payments/plan-options/${CASE_ID}`).flush(MOCK_PLAN_OPTIONS);
    controller.expectOne(`${API}/cases/${CASE_ID}/payments`).flush(MOCK_INTENT);
    fixture.detectChanges();
  }

  it('loads case details on init (loadingCase → false)', () => {
    flushInit();
    expect(component.loadingCase()).toBe(false);
  });

  it('creates payment intent after case loads', () => {
    flushInit();
    // clientSecret is private — access via bracket notation for the test
    expect((component as any).clientSecret).toBe('cs_secret_123');
  });

  it('shows case number, attorney name, and amount in template', () => {
    flushInit();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CDL-001');
    expect(text).toContain('Jane Smith');
    expect(text).toContain('$350.00');
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

  it('pay() is a no-op when stripe not ready', async () => {
    flushInit();
    // loadStripe is mocked to return null → stripeReady stays false
    expect(component.stripeReady()).toBe(false);
    await component.pay();
    expect(component.paying()).toBe(false);
  });

  // ── Payment plan tests (PP-2) ───────────────────────────────────────────────

  it('defaults selectedPlan to "4" (4-week most popular)', () => {
    fixture.detectChanges();
    controller.expectOne(`${API}/cases/${CASE_ID}`).flush({ case: MOCK_CASE });
    controller.expectOne(`${API}/payments/config`).flush({ publishableKey: 'pk_test_xxx' });
    fixture.detectChanges();
    controller.expectOne(`${API}/payments/plan-options/${CASE_ID}`).flush(MOCK_PLAN_OPTIONS);
    controller.expectOne(`${API}/cases/${CASE_ID}/payments`).flush(MOCK_INTENT);
    fixture.detectChanges();

    expect(component.selectedPlan()).toBe('4');
  });

  it('selectPlan() changes selected plan', () => {
    flushInit();
    component.selectPlan('full');
    expect(component.selectedPlan()).toBe('full');

    component.selectPlan('2');
    expect(component.selectedPlan()).toBe('2');
  });

  it('payButtonLabel() returns "Pay $350.00" when full plan selected', () => {
    flushInit();
    component.selectPlan('full');
    expect(component.payButtonLabel()).toContain('$350.00');
  });

  it('payButtonLabel() returns weekly amount for installment plan', () => {
    flushInit();
    component.selectPlan('4');
    const label = component.payButtonLabel();
    expect(label).toContain('/week');
  });

  it('loadingPlans becomes false after plan options load', () => {
    flushInit();
    expect(component.loadingPlans()).toBe(false);
  });

  it('planOptions signal is populated from API response', () => {
    flushInit();
    expect(component.planOptions().length).toBe(3);
    expect(component.planOptions()[0].weeks).toBe(2);
    expect(component.planOptions()[1].weeks).toBe(4);
    expect(component.planOptions()[2].weeks).toBe(8);
  });
});

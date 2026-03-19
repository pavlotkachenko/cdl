import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentSuccessComponent } from './payment-success.component';
import { environment } from '../../../../environments/environment';

const CASE_ID = 'case-42';
const API = environment.apiUrl;

const MOCK_CONFIRMATION = {
  payment_id: 'pay-1',
  amount: 450,
  currency: 'USD',
  status: 'succeeded',
  transaction_id: 'ch_abc123',
  stripe_payment_intent_id: 'pi_xyz',
  paid_at: '2026-03-18T15:42:00.000Z',
  card_brand: 'visa',
  card_last4: '4242',
  case: {
    id: 'case-42',
    case_number: 'CASE-2026-000847',
    violation_type: 'speeding',
    violation_location: 'I-35 North, Texas',
  },
  attorney: { name: 'Sarah Johnson', initials: 'SJ' },
  driver_email: 'driver@test.com',
};

function pushState(state: Record<string, unknown> | null): void {
  window.history.pushState(state ?? {}, '', '');
}

async function setup(state: Record<string, unknown> | null) {
  pushState(state);

  const routerSpy = { navigate: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [PaymentSuccessComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: Router, useValue: routerSpy },
      { provide: ActivatedRoute, useValue: { snapshot: { params: { caseId: CASE_ID } } } },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<PaymentSuccessComponent> =
    TestBed.createComponent(PaymentSuccessComponent);
  const httpMock = TestBed.inject(HttpTestingController);

  return { fixture, component: fixture.componentInstance, routerSpy, httpMock };
}

describe('PaymentSuccessComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders "Payment Received!" heading with 🎉 emoji', async () => {
    const { fixture, httpMock } = await setup({ amount: 250, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();

    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });
    fixture.detectChanges();

    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Payment');
    expect(h1.textContent).toContain('Received!');
    expect(h1.textContent).toContain('🎉');
  });

  it('displays full receipt block when confirmation API succeeds', async () => {
    const { fixture, httpMock } = await setup({ amount: 450, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();

    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('$450.00');
    expect(text).toContain('ch_abc123');
    expect(text).toContain('VISA');
    expect(text).toContain('4242');
    expect(text).toContain('PAYMENT RECEIPT');
    expect(text).toContain('Confirmed');
  });

  it('shows case number, violation type, attorney name from API data', async () => {
    const { fixture, httpMock } = await setup({ amount: 450, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();

    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('CASE-2026-000847');
    expect(text).toContain('speeding');
    expect(text).toContain('I-35 North, Texas');
    expect(text).toContain('Sarah Johnson');
    expect(text).toContain('SJ');
  });

  it('copy button copies transaction ID and shows "Copied!" feedback', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: writeTextSpy } });

    const { fixture, httpMock } = await setup({ amount: 450, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();

    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });
    fixture.detectChanges();

    const copyBtn = fixture.nativeElement.querySelector('.copy-btn') as HTMLButtonElement;
    expect(copyBtn).toBeTruthy();

    copyBtn.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(writeTextSpy).toHaveBeenCalledWith('ch_abc123');
    expect(copyBtn.textContent).toContain('Copied!');
  });

  it('"View My Case" navigates to correct route', async () => {
    const { fixture, component, routerSpy, httpMock } = await setup({ amount: 250, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();
    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });

    component.viewCase();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/cases', CASE_ID]);
  });

  it('"Download Receipt" calls receipt download endpoint', async () => {
    const { fixture, httpMock } = await setup({ amount: 450, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();

    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });
    fixture.detectChanges();

    const downloadBtn = fixture.nativeElement.querySelector('.btn-secondary') as HTMLButtonElement;
    expect(downloadBtn).toBeTruthy();
    expect(downloadBtn.textContent).toContain('Download Receipt');

    downloadBtn.click();
    fixture.detectChanges();

    const receiptReq = httpMock.expectOne(`${API}/payments/pay-1/receipt`);
    expect(receiptReq.request.responseType).toBe('blob');
    receiptReq.flush(new Blob(['pdf'], { type: 'application/pdf' }));
  });

  it('"Back to Dashboard" navigates to /driver/dashboard', async () => {
    const { fixture, component, routerSpy, httpMock } = await setup({ amount: 250, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();
    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });

    component.goToDashboard();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
  });

  it('falls back to minimal view when confirmation API returns error', async () => {
    const { fixture, httpMock } = await setup({ amount: 300, transactionId: 'txn_fallback', paymentIntentId: 'pi_bad' });
    fixture.detectChanges();

    httpMock.expectOne(`${API}/payments/confirmation/pi_bad`).flush(
      { success: false, message: 'Not found' },
      { status: 404, statusText: 'Not Found' }
    );
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('$300.00');
    expect(text).toContain('txn_fallback');
    // No case snippet or attorney card in fallback
    expect(fixture.nativeElement.querySelector('.case-snippet')).toBeNull();
  });

  it('redirects to case detail when accessed directly without payment state', async () => {
    const { fixture, routerSpy } = await setup(null);
    fixture.detectChanges();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/cases', CASE_ID]);
  });

  it('shows loading state while API call is in progress', async () => {
    const { fixture } = await setup({ amount: 250, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Loading payment details');
  });

  it('displays "What Happens Next" grid with three step cards', async () => {
    const { fixture, httpMock } = await setup({ amount: 250, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();
    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });
    fixture.detectChanges();

    const stepCards = fixture.nativeElement.querySelectorAll('.step-card');
    expect(stepCards.length).toBe(3);

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Attorney notified');
    expect(text).toContain('Filings prepared');
    expect(text).toContain('Real-time updates');
  });

  it('displays email notice with driver email from API', async () => {
    const { fixture, httpMock } = await setup({ amount: 450, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();
    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });
    fixture.detectChanges();

    const emailNotice = fixture.nativeElement.querySelector('.email-notice');
    expect(emailNotice).toBeTruthy();
    expect(emailNotice.textContent).toContain('driver@test.com');
  });

  it('displays "Secured by Stripe" footer', async () => {
    const { fixture, httpMock } = await setup({ amount: 250, paymentIntentId: 'pi_xyz' });
    fixture.detectChanges();
    httpMock.expectOne(`${API}/payments/confirmation/pi_xyz`).flush({ success: true, data: MOCK_CONFIRMATION });
    fixture.detectChanges();

    const footer = fixture.nativeElement.querySelector('.secure-footer');
    expect(footer.textContent).toContain('Secured by Stripe');
    expect(footer.textContent).toContain('AES-256 encrypted');
  });

  it('works with amount-only state (no paymentIntentId) — fallback mode', async () => {
    const { fixture } = await setup({ amount: 200, transactionId: 'txn_simple' });
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('$200.00');
    expect(text).toContain('txn_simple');
    expect(text).toContain('Payment');
    expect(text).toContain('Received!');
  });
});

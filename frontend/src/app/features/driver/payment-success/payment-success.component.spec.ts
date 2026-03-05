import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PaymentSuccessComponent } from './payment-success.component';

const CASE_ID = 'case-42';

async function setup(state: Record<string, unknown> | null) {
  window.history.pushState(state ?? {}, '', '');

  const routerSpy = { navigate: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [PaymentSuccessComponent, NoopAnimationsModule],
    providers: [
      { provide: Router, useValue: routerSpy },
      { provide: ActivatedRoute, useValue: { snapshot: { params: { caseId: CASE_ID } } } },
    ],
  }).compileComponents();

  const fixture: ComponentFixture<PaymentSuccessComponent> =
    TestBed.createComponent(PaymentSuccessComponent);
  fixture.detectChanges();

  return { fixture, component: fixture.componentInstance, routerSpy };
}

describe('PaymentSuccessComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('renders "Payment Received!" heading', async () => {
    const { fixture } = await setup({ amount: 250, transactionId: 'txn_123' });
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent).toContain('Payment Received!');
  });

  it('displays amount and transactionId from router state', async () => {
    const { component, fixture } = await setup({ amount: 250, transactionId: 'txn_abc' });
    expect(component.amount()).toBe(250);
    expect(component.transactionId()).toBe('txn_abc');
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('txn_abc');
  });

  it('viewCase() navigates to /driver/cases/:caseId', async () => {
    const { component, routerSpy } = await setup({ amount: 250, transactionId: 'txn_abc' });
    component.viewCase();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/cases', CASE_ID]);
  });

  it('goToDashboard() navigates to /driver/dashboard', async () => {
    const { component, routerSpy } = await setup({ amount: 250, transactionId: 'txn_abc' });
    component.goToDashboard();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/dashboard']);
  });

  it('redirects to case detail when no payment state (direct URL access)', async () => {
    const { routerSpy } = await setup(null);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/driver/cases', CASE_ID]);
  });
});

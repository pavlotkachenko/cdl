import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { SubscriptionManagementComponent } from './subscription-management.component';
import {
  SubscriptionService, Subscription, SubscriptionPlan, BillingInvoice,
} from '../../../services/subscription.service';
import { MatSnackBar } from '@angular/material/snack-bar';

const MOCK_SUB: Subscription = {
  id: 's1', user_id: 'u1', plan_name: 'basic',
  status: 'active', current_period_start: '2026-01-01', current_period_end: '2026-02-01',
  cancel_at_period_end: false, created_at: '2026-01-01',
};

const MOCK_PLANS: SubscriptionPlan[] = [
  { id: 'basic', name: 'Basic', price_id: 'price_basic_monthly', price: 29, currency: 'usd', interval: 'month', features: ['5 active cases'] },
  { id: 'premium', name: 'Premium', price_id: 'price_premium_monthly', price: 79, currency: 'usd', interval: 'month', features: ['Unlimited cases'] },
];

const MOCK_INVOICES: BillingInvoice[] = [
  {
    id: 'inv_1', amount: 29, currency: 'usd', status: 'paid',
    date: '2026-01-15T00:00:00.000Z',
    pdf_url: 'https://stripe.com/invoice.pdf',
    hosted_url: 'https://invoice.stripe.com/hosted',
  },
];

function makeServiceSpy(
  sub: Subscription | null = MOCK_SUB,
  plans = MOCK_PLANS,
  invoices = MOCK_INVOICES,
) {
  return {
    getCurrentSubscription: vi.fn().mockReturnValue(
      sub === null ? throwError(() => ({ status: 404 })) : of(sub),
    ),
    getPlans: vi.fn().mockReturnValue(of(plans)),
    getInvoices: vi.fn().mockReturnValue(of(invoices)),
    cancelSubscription: vi.fn().mockReturnValue(of({ ...MOCK_SUB, cancel_at_period_end: true })),
    createCheckoutSession: vi.fn().mockReturnValue(of({ url: 'http://app/success', subscription: MOCK_SUB })),
    getBillingPortalUrl: vi.fn().mockReturnValue(of({ url: 'https://billing.stripe.com/portal/sess_abc' })),
  };
}

async function setup(spy = makeServiceSpy()) {
  await TestBed.configureTestingModule({
    imports: [SubscriptionManagementComponent, NoopAnimationsModule],
    providers: [{ provide: SubscriptionService, useValue: spy }],
  }).compileComponents();

  const fixture = TestBed.createComponent(SubscriptionManagementComponent);
  fixture.detectChanges();
  const snackBar = fixture.debugElement.injector.get(MatSnackBar);
  vi.spyOn(snackBar, 'open').mockReturnValue(null as any);
  return { fixture, component: fixture.componentInstance, spy, snackBar };
}

describe('SubscriptionManagementComponent', () => {
  it('displays current plan name after load', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Basic');
  });

  it('shows "No active subscription" when API returns 404', async () => {
    const spy = makeServiceSpy(null);
    const { fixture } = await setup(spy);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No active subscription');
  });

  it('calls cancelSubscription after confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { component, spy } = await setup();
    component.cancelSubscription();
    expect(spy.cancelSubscription).toHaveBeenCalledWith('s1', false);
  });

  it('does not call cancelSubscription when confirm is dismissed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { component, spy } = await setup();
    component.cancelSubscription();
    expect(spy.cancelSubscription).not.toHaveBeenCalled();
  });

  it('selectPlan calls createCheckoutSession with plan price_id', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { component, spy } = await setup();
    component.selectPlan(MOCK_PLANS[1]); // Premium
    expect(spy.createCheckoutSession).toHaveBeenCalledWith('price_premium_monthly');
  });

  it('isCurrentPlan returns true for plan matching subscription plan_name', async () => {
    const { component } = await setup();
    expect(component.isCurrentPlan(MOCK_PLANS[0])).toBe(true);   // basic matches
    expect(component.isCurrentPlan(MOCK_PLANS[1])).toBe(false);  // premium does not
  });

  // ── SB-2: Manage Billing button ───────────────────────────────────────────

  it('openBillingPortal calls getBillingPortalUrl and opens returned URL', async () => {
    const { component, spy } = await setup();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    component.openBillingPortal();
    expect(spy.getBillingPortalUrl).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      'https://billing.stripe.com/portal/sess_abc',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows "Manage Billing" button when subscription is active', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Manage Billing');
  });

  it('shows snackbar error when getBillingPortalUrl fails', async () => {
    const spy = makeServiceSpy();
    spy.getBillingPortalUrl = vi.fn().mockReturnValue(throwError(() => new Error('fail')));
    const { component, snackBar } = await setup(spy);
    component.openBillingPortal();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed to open billing portal.', 'Close', { duration: 3000 },
    );
  });

  // ── SB-6: Invoice list ────────────────────────────────────────────────────

  it('displays invoice amount and status in billing history', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Billing History');
    expect(el.textContent).toContain('PAID');
  });

  it('renders PDF and View links for invoices', async () => {
    const { fixture } = await setup();
    const el: HTMLElement = fixture.nativeElement;
    const links = el.querySelectorAll('a[target="_blank"]');
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it('hides billing history section when invoices are empty', async () => {
    const spy = makeServiceSpy(MOCK_SUB, MOCK_PLANS, []);
    const { fixture } = await setup(spy);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).not.toContain('Billing History');
  });

  it('loads invoices via getInvoices on init', async () => {
    const { spy } = await setup();
    expect(spy.getInvoices).toHaveBeenCalled();
  });
});

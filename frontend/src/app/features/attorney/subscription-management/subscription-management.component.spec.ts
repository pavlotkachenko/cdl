import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { vi, describe, it, expect } from 'vitest';

import { SubscriptionManagementComponent } from './subscription-management.component';
import { SubscriptionService, Subscription, SubscriptionPlan } from '../../../services/subscription.service';
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

function makeServiceSpy(sub: Subscription | null = MOCK_SUB, plans = MOCK_PLANS) {
  return {
    getCurrentSubscription: vi.fn().mockReturnValue(
      sub === null ? throwError(() => ({ status: 404 })) : of(sub),
    ),
    getPlans: vi.fn().mockReturnValue(of(plans)),
    cancelSubscription: vi.fn().mockReturnValue(of({ ...MOCK_SUB, cancel_at_period_end: true })),
    createCheckoutSession: vi.fn().mockReturnValue(of({ url: 'http://app/success', subscription: MOCK_SUB })),
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
});

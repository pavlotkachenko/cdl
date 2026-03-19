import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SubscriptionManagementComponent } from './subscription-management.component';
import { SubscriptionService, Subscription } from '../../../services/subscription.service';

function mockSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub_123',
    user_id: 'user_1',
    plan_name: 'driver_plus',
    status: 'active',
    current_period_start: '2026-03-18T00:00:00Z',
    current_period_end: '2026-04-18T00:00:00Z',
    cancel_at_period_end: false,
    price_per_month: 15,
    created_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

describe('SubscriptionManagementComponent', () => {
  let fixture: ComponentFixture<SubscriptionManagementComponent>;
  let component: SubscriptionManagementComponent;
  let subService: SubscriptionService;

  const el = (sel: string) => fixture.debugElement.query(By.css(sel));
  const all = (sel: string) => fixture.debugElement.queryAll(By.css(sel));
  const text = (sel: string) => el(sel)?.nativeElement.textContent.trim() ?? '';

  function setup(sub: Subscription | null = mockSubscription()) {
    const getCurrentSub = sub
      ? of(sub)
      : throwError(() => ({ status: 404 }));

    TestBed.configureTestingModule({
      imports: [SubscriptionManagementComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    subService = TestBed.inject(SubscriptionService);
    vi.spyOn(subService, 'getCurrentSubscription').mockReturnValue(getCurrentSub as any);
    vi.spyOn(subService, 'getBillingPortalUrl').mockReturnValue(of({ url: 'https://billing.stripe.com/test' }));
    vi.spyOn(subService, 'cancelSubscription').mockReturnValue(of(mockSubscription({ status: 'canceled', cancel_at_period_end: true })) as any);
    vi.spyOn(subService, 'createCheckoutSession').mockReturnValue(of({ url: 'https://checkout.stripe.com/test' }));

    fixture = TestBed.createComponent(SubscriptionManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Page structure ──
  describe('Page structure', () => {
    it('should render loading spinner initially', () => {
      TestBed.configureTestingModule({
        imports: [SubscriptionManagementComponent],
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      subService = TestBed.inject(SubscriptionService);
      vi.spyOn(subService, 'getCurrentSubscription').mockReturnValue(of(mockSubscription()));
      fixture = TestBed.createComponent(SubscriptionManagementComponent);
      component = fixture.componentInstance;
      expect(component.loading()).toBe(true);
    });

    it('should render page header with title and subtitle', () => {
      setup();
      expect(text('h1')).toBe('Subscription');
      expect(text('.page-subtitle')).toBe('Manage your plan and billing preferences');
      expect(text('.page-label')).toContain('Billing & Plans');
    });

    it('should render current plan banner', () => {
      setup();
      expect(el('.current-plan-banner')).toBeTruthy();
    });

    it('should render billing toggle', () => {
      setup();
      expect(el('.billing-toggle-wrap')).toBeTruthy();
    });

    it('should render plans grid with 3 cards', () => {
      setup();
      expect(all('.plan-card').length).toBe(3);
    });

    it('should render trust row with 4 cards', () => {
      setup();
      expect(all('.trust-card').length).toBe(4);
    });

    it('should render FAQ section with 4 items', () => {
      setup();
      expect(all('.faq-item').length).toBe(4);
    });

    it('should render footer note', () => {
      setup();
      expect(text('.footer-note')).toContain('CDL Advisor');
    });
  });

  // ── Current plan banner ──
  describe('Current plan banner', () => {
    it('should display plan name', () => {
      setup();
      expect(text('.plan-name')).toBe('Driver Plus');
    });

    it('should show active badge', () => {
      setup();
      expect(text('.active-badge')).toContain('Active');
    });

    it('should show price', () => {
      setup();
      expect(text('.plan-price-big')).toContain('15');
    });

    it('should show renewal date', () => {
      setup();
      expect(text('.plan-renews')).toContain('2026');
    });

    it('should show Manage Billing button', () => {
      setup();
      const btn = el('.btn-secondary');
      expect(btn).toBeTruthy();
      expect(btn.nativeElement.textContent).toContain('Manage Billing');
    });

    it('should show Cancel Plan button for active subscription', () => {
      setup();
      const btn = el('.btn-danger-ghost');
      expect(btn).toBeTruthy();
      expect(btn.nativeElement.textContent).toContain('Cancel Plan');
    });

    it('should not show Cancel Plan button for canceled subscription', () => {
      setup(mockSubscription({ status: 'canceled' }));
      expect(el('.btn-danger-ghost')).toBeFalsy();
    });

    it('should show cancel notice when cancel_at_period_end is true', () => {
      setup(mockSubscription({ cancel_at_period_end: true }));
      expect(text('.cancel-notice')).toContain('cancel at the end');
    });

    it('should not show cancel notice when cancel_at_period_end is false', () => {
      setup();
      expect(el('.cancel-notice')).toBeFalsy();
    });

    it('should display usage stats', () => {
      setup();
      const items = all('.usage-item');
      expect(items.length).toBe(4);
      expect(items[0].nativeElement.textContent).toContain('Cases this month');
    });

    it('should show no-subscription message when no subscription', () => {
      setup(null);
      expect(text('.no-sub')).toBe('No active subscription.');
    });

    it('should call openBillingPortal when Manage Billing clicked', () => {
      setup();
      vi.spyOn(window, 'open').mockImplementation(() => null);
      el('.btn-secondary').nativeElement.click();
      fixture.detectChanges();
      expect(subService.getBillingPortalUrl).toHaveBeenCalled();
    });

    it('should call cancelSubscription when Cancel Plan clicked', () => {
      setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      el('.btn-danger-ghost').nativeElement.click();
      fixture.detectChanges();
      expect(subService.cancelSubscription).toHaveBeenCalledWith('sub_123', false);
    });
  });

  // ── Billing toggle ──
  describe('Billing toggle', () => {
    it('should default to monthly', () => {
      setup();
      expect(component.billingInterval()).toBe('monthly');
    });

    it('should switch to annual on click', () => {
      setup();
      el('.toggle-pill').nativeElement.click();
      fixture.detectChanges();
      expect(component.billingInterval()).toBe('annual');
    });

    it('should update plan prices when toggled to annual', () => {
      setup();
      el('.toggle-pill').nativeElement.click();
      fixture.detectChanges();
      expect(component.getDisplayPrice(component.planTiers[1])).toBe(12);
      expect(component.getDisplayPrice(component.planTiers[2])).toBe(32);
    });

    it('should activate save badge when annual', () => {
      setup();
      expect(el('.save-badge').nativeElement.classList.contains('active')).toBe(false);
      el('.toggle-pill').nativeElement.click();
      fixture.detectChanges();
      expect(el('.save-badge').nativeElement.classList.contains('active')).toBe(true);
    });

    it('should toggle on Enter key', () => {
      setup();
      el('.toggle-pill').nativeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      fixture.detectChanges();
      expect(component.billingInterval()).toBe('annual');
    });

    it('should toggle on Space key', () => {
      setup();
      el('.toggle-pill').nativeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
      );
      fixture.detectChanges();
      expect(component.billingInterval()).toBe('annual');
    });

    it('should toggle back to monthly on second click', () => {
      setup();
      el('.toggle-pill').nativeElement.click();
      el('.toggle-pill').nativeElement.click();
      fixture.detectChanges();
      expect(component.billingInterval()).toBe('monthly');
    });
  });

  // ── Plan cards ──
  describe('Plan cards', () => {
    it('should render Starter card with FREE price', () => {
      setup();
      const cards = all('.plan-card');
      const starterText = cards[0].nativeElement.textContent;
      expect(starterText).toContain('Free Forever');
      expect(starterText).toContain('FREE');
    });

    it('should render Starter with 3 features', () => {
      setup();
      const starterFeatures = all('.plan-card')[0].queryAll(By.css('.feature-item'));
      expect(starterFeatures.length).toBe(3);
    });

    it('should render Driver Plus card with $15 price', () => {
      setup();
      const cards = all('.plan-card');
      expect(cards[1].nativeElement.textContent).toContain('Driver Plus');
      expect(cards[1].nativeElement.textContent).toContain('15');
    });

    it('should render Driver Plus with 5 features', () => {
      setup();
      const plusFeatures = all('.plan-card')[1].queryAll(By.css('.feature-item'));
      expect(plusFeatures.length).toBe(5);
    });

    it('should render Driver Unlimited card with $40 price', () => {
      setup();
      const cards = all('.plan-card');
      expect(cards[2].nativeElement.textContent).toContain('Driver Unlimited');
      expect(cards[2].nativeElement.textContent).toContain('40');
    });

    it('should render Driver Unlimited with 8 features', () => {
      setup();
      const unlimFeatures = all('.plan-card')[2].queryAll(By.css('.feature-item'));
      expect(unlimFeatures.length).toBe(8);
    });

    it('should mark current plan card with current class', () => {
      setup();
      const cards = all('.plan-card');
      expect(cards[1].nativeElement.classList.contains('current')).toBe(true);
    });

    it('should show Your Current Plan badge on current plan', () => {
      setup();
      expect(text('.plan-popular-badge')).toContain('Your Current Plan');
    });

    it('should show disabled Current Plan button on current plan', () => {
      setup();
      const currentBtn = all('.plan-card')[1].query(By.css('.current-btn'));
      expect(currentBtn).toBeTruthy();
      expect(currentBtn.nativeElement.disabled).toBe(true);
    });

    it('should show actionable button on non-current plans', () => {
      setup();
      const starterBtn = all('.plan-card')[0].query(By.css('.free-btn'));
      expect(starterBtn).toBeTruthy();
      expect(starterBtn.nativeElement.textContent).toContain('Downgrade to Free');
    });

    it('should show Upgrade button on Unlimited plan', () => {
      setup();
      const unlimBtn = all('.plan-card')[2].query(By.css('.premium-btn'));
      expect(unlimBtn).toBeTruthy();
      expect(unlimBtn.nativeElement.textContent).toContain('Upgrade to Unlimited');
    });

    it('should call selectPlan when clicking non-current plan button', () => {
      setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const starterBtn = all('.plan-card')[0].query(By.css('.free-btn'));
      starterBtn.nativeElement.click();
      fixture.detectChanges();
      expect(subService.createCheckoutSession).toHaveBeenCalledWith('starter');
    });

    it('should update prices on annual toggle', () => {
      setup();
      el('.toggle-pill').nativeElement.click();
      fixture.detectChanges();
      const plusCard = all('.plan-card')[1];
      expect(plusCard.nativeElement.textContent).toContain('12');
      const unlimCard = all('.plan-card')[2];
      expect(unlimCard.nativeElement.textContent).toContain('32');
    });

    it('should show feature tooltips', () => {
      setup();
      const tooltips = all('.feature-tooltip');
      expect(tooltips.length).toBeGreaterThan(0);
      expect(tooltips[0].nativeElement.textContent.trim()).toBe('?');
    });
  });

  // ── Trust row ──
  describe('Trust row', () => {
    it('should render 4 trust cards', () => {
      setup();
      expect(all('.trust-card').length).toBe(4);
    });

    it('should display correct trust titles', () => {
      setup();
      const titles = all('.trust-title').map(e => e.nativeElement.textContent.trim());
      expect(titles).toEqual(['Cancel Anytime', 'No Hidden Fees', 'Instant Activation', 'Secure Billing']);
    });

    it('should display trust card descriptions', () => {
      setup();
      const subs = all('.trust-sub');
      expect(subs[0].nativeElement.textContent).toContain('No lock-in contracts');
      expect(subs[3].nativeElement.textContent).toContain('Stripe');
    });

    it('should display trust emojis with aria-hidden', () => {
      setup();
      const emojiSpans = all('.trust-icon span');
      emojiSpans.forEach(span => {
        expect(span.nativeElement.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });

  // ── FAQ accordion ──
  describe('FAQ accordion', () => {
    it('should render 4 FAQ items', () => {
      setup();
      expect(all('.faq-item').length).toBe(4);
    });

    it('should display FAQ header', () => {
      setup();
      expect(text('.faq-header')).toBe('Frequently Asked Questions');
    });

    it('should not show any answer by default', () => {
      setup();
      expect(all('.faq-a').length).toBe(0);
    });

    it('should expand answer when clicking question', () => {
      setup();
      all('.faq-item')[0].nativeElement.click();
      fixture.detectChanges();
      expect(all('.faq-a').length).toBe(1);
      expect(text('.faq-a')).toContain('upgrade or downgrade');
    });

    it('should collapse answer when clicking same question', () => {
      setup();
      all('.faq-item')[0].nativeElement.click();
      fixture.detectChanges();
      all('.faq-item')[0].nativeElement.click();
      fixture.detectChanges();
      expect(all('.faq-a').length).toBe(0);
    });

    it('should only show one answer at a time', () => {
      setup();
      all('.faq-item')[0].nativeElement.click();
      fixture.detectChanges();
      all('.faq-item')[1].nativeElement.click();
      fixture.detectChanges();
      expect(all('.faq-a').length).toBe(1);
      expect(text('.faq-a')).toContain('active cases remain open');
    });

    it('should rotate chevron when expanded', () => {
      setup();
      all('.faq-item')[0].nativeElement.click();
      fixture.detectChanges();
      const chevron = all('.faq-item')[0].query(By.css('.faq-chevron'));
      expect(chevron.nativeElement.classList.contains('expanded')).toBe(true);
    });

    it('should toggle on Enter key', () => {
      setup();
      all('.faq-item')[0].nativeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
      fixture.detectChanges();
      expect(component.expandedFaqIndex()).toBe(0);
    });

    it('should toggle on Space key', () => {
      setup();
      all('.faq-item')[2].nativeElement.dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
      );
      fixture.detectChanges();
      expect(component.expandedFaqIndex()).toBe(2);
    });

    it('should display correct FAQ questions', () => {
      setup();
      const questions = all('.faq-q').map(e => e.nativeElement.textContent.trim());
      expect(questions[0]).toContain('switch between plans');
      expect(questions[1]).toContain('cases if I cancel');
      expect(questions[2]).toContain('court fees');
      expect(questions[3]).toContain('PSP/MVR');
    });
  });

  // ── Accessibility ──
  describe('Accessibility', () => {
    it('should have role=switch on billing toggle', () => {
      setup();
      expect(el('.toggle-pill').nativeElement.getAttribute('role')).toBe('switch');
    });

    it('should have aria-checked on billing toggle', () => {
      setup();
      expect(el('.toggle-pill').nativeElement.getAttribute('aria-checked')).toBe('false');
      el('.toggle-pill').nativeElement.click();
      fixture.detectChanges();
      expect(el('.toggle-pill').nativeElement.getAttribute('aria-checked')).toBe('true');
    });

    it('should have role=button on FAQ items', () => {
      setup();
      all('.faq-item').forEach(item => {
        expect(item.nativeElement.getAttribute('role')).toBe('button');
      });
    });

    it('should have aria-expanded on FAQ items', () => {
      setup();
      const items = all('.faq-item');
      items.forEach(item => {
        expect(item.nativeElement.getAttribute('aria-expanded')).toBe('false');
      });
      items[0].nativeElement.click();
      fixture.detectChanges();
      expect(all('.faq-item')[0].nativeElement.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have aria-hidden on emoji spans', () => {
      setup();
      const emojiSpans = all('[aria-hidden="true"]');
      expect(emojiSpans.length).toBeGreaterThan(0);
    });

    it('should have accessible labels on plan buttons', () => {
      setup();
      const starterBtn = all('.plan-card')[0].query(By.css('.plan-btn'));
      expect(starterBtn.nativeElement.getAttribute('aria-label')).toContain('Free Forever');
    });

    it('should have tabindex on FAQ items', () => {
      setup();
      all('.faq-item').forEach(item => {
        expect(item.nativeElement.getAttribute('tabindex')).toBe('0');
      });
    });

    it('should have aria-label on billing toggle', () => {
      setup();
      expect(el('.toggle-pill').nativeElement.getAttribute('aria-label')).toBe('Toggle annual billing');
    });
  });

  // ── Computed signals ──
  describe('Computed signals', () => {
    it('should compute currentPlanName correctly', () => {
      setup();
      expect(component.currentPlanName()).toBe('Driver Plus');
    });

    it('should return No Plan when no subscription', () => {
      setup(null);
      expect(component.currentPlanName()).toBe('No Plan');
    });

    it('should return plan_name when no matching tier', () => {
      setup(mockSubscription({ plan_name: 'custom_plan' }));
      expect(component.currentPlanName()).toBe('custom_plan');
    });

    it('should compute monthly prices by default', () => {
      setup();
      expect(component.getDisplayPrice(component.planTiers[1])).toBe(15);
      expect(component.getDisplayPrice(component.planTiers[2])).toBe(40);
    });

    it('should compute annual prices at 20% discount', () => {
      setup();
      component.billingInterval.set('annual');
      expect(component.getDisplayPrice(component.planTiers[1])).toBe(12);
      expect(component.getDisplayPrice(component.planTiers[2])).toBe(32);
    });

    it('should return 0 for free tier regardless of interval', () => {
      setup();
      component.billingInterval.set('annual');
      expect(component.getDisplayPrice(component.planTiers[0])).toBe(0);
    });

    it('should identify current plan correctly', () => {
      setup();
      expect(component.isCurrentPlan(component.planTiers[0])).toBe(false);
      expect(component.isCurrentPlan(component.planTiers[1])).toBe(true);
      expect(component.isCurrentPlan(component.planTiers[2])).toBe(false);
    });
  });

  // ── Methods ──
  describe('Methods', () => {
    it('should toggle billing interval', () => {
      setup();
      component.toggleBilling();
      expect(component.billingInterval()).toBe('annual');
      component.toggleBilling();
      expect(component.billingInterval()).toBe('monthly');
    });

    it('should toggle FAQ index', () => {
      setup();
      component.toggleFaq(0);
      expect(component.expandedFaqIndex()).toBe(0);
      component.toggleFaq(0);
      expect(component.expandedFaqIndex()).toBeNull();
    });

    it('should switch FAQ when toggling different index', () => {
      setup();
      component.toggleFaq(0);
      component.toggleFaq(2);
      expect(component.expandedFaqIndex()).toBe(2);
    });

    it('should open billing portal URL', () => {
      setup();
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      component.openBillingPortal();
      expect(openSpy).toHaveBeenCalledWith('https://billing.stripe.com/test', '_blank', 'noopener,noreferrer');
    });

    it('should not select plan if confirm is rejected', () => {
      setup();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.selectPlan(component.planTiers[0]);
      expect(subService.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('should not select plan if it is current', () => {
      setup();
      component.selectPlan(component.planTiers[1]);
      expect(subService.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('should handle cancelSubscription error gracefully', () => {
      setup();
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.spyOn(subService, 'cancelSubscription').mockReturnValue(throwError(() => new Error('fail')) as any);
      component.cancelSubscription();
      expect(component.loading()).toBe(false);
    });
  });
});

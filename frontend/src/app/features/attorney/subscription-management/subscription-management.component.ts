import {
  Component, OnInit, signal, computed, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  SubscriptionService, Subscription, CheckoutResult,
} from '../../../services/subscription.service';

export interface PlanTier {
  id: string;
  tier: 'free' | 'plus' | 'unlim';
  tierLabel: string;
  name: string;
  monthlyPrice: number;
  tagline: string;
  description: string;
  features: PlanFeature[];
  ctaLabel: string;
  ctaStyle: 'free-btn' | 'current-btn' | 'primary-btn' | 'premium-btn';
}

export interface PlanFeature {
  text: string;
  bold?: boolean;
}

export interface TrustCard {
  emoji: string;
  title: string;
  description: string;
  bgClass: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface UsageStat {
  emoji: string;
  label: string;
  value: string;
  bgClass: string;
}

const PLAN_TIERS: readonly PlanTier[] = [
  {
    id: 'starter',
    tier: 'free',
    tierLabel: 'Starter',
    name: 'Free Forever',
    monthlyPrice: 0,
    tagline: 'New accounts start here',
    description: 'Free forever — use it only when you need it.',
    features: [
      { text: 'Unlimited ticket submissions' },
      { text: 'Evaluation within 24 hours' },
      { text: '1 free phone consultation' },
    ],
    ctaLabel: 'Downgrade to Free',
    ctaStyle: 'free-btn',
  },
  {
    id: 'driver_plus',
    tier: 'plus',
    tierLabel: 'Driver Plus',
    name: 'Driver Plus',
    monthlyPrice: 15,
    tagline: 'Get covered',
    description: 'Access the best traffic lawyers and safety advisers.',
    features: [
      { text: 'Unlimited ticket submissions' },
      { text: 'Evaluation within 1 hour', bold: true },
      { text: 'Phone consultations included' },
      { text: '1-on-1 lawyer or complete case support' },
      { text: 'PSP examination included' },
    ],
    ctaLabel: 'Current Plan',
    ctaStyle: 'current-btn',
  },
  {
    id: 'driver_unlimited',
    tier: 'unlim',
    tierLabel: 'Driver Unlimited',
    name: 'Driver Unlimited',
    monthlyPrice: 40,
    tagline: 'Everything included',
    description: 'All-around CDL support with no extra fees or charges.',
    features: [
      { text: 'Unlimited ticket submissions' },
      { text: 'Evaluation within 1 hour', bold: true },
      { text: 'Unlimited phone consultations' },
      { text: '1-on-1 lawyer or complete case support' },
      { text: 'Lawyer & Court fees included for 2 tickets/year', bold: true },
      { text: 'MVR & PSP examination included' },
      { text: '24/7 support', bold: true },
      { text: 'Serious cases covered up to $1,000', bold: true },
    ],
    ctaLabel: 'Upgrade to Unlimited',
    ctaStyle: 'premium-btn',
  },
] as const;

const TRUST_CARDS: readonly TrustCard[] = [
  {
    emoji: '🔒',
    title: 'Cancel Anytime',
    description: 'No lock-in contracts. Cancel your plan with one click, effective end of billing cycle.',
    bgClass: 'bg-teal',
  },
  {
    emoji: '💰',
    title: 'No Hidden Fees',
    description: 'The price you see is what you pay. No setup fees, no activation charges.',
    bgClass: 'bg-green',
  },
  {
    emoji: '⚡',
    title: 'Instant Activation',
    description: 'Your plan upgrades take effect immediately — no waiting period.',
    bgClass: 'bg-blue',
  },
  {
    emoji: '🛡️',
    title: 'Secure Billing',
    description: 'All payments processed via Stripe. Your card data is never stored on our servers.',
    bgClass: 'bg-amber',
  },
] as const;

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: 'Can I switch between plans at any time?',
    answer: 'Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately and are prorated. Downgrades take effect at the end of your current billing cycle.',
  },
  {
    question: 'What happens to my cases if I cancel?',
    answer: 'Your active cases remain open and your attorney continues working on them. You simply lose access to premium features like priority evaluation and consultation calls. Your data is retained for 12 months after cancellation.',
  },
  {
    question: 'Does the Unlimited plan cover court fees?',
    answer: 'Yes. The Driver Unlimited plan includes lawyer and court fees for up to 2 tickets per year, and covers serious case costs up to $1,000. Additional cases beyond the 2-ticket allowance are handled at standard rates.',
  },
  {
    question: 'What is PSP/MVR examination?',
    answer: 'PSP (Pre-Employment Screening Program) and MVR (Motor Vehicle Record) examinations are official record checks used to assess your driving history. Our attorneys use these to build stronger defense strategies for your cases.',
  },
] as const;

const USAGE_STATS: readonly UsageStat[] = [
  { emoji: '📋', label: 'Cases this month:', value: '12 active', bgClass: 'bg-teal' },
  { emoji: '⏱️', label: 'Evaluation SLA:', value: 'Within 1h', bgClass: 'bg-blue' },
  { emoji: '📞', label: 'Consultations:', value: 'Included', bgClass: 'bg-amber' },
  { emoji: '🔍', label: 'PSP Examination:', value: 'Included', bgClass: 'bg-green' },
] as const;

@Component({
  selector: 'app-subscription-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './subscription-management.component.html',
  styleUrl: './subscription-management.component.scss',
})
export class SubscriptionManagementComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);

  loading = signal(true);
  subscription = signal<Subscription | null>(null);
  billingInterval = signal<'monthly' | 'annual'>('monthly');
  expandedFaqIndex = signal<number | null>(null);

  readonly planTiers = PLAN_TIERS;
  readonly trustCards = TRUST_CARDS;
  readonly faqItems = FAQ_ITEMS;
  readonly usageStats = USAGE_STATS;

  currentPlanName = computed(() => {
    const sub = this.subscription();
    if (!sub) return 'No Plan';
    const match = this.planTiers.find(p => p.id === sub.plan_name);
    return match?.name ?? sub.plan_name ?? 'Unknown Plan';
  });

  ngOnInit(): void {
    this.loadSubscription();
  }

  private loadSubscription(): void {
    this.loading.set(true);
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (s) => { this.subscription.set(s); this.loading.set(false); },
      error: (err) => {
        if (err.status === 404) {
          this.subscription.set(null);
        }
        this.loading.set(false);
      },
    });
  }

  isCurrentPlan(plan: PlanTier): boolean {
    return plan.id === this.subscription()?.plan_name;
  }

  getDisplayPrice(plan: PlanTier): number {
    if (plan.monthlyPrice === 0) return 0;
    return this.billingInterval() === 'annual'
      ? Math.round(plan.monthlyPrice * 0.8)
      : plan.monthlyPrice;
  }

  toggleBilling(): void {
    this.billingInterval.update(v => v === 'monthly' ? 'annual' : 'monthly');
  }

  onToggleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleBilling();
    }
  }

  toggleFaq(index: number): void {
    this.expandedFaqIndex.update(v => v === index ? null : index);
  }

  onFaqKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.toggleFaq(index);
    }
  }

  openBillingPortal(): void {
    this.subscriptionService.getBillingPortalUrl().subscribe({
      next: ({ url }) => { window.open(url, '_blank', 'noopener,noreferrer'); },
      error: () => {},
    });
  }

  selectPlan(plan: PlanTier): void {
    if (this.isCurrentPlan(plan)) return;
    if (!confirm(`Switch to ${plan.name}?`)) return;
    this.loading.set(true);
    this.subscriptionService.createCheckoutSession(plan.id).subscribe({
      next: (result: CheckoutResult) => {
        if (result.subscription) {
          this.subscription.set(result.subscription);
          this.loading.set(false);
        } else if (result.url) {
          window.location.href = result.url;
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  cancelSubscription(): void {
    if (!confirm('Cancel your subscription? Access continues until the end of the billing period.')) return;
    this.loading.set(true);
    this.subscriptionService.cancelSubscription(this.subscription()!.id, false).subscribe({
      next: (s) => {
        this.subscription.set(s);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}

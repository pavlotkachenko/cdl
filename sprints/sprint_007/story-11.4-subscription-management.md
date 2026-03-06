# Story 11.4 — Subscription Management Rewrite (Angular 21)

**Sprint:** 007
**Theme:** Attorney Portal Modernization

## What
Rewrite `subscription-management.component.ts` to Angular 21. Current version uses constructor injection, external template, `standalone: true`, and is overly complex (proration previews, billing history table).

## Simplified Scope
- Display current plan name + status badge
- 3 plan cards (free / pro / enterprise) with feature list and price
- Highlight current plan; upgrade/downgrade CTA on others
- Cancel button (with `confirm()` dialog) when subscription is active

## Acceptance Criteria
- [ ] `inject()`, `signal()`, `ChangeDetectionStrategy.OnPush`, inline template
- [ ] No `standalone: true`, no external template
- [ ] Uses existing `SubscriptionService` from `../../../services/subscription.service`
- [ ] `loading`, `subscription`, `plans` signals
- [ ] Cancel calls `subscriptionService.cancelSubscription()` after `confirm()`

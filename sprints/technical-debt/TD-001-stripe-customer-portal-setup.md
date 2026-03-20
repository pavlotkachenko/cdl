# TD-001 — Setup Stripe Customer Portal

**Type:** Technical Debt / Configuration
**Priority:** P0
**Status:** TODO
**Related:** Sprint 068 (Subscription page redesign — "Manage Billing" button)

## Problem

The "Manage Billing" button on the subscription page calls `POST /subscriptions/portal` to create a Stripe Customer Portal session. The portal must be configured in the Stripe Dashboard before it will work in production.

## Required Actions

### 1. Enable Customer Portal in Stripe Dashboard

- Go to **Stripe Dashboard > Settings > Billing > Customer Portal**
- URL: `https://dashboard.stripe.com/settings/billing/portal`
- Toggle **"Activate link"** to ON

### 2. Configure Portal Features

Enable the following sections:

| Feature | Setting | Notes |
|---------|---------|-------|
| **Payment methods** | Allow update | Let customers add/remove cards |
| **Invoice history** | Show invoices | Display past invoices with PDF download |
| **Subscription cancellation** | Allow cancellation | Must match our in-app cancel flow |
| **Subscription switching** | Allow plan switching | Enable upgrade/downgrade between Starter, Plus, Unlimited |
| **Proration behavior** | Prorate on upgrade | Charge difference immediately on upgrade; credit on downgrade at period end |

### 3. Configure Cancellation Settings

- **Cancellation mode:** Cancel at end of billing period (not immediately)
- **Cancellation reason:** Enable reason collection (optional but recommended)
- **Retention coupon:** Consider adding a retention offer (e.g., 20% off for 3 months)

### 4. Configure Products & Prices

Ensure these Stripe products/prices exist and are visible in the portal:

| Plan | Monthly Price | Annual Price | Stripe Product |
|------|--------------|-------------|----------------|
| Starter | Free ($0) | Free ($0) | Create product with $0 price or handle as "no subscription" |
| Driver Plus | $15/month | $12/month ($144/year) | Create product + 2 prices (monthly, annual) |
| Driver Unlimited | $40/month | $32/month ($384/year) | Create product + 2 prices (monthly, annual) |

### 5. Set Return URL

- **Default return URL:** `https://<your-domain>/driver/subscription`
- This is where the user lands after closing the portal
- Configure in the backend `POST /subscriptions/portal` handler — pass `return_url` to `stripe.billingPortal.sessions.create()`

### 6. Branding

- Upload CDL Advisor logo
- Set brand color to `#1dad8c` (teal)
- Set accent color
- Add business name: "CDL Advisor"

### 7. Backend Verification

Verify the backend endpoint at `backend/src/controllers/subscription.controller.js` (or equivalent):

```js
// Expected implementation:
const session = await stripe.billingPortal.sessions.create({
  customer: stripeCustomerId,
  return_url: `${process.env.FRONTEND_URL}/driver/subscription`,
});
return res.json({ url: session.url });
```

Ensure:
- [ ] `stripeCustomerId` is fetched from the authenticated user's record
- [ ] `return_url` points to the subscription page
- [ ] Error handling returns appropriate status codes

### 8. Test Checklist

- [ ] Click "Manage Billing" → portal opens in new tab
- [ ] Can view current subscription details
- [ ] Can update payment method
- [ ] Can view/download past invoices
- [ ] Can cancel subscription (cancels at period end)
- [ ] Returning to app shows updated subscription state
- [ ] Test in Stripe **test mode** before going live

## Environment Notes

- **Test mode:** Use Stripe test keys during development
- **Live mode:** Switch to live keys only after full QA pass
- **Webhook:** Ensure `customer.subscription.updated` and `customer.subscription.deleted` webhooks are handled to sync portal changes back to Supabase

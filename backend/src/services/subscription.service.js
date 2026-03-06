/**
 * Subscription Service — Stripe subscription plans
 * Manages plan definitions, DB records, checkout sessions, and webhook events.
 */

const { supabase } = require('../config/supabase');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price_id: 'price_free',
    price: 0,
    currency: 'usd',
    interval: 'month',
    features: ['1 active case', 'Document upload', 'Basic support'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price_id: process.env.STRIPE_PRICE_BASIC || 'price_basic_monthly',
    price: 29,
    currency: 'usd',
    interval: 'month',
    features: ['5 active cases', 'Priority support', 'Attorney matching', 'Case analytics'],
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price_id: process.env.STRIPE_PRICE_PREMIUM || 'price_premium_monthly',
    price: 79,
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited cases', 'Dedicated support', 'Fleet management',
      'Advanced analytics', 'Custom reporting',
    ],
  },
];

function mapRow(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    status: row.status,
    plan_name: row.plan_name,
    price_per_month: parseFloat(row.price_per_month || 0),
    customer_type: row.customer_type,
    current_period_start: row.start_date,
    current_period_end: row.end_date,
    cancel_at_period_end: row.status === 'canceling',
    created_at: row.created_at,
  };
}

/**
 * Return static plan definitions.
 */
const getPlans = () => PLANS;

/**
 * Get the current active subscription for a user.
 * Returns null if none found.
 */
const getCurrentSubscription = async (userId) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due', 'canceling'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) return null;
  return mapRow(data[0]);
};

/**
 * Create a Stripe Checkout Session for a paid plan.
 * For the free plan or when Stripe is not configured, activates the plan directly in DB.
 * Returns { url, subscription? }.
 */
const createCheckoutSession = async (userId, priceId, successUrl, cancelUrl) => {
  const plan = PLANS.find(p => p.price_id === priceId);
  if (!plan) throw new Error('Invalid plan selected');

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (userErr || !user) throw new Error('User not found');

  const customerType = user.role === 'carrier' ? 'subscriber_carrier' : 'subscriber_driver';

  // Free plan or Stripe not configured — activate directly in DB
  if (plan.price === 0 || !stripe) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        customer_type: customerType,
        status: 'active',
        plan_name: plan.id,
        price_per_month: plan.price,
        start_date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    return { subscription: mapRow(data), url: successUrl };
  }

  // Paid plan — redirect to Stripe Checkout
  // subscription_data.metadata propagates userId/planId to the resulting subscription object
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl,
    metadata: { userId, planId: plan.id },
    subscription_data: { metadata: { userId, planId: plan.id } },
  });

  return { url: session.url };
};

/**
 * Create a Stripe Billing Portal session so the customer can manage their subscription.
 * When Stripe is not configured, returns the fallback return URL directly.
 */
const createBillingPortalSession = async (userId, returnUrl) => {
  const appUrl = process.env.APP_URL || 'http://localhost:4200';
  const fallbackUrl = returnUrl || `${appUrl}/attorney/subscription`;

  if (!stripe) {
    return { url: fallbackUrl };
  }

  const { data: user, error: userErr } = await supabase
    .from('users').select('email').eq('id', userId).single();
  if (userErr || !user) throw new Error('User not found');

  // Find or create Stripe customer by email
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  let customerId;
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
  } else {
    const customer = await stripe.customers.create({ email: user.email, metadata: { userId } });
    customerId = customer.id;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: fallbackUrl,
  });

  return { url: session.url };
};

/**
 * Retrieve the last 10 Stripe invoices for a user.
 * Returns [] when Stripe is not configured or user has no Stripe customer record.
 */
const getInvoices = async (userId) => {
  if (!stripe) return [];

  const { data: user, error } = await supabase
    .from('users').select('email').eq('id', userId).single();
  if (error || !user) return [];

  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  if (customers.data.length === 0) return [];

  const customerId = customers.data[0].id;
  const invoices = await stripe.invoices.list({ customer: customerId, limit: 10 });

  return invoices.data.map(inv => ({
    id: inv.id,
    amount: inv.amount_paid / 100,
    currency: inv.currency,
    status: inv.status,
    date: new Date(inv.created * 1000).toISOString(),
    pdf_url: inv.invoice_pdf,
    hosted_url: inv.hosted_invoice_url,
  }));
};

/**
 * Cancel a subscription. Verifies ownership before updating.
 */
const cancelSubscription = async (subscriptionId, userId) => {
  const { data: existing, error: fetchErr } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .single();

  if (fetchErr || !existing) throw new Error('Subscription not found');

  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      end_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
};

/**
 * Handle a verified Stripe webhook event.
 * Supported events: checkout.session.completed, customer.subscription.deleted,
 * invoice.payment_failed.
 */
const handleWebhookEvent = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { userId, planId } = session.metadata || {};
      if (!userId || !planId) break;

      const plan = PLANS.find(p => p.id === planId);
      if (!plan) break;

      const { data: user } = await supabase
        .from('users').select('role').eq('id', userId).single();
      const customerType = user?.role === 'carrier' ? 'subscriber_carrier' : 'subscriber_driver';

      const end = new Date();
      end.setMonth(end.getMonth() + 1);

      await supabase.from('subscriptions').insert({
        user_id: userId,
        customer_type: customerType,
        status: 'active',
        plan_name: plan.id,
        price_per_month: plan.price,
        start_date: new Date().toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      });
      break;
    }

    case 'customer.subscription.updated': {
      // subscription_data.metadata set during checkout propagates userId/planId here
      const sub = event.data.object;
      const { userId, planId } = sub.metadata || {};
      if (!userId) break;

      const plan = PLANS.find(p => p.id === planId);
      const end = new Date(sub.current_period_end * 1000);

      await supabase.from('subscriptions').update({
        status: sub.cancel_at_period_end ? 'canceling' : sub.status,
        ...(plan && { plan_name: plan.id, price_per_month: plan.price }),
        end_date: end.toISOString().split('T')[0],
      }).eq('user_id', userId).in('status', ['active', 'trialing', 'past_due', 'canceling']);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object;
      if (!invoice.subscription) break;

      // subscription_details.metadata carries the subscription's metadata (userId, planId)
      const { userId } = invoice.subscription_details?.metadata || {};
      if (!userId) break;

      const periodEnd = invoice.lines?.data?.[0]?.period?.end;
      const end = periodEnd ? new Date(periodEnd * 1000) : null;

      await supabase.from('subscriptions').update({
        status: 'active',
        ...(end && { end_date: end.toISOString().split('T')[0] }),
      }).eq('user_id', userId).in('status', ['active', 'trialing', 'past_due', 'canceling']);
      break;
    }

    case 'customer.subscription.deleted':
      console.log('[SubscriptionService] Stripe subscription deleted:', event.data.object.id);
      break;

    case 'invoice.payment_failed':
      console.log('[SubscriptionService] Invoice payment failed:', event.data.object.id);
      break;

    default:
      console.log(`[SubscriptionService] Unhandled webhook event: ${event.type}`);
  }

  return { received: true };
};

module.exports = {
  PLANS,
  getPlans,
  getCurrentSubscription,
  createCheckoutSession,
  createBillingPortalSession,
  getInvoices,
  cancelSubscription,
  handleWebhookEvent,
};

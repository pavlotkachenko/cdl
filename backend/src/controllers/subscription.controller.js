/**
 * Subscription Controller — thin handlers for subscription endpoints.
 */

const subscriptionService = require('../services/subscription.service');

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

exports.getPlans = (req, res) => {
  res.json({ plans: subscriptionService.getPlans() });
};

exports.getCurrentSubscription = async (req, res) => {
  try {
    const sub = await subscriptionService.getCurrentSubscription(req.user.id);
    if (!sub) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No active subscription found' },
      });
    }
    res.json({ subscription: sub });
  } catch (err) {
    console.error('[SubscriptionController] getCurrentSubscription:', err.message);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve subscription' },
    });
  }
};

exports.createCheckoutSession = async (req, res) => {
  const { price_id, success_url, cancel_url } = req.body;
  if (!price_id) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'price_id is required' },
    });
  }

  const appUrl = process.env.APP_URL || 'http://localhost:4200';
  const successUrl = success_url || `${appUrl}/attorney/subscription?success=true`;
  const cancelUrl  = cancel_url  || `${appUrl}/attorney/subscription`;

  try {
    const result = await subscriptionService.createCheckoutSession(
      req.user.id, price_id, successUrl, cancelUrl,
    );
    res.json(result);
  } catch (err) {
    console.error('[SubscriptionController] createCheckoutSession:', err.message);
    const status = err.message === 'Invalid plan selected' ? 400 : 500;
    res.status(status).json({
      error: { code: 'CHECKOUT_ERROR', message: err.message },
    });
  }
};

exports.createBillingPortalSession = async (req, res) => {
  const appUrl = process.env.APP_URL || 'http://localhost:4200';
  const returnUrl = req.body.return_url || `${appUrl}/attorney/subscription`;

  try {
    const result = await subscriptionService.createBillingPortalSession(req.user.id, returnUrl);
    res.json(result);
  } catch (err) {
    console.error('[SubscriptionController] createBillingPortalSession:', err.message);
    const status = err.message === 'User not found' ? 404 : 500;
    res.status(status).json({
      error: { code: 'PORTAL_ERROR', message: err.message },
    });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await subscriptionService.getInvoices(req.user.id);
    res.json({ invoices });
  } catch (err) {
    console.error('[SubscriptionController] getInvoices:', err.message);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve invoices' },
    });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const sub = await subscriptionService.cancelSubscription(req.params.id, req.user.id);
    res.json({ subscription: sub });
  } catch (err) {
    console.error('[SubscriptionController] cancelSubscription:', err.message);
    const status = err.message === 'Subscription not found' ? 404 : 500;
    res.status(status).json({
      error: { code: 'CANCEL_ERROR', message: err.message },
    });
  }
};

exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (stripe && webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // Dev/test mode — parse body directly
      event = typeof req.body === 'string' || Buffer.isBuffer(req.body)
        ? JSON.parse(req.body.toString())
        : req.body;
    }
  } catch (err) {
    console.error('[SubscriptionController] Webhook signature error:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    const result = await subscriptionService.handleWebhookEvent(event);
    res.json(result);
  } catch (err) {
    console.error('[SubscriptionController] Webhook processing error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

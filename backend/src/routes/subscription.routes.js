/**
 * Subscription Routes
 * Base path: /api/subscriptions
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscription.controller');
const { authenticate } = require('../middleware/auth');

// Public — plan catalog
router.get('/plans', subscriptionController.getPlans);

// Stripe webhook (raw body required for signature verification)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.webhook);

// Protected routes
router.use(authenticate);

router.get('/current', subscriptionController.getCurrentSubscription);
router.post('/checkout', subscriptionController.createCheckoutSession);
router.post('/portal', subscriptionController.createBillingPortalSession);
router.get('/invoices', subscriptionController.getInvoices);
router.post('/:id/cancel', subscriptionController.cancelSubscription);

module.exports = router;

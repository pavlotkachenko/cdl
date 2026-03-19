// ============================================
// PAYMENT ROUTES
// API endpoints for payment operations
// ============================================

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Public routes
router.get('/config', paymentController.getStripeConfig);

// Webhook route (must be before body parser middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Protected routes (require authentication)
router.use(authenticate);

// Payment intent routes
router.post('/create-intent', paymentController.createPaymentIntent);
router.post('/confirm', paymentController.confirmPayment);

// Payment confirmation & receipt routes (before /:id to avoid param conflict)
router.get('/confirmation/:paymentIntentId', paymentController.getPaymentConfirmation);
router.get('/:id/receipt', paymentController.downloadReceipt);

// Payment retrieval routes
router.get('/user/me/stats', paymentController.getUserPaymentStats);
router.get('/user/me', paymentController.getUserPayments);
router.get('/case/:caseId', paymentController.getCasePayments);
router.get('/stats', paymentController.getPaymentStats);
router.get('/:id', paymentController.getPayment);

// Refund & retry routes
router.post('/:id/retry', paymentController.retryPayment);
router.post('/:id/refund', paymentController.processRefund);

// Installment payment plan routes
router.get('/plan-options/:caseId', paymentController.getPaymentPlanOptions);
router.post('/create-plan', paymentController.createPaymentPlan);

module.exports = router;

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

// Payment retrieval routes
router.get('/user/me', paymentController.getUserPayments);
router.get('/ticket/:ticketId', paymentController.getTicketPayments);
router.get('/stats', paymentController.getPaymentStats);
router.get('/:id', paymentController.getPayment);

// Refund routes
router.post('/:id/refund', paymentController.processRefund);

module.exports = router;

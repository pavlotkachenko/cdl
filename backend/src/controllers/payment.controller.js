// ============================================
// PAYMENT CONTROLLER
// Handle HTTP requests for payment operations
// ============================================

const paymentService = require('../services/payment.service');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Create payment intent
 * POST /api/payments/create-intent
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { ticketId, amount, currency, metadata } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!ticketId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero'
      });
    }

    const result = await paymentService.createPaymentIntent({
      ticketId,
      userId,
      amount,
      currency: currency || 'USD',
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent'
    });
  }
};

/**
 * Confirm payment
 * POST /api/payments/confirm
 */
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    const payment = await paymentService.confirmPayment(paymentIntentId);

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment'
    });
  }
};

/**
 * Get payment by ID
 * GET /api/payments/:id
 */
const getPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPayment(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve payment'
    });
  }
};

/**
 * Get payments for a ticket
 * GET /api/payments/ticket/:ticketId
 */
const getTicketPayments = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const payments = await paymentService.getTicketPayments(ticketId);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get ticket payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve ticket payments'
    });
  }
};

/**
 * Get user payments
 * GET /api/payments/user/me
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit } = req.query;

    const payments = await paymentService.getUserPayments(userId, {
      status,
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve user payments'
    });
  }
};

/**
 * Process refund
 * POST /api/payments/:id/refund
 */
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    // Verify user has permission to refund (admin/operator only)
    if (!['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to process refund'
      });
    }

    const refund = await paymentService.processRefund(id, amount, reason);

    res.json({
      success: true,
      data: refund,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
};

/**
 * Stripe webhook handler
 * POST /api/payments/webhook
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({
      success: false,
      message: `Webhook Error: ${err.message}`
    });
  }

  try {
    // Handle the event
    await paymentService.handleWebhook(event);

    res.json({
      success: true,
      received: true
    });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Webhook processing failed'
    });
  }
};

/**
 * Get payment statistics
 * GET /api/payments/stats
 */
const getPaymentStats = async (req, res) => {
  try {
    // Admin/operator only
    if (!['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    const { startDate, endDate } = req.query;
    const stats = await paymentService.getPaymentStats({
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve payment statistics'
    });
  }
};

/**
 * Get Stripe publishable key
 * GET /api/payments/config
 */
const getStripeConfig = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
      }
    });
  } catch (error) {
    console.error('Get Stripe config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve Stripe configuration'
    });
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPayment,
  getTicketPayments,
  getUserPayments,
  processRefund,
  handleWebhook,
  getPaymentStats,
  getStripeConfig
};

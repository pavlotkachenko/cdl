// ============================================
// PAYMENT CONTROLLER
// Handle HTTP requests for payment operations
// ============================================

const paymentService = require('../services/payment.service');
const emailService = require('../services/email.service');
const { supabase } = require('../config/supabase');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

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

    // Non-blocking invoice email to driver after payment confirmation
    if (payment?.ticketId && payment?.userId) {
      supabase
        .from('cases').select('case_number, customer_name, attorney_price, driver_id')
        .eq('id', payment.ticketId).single()
        .then(({ data: caseRow }) => {
          if (!caseRow) return;
          return supabase.from('users').select('email, full_name').eq('id', caseRow.driver_id).single()
            .then(({ data: driver }) => {
              if (!driver) return;
              const invoiceNumber = `INV-${(caseRow.case_number || payment.ticketId).toString().slice(0, 8).toUpperCase()}`;
              emailService.sendInvoiceEmail({
                name: driver.full_name || caseRow.customer_name,
                email: driver.email,
                invoiceNumber,
                amount: parseFloat(caseRow.attorney_price || 0),
                caseId: payment.ticketId,
              }).catch(err => console.error('[confirmPayment] Invoice email failed:', err));
            });
        })
        .catch(err => console.error('[confirmPayment] Invoice lookup failed:', err));
    }

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

// ─────────────────────────────────────────────────────────
// PAYMENT PLANS — weekly installment plans for case fees
// ─────────────────────────────────────────────────────────

/**
 * Get payment plan options for a case.
 * GET /api/payments/plan-options/:caseId
 */
const getPaymentPlanOptions = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { data: caseRow, error } = await supabase
      .from('cases').select('attorney_price').eq('id', caseId).single();
    if (error || !caseRow) return res.status(404).json({ success: false, message: 'Case not found' });

    const total = parseFloat(caseRow.attorney_price || 0);
    const round25 = (n) => Math.ceil(n * 4) / 4; // round up to nearest $0.25

    res.json({
      success: true,
      data: {
        caseId,
        totalAmount: total,
        payNow: { label: 'Pay Now', amount: total, weeks: 0, installments: 1 },
        twoWeek: { label: '2 weeks', weeklyAmount: round25(total / 2), weeks: 2, installments: 2 },
        fourWeek: { label: '4 weeks', weeklyAmount: round25(total / 4), weeks: 4, installments: 4, popular: true },
        eightWeek: { label: '8 weeks', weeklyAmount: round25(total / 8), weeks: 8, installments: 8 },
      }
    });
  } catch (err) {
    console.error('getPaymentPlanOptions error:', err);
    res.status(500).json({ success: false, message: 'Failed to load plan options' });
  }
};

/**
 * Create an installment plan and charge first installment immediately.
 * POST /api/payments/create-plan
 * Body: { caseId, weeks: 2|4|8, paymentMethodId }
 */
const createPaymentPlan = async (req, res) => {
  try {
    const { caseId, weeks, paymentMethodId } = req.body;
    const userId = req.user.id;

    if (![2, 4, 8].includes(Number(weeks))) {
      return res.status(400).json({ success: false, message: 'weeks must be 2, 4, or 8' });
    }

    const { data: caseRow, error: caseErr } = await supabase
      .from('cases').select('attorney_price, case_number').eq('id', caseId).single();
    if (caseErr || !caseRow) return res.status(404).json({ success: false, message: 'Case not found' });

    const total = parseFloat(caseRow.attorney_price || 0);
    const weekly = Math.ceil((total / weeks) * 4) / 4;

    // Create first PaymentIntent via Stripe
    let firstIntentId = null;
    if (stripe && paymentMethodId) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(weekly * 100),
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
        metadata: { caseId, userId, installment: 1, weeks: String(weeks) },
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      });
      firstIntentId = intent.id;
    }

    // Insert plan row
    const { data: plan, error: planErr } = await supabase
      .from('case_installment_plans')
      .insert({ case_id: caseId, user_id: userId, total_amount: total, weeks, weekly_amount: weekly, payments_completed: 1 })
      .select().single();
    if (planErr) throw planErr;

    // Build installment schedule (first already paid)
    const today = new Date();
    const scheduleRows = Array.from({ length: weeks }, (_, i) => ({
      plan_id: plan.id,
      installment_num: i + 1,
      amount: weekly,
      due_date: new Date(today.getTime() + i * 7 * 86400000).toISOString().slice(0, 10),
      status: i === 0 ? 'paid' : 'pending',
      stripe_payment_intent_id: i === 0 ? firstIntentId : null,
      paid_at: i === 0 ? new Date().toISOString() : null,
    }));
    await supabase.from('case_installment_schedule').insert(scheduleRows);

    res.status(201).json({ success: true, data: { planId: plan.id, weeks, weeklyAmount: weekly, schedule: scheduleRows } });
  } catch (err) {
    console.error('createPaymentPlan error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create payment plan' });
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
  getStripeConfig,
  getPaymentPlanOptions,
  createPaymentPlan,
};

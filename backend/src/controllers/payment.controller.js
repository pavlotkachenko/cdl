// ============================================
// PAYMENT CONTROLLER
// Handle HTTP requests for payment operations
// ============================================

const paymentService = require('../services/payment.service');
const emailService = require('../services/email.service');
const { supabase } = require('../config/supabase');
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const webhookService = require('../services/webhook.service');

/**
 * Create payment intent
 * POST /api/payments/create-intent
 */
const createPaymentIntent = async (req, res) => {
  try {
    const { caseId, amount, currency, metadata } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!caseId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Case ID and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than zero'
      });
    }

    const result = await paymentService.createPaymentIntent({
      caseId,
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
    if (payment?.case_id && payment?.user_id) {
      supabase
        .from('cases').select('case_number, customer_name, attorney_price, driver_id')
        .eq('id', payment.case_id).single()
        .then(({ data: caseRow }) => {
          if (!caseRow) return;
          return supabase.from('users').select('email, full_name').eq('id', caseRow.driver_id).single()
            .then(({ data: driver }) => {
              if (!driver) return;
              const invoiceNumber = `INV-${(caseRow.case_number || payment.case_id).toString().slice(0, 8).toUpperCase()}`;
              emailService.sendInvoiceEmail({
                name: driver.full_name || caseRow.customer_name,
                email: driver.email,
                invoiceNumber,
                amount: parseFloat(caseRow.attorney_price || 0),
                caseId: payment.case_id,
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
 * Get payments for a case
 * GET /api/payments/case/:caseId
 */
const getCasePayments = async (req, res) => {
  try {
    const { caseId } = req.params;
    const payments = await paymentService.getCasePayments(caseId);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get case payments error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve case payments'
    });
  }
};

/**
 * Get user payments (enhanced with filtering, sorting, pagination)
 * GET /api/payments/user/me
 */
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status, date_from, date_to, amount_min, amount_max, search,
      sort_by, sort_dir, page, per_page
    } = req.query;

    const result = await paymentService.getUserPayments(userId, {
      status,
      date_from,
      date_to,
      amount_min: amount_min ? parseFloat(amount_min) : undefined,
      amount_max: amount_max ? parseFloat(amount_max) : undefined,
      search,
      sort_by: sort_by || 'created_at',
      sort_dir: sort_dir || 'desc',
      page: page ? parseInt(page) : 1,
      per_page: per_page ? parseInt(per_page) : 10,
    });

    res.json({
      success: true,
      data: result.payments,
      pagination: result.pagination
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
 * Get user payment stats (KPI cards)
 * GET /api/payments/user/me/stats
 */
const getUserPaymentStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await paymentService.getUserPaymentStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get user payment stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve payment statistics'
    });
  }
};

/**
 * Retry a failed payment
 * POST /api/payments/:id/retry
 */
const retryPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await paymentService.retryPayment(id, userId);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Retry payment error:', error);

    const statusMap = {
      'Payment not found or access denied': 403,
      'Only failed payments can be retried': 400,
      'A pending or succeeded payment already exists for this case': 409,
      'Please wait at least 60 seconds between retry attempts': 429,
    };
    const status = statusMap[error.message] || 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Failed to retry payment'
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

    // Dispatch webhook (non-blocking) — fetch carrier_id from case
    supabase.from('cases').select('carrier_id').eq('id', caseId).single()
      .then(({ data: c }) => {
        if (c?.carrier_id) {
          webhookService.dispatch(c.carrier_id, 'payment.received', { caseId, planId: plan.id, weeklyAmount: weekly, weeks });
        }
      }).catch(() => {});

    res.status(201).json({ success: true, data: { planId: plan.id, weeks, weeklyAmount: weekly, schedule: scheduleRows } });
  } catch (err) {
    console.error('createPaymentPlan error:', err);
    const isTableMissing = err?.code === '42P01' || (err?.message || '').includes('schema cache');
    const message = isTableMissing
      ? 'Installment plans are not yet available. Please use Pay in Full.'
      : 'Failed to create payment plan. Please try again.';
    res.status(500).json({ success: false, message });
  }
};

/**
 * Get enriched payment confirmation data
 * GET /api/payments/confirmation/:paymentIntentId
 */
const getPaymentConfirmation = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const userId = req.user.id;

    const data = await paymentService.getPaymentConfirmation(paymentIntentId, userId);

    res.json({ success: true, data });
  } catch (error) {
    console.error('Get payment confirmation error:', error);
    const statusMap = {
      'Payment not found': 404,
      'Access denied': 403,
    };
    const status = statusMap[error.message] || 500;
    res.status(status).json({
      success: false,
      message: error.message || 'Failed to retrieve payment confirmation',
    });
  }
};

/**
 * Download payment receipt (redirect to Stripe or generate PDF)
 * GET /api/payments/:id/receipt
 */
const downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const payment = await paymentService.getPayment(id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // If Stripe receipt URL exists, redirect
    if (payment.receipt_url) {
      return res.redirect(302, payment.receipt_url);
    }

    // Generate PDF with pdfkit
    const { data: caseData } = await supabase
      .from('cases')
      .select('case_number')
      .eq('id', payment.case_id)
      .maybeSingle();

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${id}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('CDL Advisor', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Payment Receipt', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(11).font('Helvetica-Bold').text('Amount Paid:');
    doc.font('Helvetica').text(`$${parseFloat(payment.amount).toFixed(2)} ${payment.currency || 'USD'}`);
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('Transaction ID:');
    doc.font('Helvetica').text(payment.stripe_charge_id || payment.stripe_payment_intent_id || 'N/A');
    doc.moveDown(0.5);

    doc.font('Helvetica-Bold').text('Date:');
    doc.font('Helvetica').text(
      payment.paid_at
        ? new Date(payment.paid_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })
        : 'N/A'
    );
    doc.moveDown(0.5);

    if (payment.card_brand || payment.card_last4) {
      doc.font('Helvetica-Bold').text('Payment Method:');
      doc.font('Helvetica').text(
        `${(payment.card_brand || 'Card').toUpperCase()} ending in ${payment.card_last4 || '****'}`
      );
      doc.moveDown(0.5);
    }

    if (caseData?.case_number) {
      doc.font('Helvetica-Bold').text('Case Number:');
      doc.font('Helvetica').text(caseData.case_number);
      doc.moveDown(0.5);
    }

    doc.font('Helvetica-Bold').text('Status:');
    doc.font('Helvetica').text(payment.status === 'succeeded' ? 'Confirmed' : payment.status);
    doc.moveDown(2);

    doc.fontSize(9).fillColor('#666').text(
      'Secured by Stripe \u00B7 AES-256 encrypted \u00B7 PCI DSS compliant',
      { align: 'center' }
    );

    doc.end();
  } catch (error) {
    console.error('Download receipt error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message || 'Failed to generate receipt' });
    }
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPayment,
  getCasePayments,
  getUserPayments,
  getUserPaymentStats,
  retryPayment,
  processRefund,
  handleWebhook,
  getPaymentStats,
  getStripeConfig,
  getPaymentPlanOptions,
  createPaymentPlan,
  getPaymentConfirmation,
  downloadReceipt,
};
// ============================================
// PAYMENT SERVICE
// Core payment processing with Stripe integration
// ============================================

const stripe = process.env.STRIPE_SECRET_KEY
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;
const { supabase } = require('../config/supabase');
const { sendPaymentConfirmationEmail } = require('./email.service');

class PaymentService {
  /**
   * Create a payment intent for a case
   * @param {Object} params - Payment parameters
   * @returns {Object} Payment intent details
   */
  async createPaymentIntent({ caseId, userId, amount, currency = 'USD', metadata = {} }) {
    try {
      // Validate case exists and belongs to user
      const { data: caseData, error: caseError } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .eq('driver_id', userId)
        .single();

      if (caseError || !caseData) {
        throw new Error('Case not found or access denied');
      }

      // Check if payment already exists for this case
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('case_id', caseId)
        .eq('status', 'succeeded')
        .single();

      if (existingPayment) {
        throw new Error('Payment already exists for this case');
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          caseId,
          userId,
          caseNumber: caseData.case_number || caseId,
          ...metadata
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Save payment record in database
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          case_id: caseId,
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          amount,
          currency: currency.toUpperCase(),
          status: 'pending',
          metadata: {
            ...metadata,
            payment_intent_status: paymentIntent.status
          }
        })
        .select()
        .single();

      if (paymentError) {
        // Cancel the payment intent if database insert fails
        await stripe.paymentIntents.cancel(paymentIntent.id);
        throw paymentError;
      }

      // Update case payment status
      await supabase
        .from('cases')
        .update({
          payment_status: 'pending',
          payment_amount: amount
        })
        .eq('id', caseId);

      return {
        payment,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  /**
   * Confirm payment after successful Stripe charge
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @returns {Object} Updated payment record
   */
  async confirmPayment(paymentIntentId) {
    try {
      // Retrieve payment intent from Stripe (expand latest_charge for card details)
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge'],
      });

      // Extract card details — latest_charge is the modern API (charges.data[] is deprecated)
      const charge = typeof paymentIntent.latest_charge === 'object'
        ? paymentIntent.latest_charge
        : (paymentIntent.charges?.data?.[0] || null);
      const cardDetails = charge?.payment_method_details?.card || {};

      // Update payment in database
      const updateFields = {
        status: 'succeeded',
        stripe_charge_id: charge?.id || null,
        payment_method: paymentIntent.payment_method_types?.[0] || 'card',
        paid_at: new Date().toISOString(),
        metadata: {
          payment_intent_status: paymentIntent.status,
        }
      };

      // Card detail columns are optional (migration 026)
      let { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          ...updateFields,
          card_brand: cardDetails.brand || null,
          card_last4: cardDetails.last4 || null,
          receipt_url: charge?.receipt_url || null,
        })
        .eq('stripe_payment_intent_id', paymentIntentId)
        .select()
        .single();

      // Fallback: if card columns don't exist yet, update without them
      if (paymentError && paymentError.code === 'PGRST204') {
        ({ data: payment, error: paymentError } = await supabase
          .from('payments')
          .update(updateFields)
          .eq('stripe_payment_intent_id', paymentIntentId)
          .select()
          .single());
      }

      if (paymentError) {
        throw paymentError;
      }

      // Update case payment status
      if (payment.case_id) {
        await supabase
          .from('cases')
          .update({ payment_status: 'paid' })
          .eq('id', payment.case_id);
      }

      // Send payment confirmation email (non-blocking)
      const { data: userProfile } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', payment.user_id)
        .maybeSingle();

      if (userProfile) {
        sendPaymentConfirmationEmail({
          name: userProfile.full_name || userProfile.email,
          email: userProfile.email,
          amount: payment.amount * 100, // convert dollars → cents for formatter
          caseId: payment.case_id,
          last4: cardDetails.last4,
          transactionId: charge?.id,
        });
      }

      return payment;
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {string} failureReason - Reason for failure
   * @returns {Object} Updated payment record
   */
  async handlePaymentFailure(paymentIntentId, failureReason = 'Payment failed') {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .update({
          status: 'failed',
          metadata: {
            failure_reason: failureReason,
            failed_at: new Date().toISOString()
          }
        })
        .eq('stripe_payment_intent_id', paymentIntentId)
        .select()
        .single();

      if (error) throw error;

      // Update case payment status back to unpaid
      if (payment.case_id) {
        await supabase
          .from('cases')
          .update({
            payment_status: 'unpaid'
          })
          .eq('id', payment.case_id);
      }

      return payment;
    } catch (error) {
      console.error('Handle payment failure error:', error);
      throw error;
    }
  }

  /**
   * Process refund for a payment
   * @param {string} paymentId - Payment ID
   * @param {number} amount - Refund amount (optional, defaults to full refund)
   * @param {string} reason - Refund reason
   * @returns {Object} Refund record
   */
  async processRefund(paymentId, amount = null, reason = 'requested_by_customer') {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'succeeded') {
        throw new Error('Only succeeded payments can be refunded');
      }

      // Calculate refund amount
      const refundAmount = amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
      }

      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason
      });

      // Save refund record
      const { data: refundRecord, error: refundError } = await supabase
        .from('payment_refunds')
        .insert({
          payment_id: paymentId,
          stripe_refund_id: refund.id,
          amount: refundAmount,
          reason,
          status: 'succeeded',
          processed_at: new Date().toISOString(),
          metadata: {
            refund_status: refund.status,
            stripe_data: refund
          }
        })
        .select()
        .single();

      if (refundError) throw refundError;

      // Update payment status
      const newPaymentStatus = refundAmount === payment.amount ? 'refunded' : 'succeeded';
      await supabase
        .from('payments')
        .update({ status: newPaymentStatus })
        .eq('id', paymentId);

      // Update case payment status
      if (payment.case_id) {
        const casePaymentStatus = refundAmount === payment.amount ? 'refunded' : 'partial_refund';
        await supabase
          .from('cases')
          .update({ payment_status: casePaymentStatus })
          .eq('id', payment.case_id);
      }

      return refundRecord;
    } catch (error) {
      console.error('Process refund error:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Object} Payment details
   */
  async getPayment(paymentId) {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      return payment;
    } catch (error) {
      console.error('Get payment error:', error);
      throw error;
    }
  }

  /**
   * Get payments for a case
   * @param {string} caseId - Case ID
   * @returns {Array} List of payments
   */
  async getCasePayments(caseId) {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return payments;
    } catch (error) {
      console.error('Get case payments error:', error);
      throw error;
    }
  }

  /**
   * Get user payments with filtering, pagination, and sorting
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} { payments, pagination }
   */
  async getUserPayments(userId, options = {}) {
    try {
      const {
        status,
        start_date,
        end_date,
        min_amount,
        max_amount,
        search,
        sort_by = 'created_at',
        sort_order = 'desc',
        page = 1,
        per_page = 10,
      } = options;

      // Build base query with joins
      let query = supabase
        .from('payments')
        .select('*, cases(id, case_number, violation_type, assigned_attorney_id)', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }
      if (min_amount) {
        query = query.gte('amount', parseFloat(min_amount));
      }
      if (max_amount) {
        query = query.lte('amount', parseFloat(max_amount));
      }
      if (search) {
        query = query.or(`description.ilike.%${search}%`);
      }

      // Sorting
      const ascending = sort_order === 'asc';
      const sortColumn = ['created_at', 'amount'].includes(sort_by) ? sort_by : 'created_at';
      query = query.order(sortColumn, { ascending });

      // Pagination
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(per_page) || 10));
      const offset = (pageNum - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data: payments, error, count } = await query;

      if (error) throw error;

      // Fetch attorney names for cases that have attorney_id
      const attorneyIds = [...new Set(
        (payments || [])
          .map(p => p.cases?.assigned_attorney_id)
          .filter(Boolean)
      )];

      let attorneyMap = {};
      if (attorneyIds.length > 0) {
        const { data: attorneys } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', attorneyIds);

        if (attorneys) {
          attorneyMap = Object.fromEntries(attorneys.map(a => [a.id, a.full_name]));
        }
      }

      // Enrich payments with attorney name
      const enriched = (payments || []).map(p => {
        const caseData = p.cases || {};
        const attorneyName = caseData.assigned_attorney_id ? attorneyMap[caseData.assigned_attorney_id] || null : null;
        return {
          ...p,
          case: caseData.id ? {
            id: caseData.id,
            case_number: caseData.case_number,
            violation_type: caseData.violation_type,
          } : null,
          attorney: attorneyName ? { name: attorneyName } : null,
          cases: undefined, // Remove raw join data
        };
      });

      return {
        payments: enriched,
        pagination: {
          page: pageNum,
          per_page: limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      console.error('Get user payments error:', error);
      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Object} Processing result
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.confirmPayment(event.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(
            event.data.object.id,
            event.data.object.last_payment_error?.message
          );
          break;

        case 'charge.refunded':
          // Refund is already handled via processRefund method
          console.log('Refund webhook received:', event.data.object.id);
          break;

        case 'payment_intent.canceled':
          await supabase
            .from('payments')
            .update({
              status: 'cancelled',
              metadata: {
                cancelled_at: new Date().toISOString()
              }
            })
            .eq('stripe_payment_intent_id', event.data.object.id);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }

      return { received: true, processed: true };
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Get per-user payment stats for KPI cards
   * @param {string} userId - User ID
   * @returns {Object} Payment statistics for the user
   */
  async getUserPaymentStats(userId) {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, status')
        .eq('user_id', userId);

      if (error) throw error;

      const rows = payments || [];
      const byStatus = (s) => rows.filter(p => p.status === s);
      const sumAmount = (arr) => arr.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      return {
        total_amount: sumAmount(rows),
        paid_amount: sumAmount(byStatus('succeeded')),
        pending_amount: sumAmount(byStatus('pending')),
        failed_amount: sumAmount(byStatus('failed')),
        refunded_amount: sumAmount(byStatus('refunded')),
        transaction_count: rows.length,
        paid_count: byStatus('succeeded').length,
        pending_count: byStatus('pending').length,
        failed_count: byStatus('failed').length,
        refunded_count: byStatus('refunded').length,
        currency: 'USD',
      };
    } catch (error) {
      console.error('Get user payment stats error:', error);
      throw error;
    }
  }

  /**
   * Retry a failed payment — creates a new PaymentIntent for the same case/amount
   * @param {string} paymentId - Original failed payment ID
   * @param {string} userId - Authenticated user ID
   * @returns {Object} New payment record with client_secret
   */
  async retryPayment(paymentId, userId) {
    try {
      // Get the failed payment
      const { data: original, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (fetchError || !original) {
        throw new Error('Payment not found');
      }

      // Authorization: only the payment owner can retry
      if (original.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      // Only failed payments can be retried
      if (original.status !== 'failed') {
        throw new Error('Only failed payments can be retried');
      }

      // Check for existing pending/succeeded payment for the same case
      const caseId = original.case_id;
      const { data: existing } = await supabase
        .from('payments')
        .select('id, status')
        .eq('case_id', caseId)
        .in('status', ['pending', 'succeeded'])
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('A pending or completed payment already exists for this case');
      }

      // Cooldown: check if a payment was created in the last 60 seconds
      const { data: recent } = await supabase
        .from('payments')
        .select('created_at')
        .eq('case_id', caseId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (recent && recent.length > 0) {
        const lastCreated = new Date(recent[0].created_at).getTime();
        if (Date.now() - lastCreated < 60000) {
          throw new Error('Please wait before retrying. Try again in a minute.');
        }
      }

      // Create new Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(original.amount * 100),
        currency: (original.currency || 'USD').toLowerCase(),
        metadata: {
          caseId,
          userId,
          retryOf: paymentId,
        },
        automatic_payment_methods: { enabled: true },
      });

      // Save new payment record
      const { data: newPayment, error: insertError } = await supabase
        .from('payments')
        .insert({
          case_id: caseId,
          user_id: userId,
          stripe_payment_intent_id: paymentIntent.id,
          amount: original.amount,
          currency: original.currency || 'USD',
          status: 'pending',
          description: original.description,
          metadata: { retry_of: paymentId },
        })
        .select()
        .single();

      if (insertError) {
        await stripe.paymentIntents.cancel(paymentIntent.id);
        throw insertError;
      }

      return {
        payment: newPayment,
        client_secret: paymentIntent.client_secret,
      };
    } catch (error) {
      console.error('Retry payment error:', error);
      throw error;
    }
  }

  /**
   * Get enriched payment confirmation data by Stripe payment intent ID
   * @param {string} paymentIntentId - Stripe payment intent ID
   * @param {string} userId - Authenticated user ID (for access control)
   * @returns {Object} Enriched payment confirmation data
   */
  async getPaymentConfirmation(paymentIntentId, userId) {
    try {
      // 1. Query payment by stripe_payment_intent_id
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found');
      }

      // 2. Verify ownership
      if (payment.user_id !== userId) {
        throw new Error('Access denied');
      }

      // 3. Get case data
      let caseData = null;
      if (payment.case_id) {
        const { data: caseRow } = await supabase
          .from('cases')
          .select('id, case_number, violation_type, violation_location, assigned_attorney_id')
          .eq('id', payment.case_id)
          .single();
        caseData = caseRow;
      }

      // 4. Get attorney name
      let attorney = null;
      if (caseData?.assigned_attorney_id) {
        const { data: attorneyRow } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', caseData.assigned_attorney_id)
          .single();

        if (attorneyRow?.full_name) {
          const initials = attorneyRow.full_name
            .split(/\s+/)
            .map(w => w[0])
            .join('')
            .toUpperCase();
          attorney = { name: attorneyRow.full_name, initials };
        }
      }

      // 5. Get driver email
      let driverEmail = null;
      const { data: driverRow } = await supabase
        .from('users')
        .select('email')
        .eq('id', payment.user_id)
        .single();
      if (driverRow) {
        driverEmail = driverRow.email;
      }

      // 6. Shape response
      return {
        payment_id: payment.id,
        amount: parseFloat(payment.amount),
        currency: payment.currency || 'USD',
        status: payment.status,
        transaction_id: payment.stripe_charge_id || payment.stripe_payment_intent_id,
        stripe_payment_intent_id: payment.stripe_payment_intent_id,
        paid_at: payment.paid_at || null,
        card_brand: payment.card_brand || null,
        card_last4: payment.card_last4 || null,
        case: caseData ? {
          id: caseData.id,
          case_number: caseData.case_number,
          violation_type: caseData.violation_type,
          violation_location: caseData.violation_location,
        } : null,
        attorney,
        driver_email: driverEmail,
      };
    } catch (error) {
      console.error('Get payment confirmation error:', error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Payment statistics
   */
  async getPaymentStats(filters = {}) {
    try {
      let query = supabase
        .from('payments')
        .select('amount, status, created_at');

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data: payments, error } = await query;

      if (error) throw error;

      const stats = {
        total_payments: payments.length,
        total_amount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        succeeded: payments.filter(p => p.status === 'succeeded').length,
        failed: payments.filter(p => p.status === 'failed').length,
        pending: payments.filter(p => p.status === 'pending').length,
        refunded: payments.filter(p => p.status === 'refunded').length,
        success_rate: payments.length > 0 
          ? (payments.filter(p => p.status === 'succeeded').length / payments.length * 100).toFixed(2)
          : 0
      };

      return stats;
    } catch (error) {
      console.error('Get payment stats error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();

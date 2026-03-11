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
   * Create a payment intent for a ticket
   * @param {Object} params - Payment parameters
   * @returns {Object} Payment intent details
   */
  async createPaymentIntent({ ticketId, userId, amount, currency = 'USD', metadata = {} }) {
    try {
      // Validate ticket exists and belongs to user
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .eq('user_id', userId)
        .single();

      if (ticketError || !ticket) {
        throw new Error('Ticket not found or access denied');
      }

      // Check if payment already exists for this ticket
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('status', 'succeeded')
        .single();

      if (existingPayment) {
        throw new Error('Payment already exists for this ticket');
      }

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          ticketId,
          userId,
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
          ticket_id: ticketId,
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

      // Update ticket payment status
      await supabase
        .from('tickets')
        .update({
          payment_status: 'pending',
          payment_amount: amount
        })
        .eq('id', ticketId);

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
      // Retrieve payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Update payment in database
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'succeeded',
          stripe_charge_id: paymentIntent.charges.data[0]?.id,
          payment_method: paymentIntent.payment_method_types[0],
          paid_at: new Date().toISOString(),
          metadata: {
            payment_intent_status: paymentIntent.status,
            charges: paymentIntent.charges.data
          }
        })
        .eq('stripe_payment_intent_id', paymentIntentId)
        .select()
        .single();

      if (paymentError) {
        throw paymentError;
      }

      // Update ticket payment status
      await supabase
        .from('tickets')
        .update({
          payment_status: 'paid'
        })
        .eq('id', payment.ticket_id);

      // Send payment confirmation email (non-blocking)
      const charge = paymentIntent.charges?.data?.[0];
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
          caseId: payment.ticket_id,
          last4: charge?.payment_method_details?.card?.last4,
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

      // Update ticket payment status back to unpaid
      await supabase
        .from('tickets')
        .update({
          payment_status: 'unpaid'
        })
        .eq('id', payment.ticket_id);

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

      // Update ticket payment status
      const ticketPaymentStatus = refundAmount === payment.amount ? 'refunded' : 'partial_refund';
      await supabase
        .from('tickets')
        .update({ payment_status: ticketPaymentStatus })
        .eq('id', payment.ticket_id);

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
   * Get payments for a ticket
   * @param {string} ticketId - Ticket ID
   * @returns {Array} List of payments
   */
  async getTicketPayments(ticketId) {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return payments;
    } catch (error) {
      console.error('Get ticket payments error:', error);
      throw error;
    }
  }

  /**
   * Get user payments
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} List of payments
   */
  async getUserPayments(userId, options = {}) {
    try {
      let query = supabase
        .from('payments')
        .select('*, tickets(ticket_number, violation_type)')
        .eq('user_id', userId);

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      query = query.order('created_at', { ascending: false });

      const { data: payments, error } = await query;

      if (error) throw error;
      return payments;
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

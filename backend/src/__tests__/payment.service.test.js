'use strict';

// Mock stripe before any requires
const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    cancel: jest.fn()
  },
  refunds: {
    create: jest.fn()
  }
};
jest.mock('stripe', () => jest.fn(() => mockStripe));

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() }
}));

jest.mock('../services/email.service', () => ({
  sendPaymentConfirmationEmail: jest.fn()
}));

const { supabase } = require('../config/supabase');
const { sendPaymentConfirmationEmail } = require('../services/email.service');
const paymentService = require('../services/payment.service');

// --- Supabase chain mock ---
const chain = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  limit: jest.fn(),
  order: jest.fn(),
  single: jest.fn(),
  maybeSingle: jest.fn()
};

function setupChain() {
  Object.keys(chain).forEach(k => chain[k].mockReturnValue(chain));
  supabase.from.mockReturnValue(chain);
}

beforeEach(() => {
  jest.resetAllMocks();
  setupChain();
});

// ---------------------------------------------------------------------------
// createPaymentIntent
// ---------------------------------------------------------------------------
describe('createPaymentIntent', () => {
  const params = { ticketId: 'ticket-1', userId: 'user-1', amount: 250 };

  test('throws when ticket not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    await expect(paymentService.createPaymentIntent(params)).rejects.toThrow(
      'Ticket not found or access denied'
    );
  });

  test('throws when payment already exists for ticket', async () => {
    // First single() → ticket found
    chain.single.mockResolvedValueOnce({ data: { id: 'ticket-1', user_id: 'user-1' }, error: null });
    // Second single() → existing payment found
    chain.single.mockResolvedValueOnce({ data: { id: 'pay-existing' }, error: null });

    await expect(paymentService.createPaymentIntent(params)).rejects.toThrow(
      'Payment already exists for this ticket'
    );
  });

  test('creates Stripe intent, saves payment record, returns clientSecret', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { id: 'ticket-1', user_id: 'user-1' }, error: null }) // ticket
      .mockResolvedValueOnce({ data: null, error: null }) // no existing payment
      .mockResolvedValueOnce({ data: { id: 'pay-new', ticket_id: 'ticket-1', amount: 250, user_id: 'user-1' }, error: null }); // inserted payment

    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test',
      client_secret: 'pi_test_secret',
      status: 'requires_payment_method'
    });

    const result = await paymentService.createPaymentIntent(params);

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 25000, currency: 'usd' })
    );
    expect(result.clientSecret).toBe('pi_test_secret');
    expect(result.paymentIntentId).toBe('pi_test');
    expect(result.payment).toBeDefined();
  });

  test('cancels Stripe intent when DB insert fails', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { id: 'ticket-1' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'db error' } });

    mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_test', client_secret: 'secret' });
    mockStripe.paymentIntents.cancel.mockResolvedValue({});

    await expect(paymentService.createPaymentIntent(params)).rejects.toBeDefined();
    expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_test');
  });
});

// ---------------------------------------------------------------------------
// confirmPayment
// ---------------------------------------------------------------------------
describe('confirmPayment', () => {
  test('updates payment to succeeded and triggers confirmation email', async () => {
    const mockCharge = { id: 'ch_1', payment_method_details: { card: { last4: '4242' } } };
    mockStripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      charges: { data: [mockCharge] },
      payment_method_types: ['card']
    });

    const payment = { id: 'pay-1', ticket_id: 'ticket-1', user_id: 'user-1', amount: 250 };
    chain.single.mockResolvedValueOnce({ data: payment, error: null }); // update payment
    chain.maybeSingle.mockResolvedValueOnce({ data: { full_name: 'John Doe', email: 'john@example.com' }, error: null }); // user profile

    const result = await paymentService.confirmPayment('pi_1');

    expect(result).toEqual(payment);
    expect(sendPaymentConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'john@example.com', name: 'John Doe' })
    );
  });

  test('does not call email when user profile not found', async () => {
    mockStripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      charges: { data: [] },
      payment_method_types: ['card']
    });

    chain.single.mockResolvedValueOnce({ data: { id: 'pay-1', ticket_id: 't1', user_id: 'u1', amount: 100 }, error: null });
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null }); // no user profile

    await paymentService.confirmPayment('pi_1');
    expect(sendPaymentConfirmationEmail).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handlePaymentFailure
// ---------------------------------------------------------------------------
describe('handlePaymentFailure', () => {
  test('updates payment to failed and reverts ticket to unpaid', async () => {
    const payment = { id: 'pay-1', ticket_id: 'ticket-1', status: 'failed' };
    chain.single.mockResolvedValueOnce({ data: payment, error: null });

    const result = await paymentService.handlePaymentFailure('pi_1', 'Card declined');

    expect(result).toEqual(payment);
    // Should call update on tickets to set payment_status=unpaid
    expect(supabase.from).toHaveBeenCalledWith('tickets');
  });

  test('throws when DB update fails', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'db error' } });
    await expect(paymentService.handlePaymentFailure('pi_bad')).rejects.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// processRefund
// ---------------------------------------------------------------------------
describe('processRefund', () => {
  test('throws when payment not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    await expect(paymentService.processRefund('pay-1')).rejects.toThrow('Payment not found');
  });

  test('throws when payment is not succeeded', async () => {
    chain.single.mockResolvedValueOnce({ data: { id: 'pay-1', status: 'pending', amount: 100 }, error: null });
    await expect(paymentService.processRefund('pay-1')).rejects.toThrow(
      'Only succeeded payments can be refunded'
    );
  });

  test('throws when refund amount exceeds payment amount', async () => {
    chain.single.mockResolvedValueOnce({
      data: { id: 'pay-1', status: 'succeeded', amount: 100, stripe_payment_intent_id: 'pi_1' },
      error: null
    });
    await expect(paymentService.processRefund('pay-1', 200)).rejects.toThrow(
      'Refund amount cannot exceed payment amount'
    );
  });

  test('sets payment status to "refunded" on full refund', async () => {
    const payment = { id: 'pay-1', status: 'succeeded', amount: 100, stripe_payment_intent_id: 'pi_1', ticket_id: 't1' };
    chain.single
      .mockResolvedValueOnce({ data: payment, error: null }) // get payment
      .mockResolvedValueOnce({ data: { id: 'ref-1', amount: 100 }, error: null }); // insert refund

    mockStripe.refunds.create.mockResolvedValue({ id: 're_1', status: 'succeeded' });

    const result = await paymentService.processRefund('pay-1', null);

    expect(result).toEqual({ id: 'ref-1', amount: 100 });
    // Full refund → status should be 'refunded'
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'refunded' }));
  });

  test('sets payment status to "succeeded" on partial refund', async () => {
    const payment = { id: 'pay-1', status: 'succeeded', amount: 100, stripe_payment_intent_id: 'pi_1', ticket_id: 't1' };
    chain.single
      .mockResolvedValueOnce({ data: payment, error: null })
      .mockResolvedValueOnce({ data: { id: 'ref-1', amount: 50 }, error: null });

    mockStripe.refunds.create.mockResolvedValue({ id: 're_1', status: 'succeeded' });

    await paymentService.processRefund('pay-1', 50);

    // Partial refund → payment status stays 'succeeded'
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'succeeded' }));
  });
});

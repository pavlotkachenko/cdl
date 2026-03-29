'use strict';

// Ensure stripe conditional guard passes in payment.service.js
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';

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
// createPaymentIntent — uses cases table and caseId param
// ---------------------------------------------------------------------------
describe('createPaymentIntent', () => {
  const params = { caseId: 'case-1', userId: 'user-1', amount: 250 };

  test('throws when case not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    await expect(paymentService.createPaymentIntent(params)).rejects.toThrow(
      'Case not found or access denied'
    );
  });

  test('throws when payment already exists for case', async () => {
    // First single() → case found
    chain.single.mockResolvedValueOnce({ data: { id: 'case-1', driver_id: 'user-1', case_number: 'CASE-001' }, error: null });
    // Second single() → existing payment found
    chain.single.mockResolvedValueOnce({ data: { id: 'pay-existing' }, error: null });

    await expect(paymentService.createPaymentIntent(params)).rejects.toThrow(
      'Payment already exists for this case'
    );
  });

  test('creates Stripe intent, saves payment record with case_id, returns clientSecret', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { id: 'case-1', driver_id: 'user-1', case_number: 'CASE-001' }, error: null }) // case lookup
      .mockResolvedValueOnce({ data: null, error: null }) // no existing payment
      .mockResolvedValueOnce({ data: { id: 'pay-new', case_id: 'case-1', amount: 250, user_id: 'user-1' }, error: null }); // inserted payment

    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test',
      client_secret: 'pi_test_secret',
      status: 'requires_payment_method'
    });

    const result = await paymentService.createPaymentIntent(params);

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 25000,
        currency: 'usd',
        metadata: expect.objectContaining({ caseId: 'case-1', userId: 'user-1' })
      })
    );
    expect(supabase.from).toHaveBeenCalledWith('cases');
    expect(result.clientSecret).toBe('pi_test_secret');
    expect(result.paymentIntentId).toBe('pi_test');
    expect(result.payment).toBeDefined();
  });

  test('cancels Stripe intent when DB insert fails', async () => {
    chain.single
      .mockResolvedValueOnce({ data: { id: 'case-1', driver_id: 'user-1', case_number: 'CASE-001' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'db error' } });

    mockStripe.paymentIntents.create.mockResolvedValue({ id: 'pi_test', client_secret: 'secret' });
    mockStripe.paymentIntents.cancel.mockResolvedValue({});

    await expect(paymentService.createPaymentIntent(params)).rejects.toBeDefined();
    expect(mockStripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_test');
  });

  test('never queries tickets table', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    await expect(paymentService.createPaymentIntent(params)).rejects.toBeDefined();
    const tables = supabase.from.mock.calls.map(c => c[0]);
    expect(tables).not.toContain('tickets');
  });
});

// ---------------------------------------------------------------------------
// confirmPayment
// ---------------------------------------------------------------------------
describe('confirmPayment', () => {
  test('updates payment to succeeded and triggers confirmation email', async () => {
    const mockCharge = {
      id: 'ch_1',
      receipt_url: 'https://stripe.com/receipt',
      payment_method_details: { card: { brand: 'visa', last4: '4242' } }
    };
    mockStripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      latest_charge: mockCharge,
      payment_method_types: ['card']
    });

    const payment = { id: 'pay-1', case_id: 'case-1', user_id: 'user-1', amount: 250 };
    chain.single.mockResolvedValueOnce({ data: payment, error: null }); // update payment
    chain.maybeSingle.mockResolvedValueOnce({ data: { full_name: 'John Doe', email: 'john@example.com' }, error: null }); // user profile

    const result = await paymentService.confirmPayment('pi_1');

    expect(result).toEqual(payment);
    expect(sendPaymentConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'john@example.com', name: 'John Doe' })
    );
  });

  test('uses latest_charge expand (not deprecated charges.data[])', async () => {
    mockStripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      latest_charge: { id: 'ch_1', payment_method_details: { card: { brand: 'visa', last4: '0000' } } },
      payment_method_types: ['card']
    });

    chain.single.mockResolvedValueOnce({ data: { id: 'pay-1', case_id: 'case-1', user_id: 'u1', amount: 100 }, error: null });
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await paymentService.confirmPayment('pi_1');

    expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_1', { expand: ['latest_charge'] });
  });

  test('does not call email when user profile not found', async () => {
    mockStripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      latest_charge: null,
      payment_method_types: ['card']
    });

    chain.single.mockResolvedValueOnce({ data: { id: 'pay-1', case_id: 'case-1', user_id: 'u1', amount: 100 }, error: null });
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await paymentService.confirmPayment('pi_1');
    expect(sendPaymentConfirmationEmail).not.toHaveBeenCalled();
  });

  test('falls back to update without card columns on PGRST204 error', async () => {
    mockStripe.paymentIntents.retrieve.mockResolvedValue({
      id: 'pi_1',
      status: 'succeeded',
      latest_charge: { id: 'ch_1', payment_method_details: { card: { brand: 'visa', last4: '4242' } } },
      payment_method_types: ['card']
    });

    // First update fails with PGRST204 (missing column — migration 026 not applied)
    chain.single
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST204', message: 'column not found' } })
      // Fallback update succeeds
      .mockResolvedValueOnce({ data: { id: 'pay-1', case_id: 'case-1', user_id: 'u1', amount: 100 }, error: null });
    chain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await paymentService.confirmPayment('pi_1');
    expect(result).toBeDefined();
    expect(chain.single).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// handlePaymentFailure — updates cases table (not tickets)
// ---------------------------------------------------------------------------
describe('handlePaymentFailure', () => {
  test('updates payment to failed', async () => {
    const payment = { id: 'pay-1', case_id: 'case-1', status: 'failed' };
    chain.single.mockResolvedValueOnce({ data: payment, error: null });

    const result = await paymentService.handlePaymentFailure('pi_1', 'Card declined');

    expect(result).toEqual(payment);
  });

  test('updates cases table payment_status to unpaid (never tickets)', async () => {
    const payment = { id: 'pay-1', case_id: 'case-1', status: 'failed' };
    chain.single.mockResolvedValueOnce({ data: payment, error: null });

    await paymentService.handlePaymentFailure('pi_1', 'Declined');

    const tables = supabase.from.mock.calls.map(c => c[0]);
    expect(tables).toContain('cases');
    expect(tables).not.toContain('tickets');
  });

  test('throws when DB update fails', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'db error' } });
    await expect(paymentService.handlePaymentFailure('pi_bad')).rejects.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// processRefund — updates cases table (not tickets)
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

  test('sets payment status to "refunded" on full refund and updates cases table', async () => {
    const payment = { id: 'pay-1', status: 'succeeded', amount: 100, stripe_payment_intent_id: 'pi_1', case_id: 'case-1' };
    chain.single
      .mockResolvedValueOnce({ data: payment, error: null }) // get payment
      .mockResolvedValueOnce({ data: { id: 'ref-1', amount: 100 }, error: null }); // insert refund

    mockStripe.refunds.create.mockResolvedValue({ id: 're_1', status: 'succeeded' });

    const result = await paymentService.processRefund('pay-1', null);

    expect(result).toEqual({ id: 'ref-1', amount: 100 });
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'refunded' }));
    // Must update cases table, not tickets
    const tables = supabase.from.mock.calls.map(c => c[0]);
    expect(tables).toContain('cases');
    expect(tables).not.toContain('tickets');
  });

  test('sets payment status to "succeeded" on partial refund', async () => {
    const payment = { id: 'pay-1', status: 'succeeded', amount: 100, stripe_payment_intent_id: 'pi_1', case_id: 'case-1' };
    chain.single
      .mockResolvedValueOnce({ data: payment, error: null })
      .mockResolvedValueOnce({ data: { id: 'ref-1', amount: 50 }, error: null });

    mockStripe.refunds.create.mockResolvedValue({ id: 're_1', status: 'succeeded' });

    await paymentService.processRefund('pay-1', 50);

    // Partial refund → payment status stays 'succeeded'
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'succeeded' }));
  });
});

// ---------------------------------------------------------------------------
// getCasePayments — replaces old getTicketPayments
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// getPaymentConfirmation — enriched confirmation data
// ---------------------------------------------------------------------------
describe('getPaymentConfirmation', () => {
  const paymentIntentId = 'pi_test_123';
  const userId = 'user-1';

  const mockPayment = {
    id: 'pay-1',
    user_id: 'user-1',
    case_id: 'case-1',
    amount: '450.00',
    currency: 'USD',
    status: 'succeeded',
    stripe_charge_id: 'ch_abc',
    stripe_payment_intent_id: 'pi_test_123',
    paid_at: '2026-03-18T15:42:00.000Z',
    card_brand: 'visa',
    card_last4: '4242',
  };

  const mockCase = {
    id: 'case-1',
    case_number: 'CASE-2026-000847',
    violation_type: 'speeding',
    violation_location: 'I-35 North, Texas',
    assigned_attorney_id: 'att-1',
  };

  test('returns enriched confirmation data on success', async () => {
    chain.single
      .mockResolvedValueOnce({ data: mockPayment, error: null })       // payment lookup
      .mockResolvedValueOnce({ data: mockCase, error: null })          // case lookup
      .mockResolvedValueOnce({ data: { full_name: 'Sarah Johnson' }, error: null }) // attorney
      .mockResolvedValueOnce({ data: { email: 'driver@test.com' }, error: null });  // driver

    const result = await paymentService.getPaymentConfirmation(paymentIntentId, userId);

    expect(result.amount).toBe(450);
    expect(result.currency).toBe('USD');
    expect(result.status).toBe('succeeded');
    expect(result.transaction_id).toBe('ch_abc');
    expect(result.stripe_payment_intent_id).toBe('pi_test_123');
    expect(result.card_brand).toBe('visa');
    expect(result.card_last4).toBe('4242');
    expect(result.case.case_number).toBe('CASE-2026-000847');
    expect(result.attorney).toEqual({ name: 'Sarah Johnson', initials: 'SJ' });
    expect(result.driver_email).toBe('driver@test.com');
  });

  test('throws Payment not found when payment does not exist', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    await expect(paymentService.getPaymentConfirmation(paymentIntentId, userId))
      .rejects.toThrow('Payment not found');
  });

  test('throws Access denied when user_id does not match', async () => {
    chain.single.mockResolvedValueOnce({ data: { ...mockPayment, user_id: 'other-user' }, error: null });

    await expect(paymentService.getPaymentConfirmation(paymentIntentId, userId))
      .rejects.toThrow('Access denied');
  });

  test('returns attorney null when no assigned_attorney_id', async () => {
    chain.single
      .mockResolvedValueOnce({ data: mockPayment, error: null })
      .mockResolvedValueOnce({ data: { ...mockCase, assigned_attorney_id: null }, error: null })
      .mockResolvedValueOnce({ data: { email: 'driver@test.com' }, error: null });

    const result = await paymentService.getPaymentConfirmation(paymentIntentId, userId);

    expect(result.attorney).toBeNull();
  });

  test('returns null card fields when card_brand and card_last4 are missing', async () => {
    const paymentNoCard = { ...mockPayment, card_brand: null, card_last4: null };
    chain.single
      .mockResolvedValueOnce({ data: paymentNoCard, error: null })
      .mockResolvedValueOnce({ data: mockCase, error: null })
      .mockResolvedValueOnce({ data: { full_name: 'Sarah Johnson' }, error: null })
      .mockResolvedValueOnce({ data: { email: 'driver@test.com' }, error: null });

    const result = await paymentService.getPaymentConfirmation(paymentIntentId, userId);

    expect(result.card_brand).toBeNull();
    expect(result.card_last4).toBeNull();
  });

  test('falls back to stripe_payment_intent_id when stripe_charge_id is null', async () => {
    const paymentNoCharge = { ...mockPayment, stripe_charge_id: null };
    chain.single
      .mockResolvedValueOnce({ data: paymentNoCharge, error: null })
      .mockResolvedValueOnce({ data: mockCase, error: null })
      .mockResolvedValueOnce({ data: { full_name: 'Sarah Johnson' }, error: null })
      .mockResolvedValueOnce({ data: { email: 'driver@test.com' }, error: null });

    const result = await paymentService.getPaymentConfirmation(paymentIntentId, userId);

    expect(result.transaction_id).toBe('pi_test_123');
  });
});

// ---------------------------------------------------------------------------
// getCasePayments — replaces old getTicketPayments
// ---------------------------------------------------------------------------
describe('getCasePayments', () => {
  test('queries payments table by case_id', async () => {
    const payments = [{ id: 'pay-1', case_id: 'case-1' }, { id: 'pay-2', case_id: 'case-1' }];
    chain.then = (onFulfilled) => Promise.resolve({ data: payments, error: null }).then(onFulfilled);

    const result = await paymentService.getCasePayments('case-1');

    expect(supabase.from).toHaveBeenCalledWith('payments');
    expect(chain.eq).toHaveBeenCalledWith('case_id', 'case-1');
    expect(result).toEqual(payments);
  });
});

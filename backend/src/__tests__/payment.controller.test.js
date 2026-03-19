'use strict';

jest.mock('../services/payment.service');
jest.mock('../services/email.service', () => ({
  sendInvoiceEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({ data: null, error: null }), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) }) },
}));
jest.mock('../services/webhook.service', () => ({
  dispatch: jest.fn(),
}));

const paymentService = require('../services/payment.service');
const controller = require('../controllers/payment.controller');

function makeReq(overrides = {}) {
  return { user: { id: 'user-1', role: 'driver' }, query: {}, params: {}, body: {}, ...overrides };
}

function makeRes() {
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => ({
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    pipe: jest.fn().mockReturnThis(),
    end: jest.fn(),
  }));
});

beforeEach(() => jest.resetAllMocks());

// ---------------------------------------------------------------------------
// getPaymentConfirmation
// ---------------------------------------------------------------------------
describe('getPaymentConfirmation', () => {
  test('returns 200 with confirmation data on success', async () => {
    const mockData = { amount: 450, status: 'succeeded', transaction_id: 'ch_1' };
    paymentService.getPaymentConfirmation.mockResolvedValue(mockData);

    const req = makeReq({ params: { paymentIntentId: 'pi_123' } });
    const res = makeRes();

    await controller.getPaymentConfirmation(req, res);

    expect(paymentService.getPaymentConfirmation).toHaveBeenCalledWith('pi_123', 'user-1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockData });
  });

  test('returns 404 when payment not found', async () => {
    paymentService.getPaymentConfirmation.mockRejectedValue(new Error('Payment not found'));

    const req = makeReq({ params: { paymentIntentId: 'pi_bad' } });
    const res = makeRes();

    await controller.getPaymentConfirmation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Payment not found' });
  });

  test('returns 403 when access denied', async () => {
    paymentService.getPaymentConfirmation.mockRejectedValue(new Error('Access denied'));

    const req = makeReq({ params: { paymentIntentId: 'pi_other' } });
    const res = makeRes();

    await controller.getPaymentConfirmation(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied' });
  });

  test('returns 500 on unknown error', async () => {
    paymentService.getPaymentConfirmation.mockRejectedValue(new Error('DB timeout'));

    const req = makeReq({ params: { paymentIntentId: 'pi_1' } });
    const res = makeRes();

    await controller.getPaymentConfirmation(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// downloadReceipt
// ---------------------------------------------------------------------------
describe('downloadReceipt', () => {
  test('redirects 302 when receipt_url exists', async () => {
    paymentService.getPayment.mockResolvedValue({
      id: 'pay-1',
      user_id: 'user-1',
      receipt_url: 'https://pay.stripe.com/receipts/abc',
    });

    const req = makeReq({ params: { id: 'pay-1' } });
    const res = makeRes();
    res.redirect = jest.fn();

    await controller.downloadReceipt(req, res);

    expect(res.redirect).toHaveBeenCalledWith(302, 'https://pay.stripe.com/receipts/abc');
  });

  test('generates PDF when no receipt_url', async () => {
    paymentService.getPayment.mockResolvedValue({
      id: 'pay-1',
      user_id: 'user-1',
      receipt_url: null,
      case_id: 'case-1',
      amount: '250.00',
      currency: 'USD',
      status: 'succeeded',
      stripe_charge_id: 'ch_1',
      paid_at: '2026-03-18T15:42:00Z',
      card_brand: 'visa',
      card_last4: '4242',
    });

    // Re-setup supabase mock chain (resetAllMocks clears it)
    const { supabase } = require('../config/supabase');
    const mockChain = { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), maybeSingle: jest.fn().mockResolvedValue({ data: { case_number: 'CASE-001' }, error: null }) };
    supabase.from.mockReturnValue(mockChain);

    const req = makeReq({ params: { id: 'pay-1' } });
    const res = makeRes();
    res.setHeader = jest.fn();
    res.redirect = jest.fn();

    await controller.downloadReceipt(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="receipt-pay-1.pdf"'
    );
    expect(res.redirect).not.toHaveBeenCalled();
  });

  test('returns 404 when payment not found', async () => {
    paymentService.getPayment.mockResolvedValue(null);

    const req = makeReq({ params: { id: 'pay-bad' } });
    const res = makeRes();

    await controller.downloadReceipt(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Payment not found' });
  });

  test('returns 403 when user does not own payment', async () => {
    paymentService.getPayment.mockResolvedValue({
      id: 'pay-1',
      user_id: 'other-user',
      receipt_url: null,
    });

    const req = makeReq({ params: { id: 'pay-1' } });
    const res = makeRes();

    await controller.downloadReceipt(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Access denied' });
  });
});

// ---------------------------------------------------------------------------
// getUserPayments (enhanced)
// ---------------------------------------------------------------------------
describe('getUserPayments', () => {
  test('passes all query params to service and returns data + pagination', async () => {
    const mockResult = {
      payments: [{ id: 'p1', amount: 100, status: 'succeeded' }],
      pagination: { page: 1, per_page: 10, total: 1, total_pages: 1 },
    };
    paymentService.getUserPayments.mockResolvedValue(mockResult);

    const req = makeReq({
      query: {
        status: 'succeeded',
        date_from: '2026-01-01',
        date_to: '2026-12-31',
        amount_min: '50',
        amount_max: '500',
        search: 'attorney',
        sort_by: 'amount',
        sort_dir: 'asc',
        page: '2',
        per_page: '25',
      },
    });
    const res = makeRes();

    await controller.getUserPayments(req, res);

    expect(paymentService.getUserPayments).toHaveBeenCalledWith('user-1', {
      status: 'succeeded',
      date_from: '2026-01-01',
      date_to: '2026-12-31',
      amount_min: 50,
      amount_max: 500,
      search: 'attorney',
      sort_by: 'amount',
      sort_dir: 'asc',
      page: 2,
      per_page: 25,
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: mockResult.payments,
      pagination: mockResult.pagination,
    });
  });

  test('uses defaults for missing query params', async () => {
    paymentService.getUserPayments.mockResolvedValue({ payments: [], pagination: { page: 1, per_page: 10, total: 0, total_pages: 0 } });

    const req = makeReq({ query: {} });
    const res = makeRes();

    await controller.getUserPayments(req, res);

    expect(paymentService.getUserPayments).toHaveBeenCalledWith('user-1', expect.objectContaining({
      sort_by: 'created_at',
      sort_dir: 'desc',
      page: 1,
      per_page: 10,
    }));
  });

  test('returns 500 on service error', async () => {
    paymentService.getUserPayments.mockRejectedValue(new Error('DB timeout'));

    const req = makeReq();
    const res = makeRes();

    await controller.getUserPayments(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });
});

// ---------------------------------------------------------------------------
// getUserPaymentStats
// ---------------------------------------------------------------------------
describe('getUserPaymentStats', () => {
  test('returns stats from service', async () => {
    const mockStats = {
      total_amount: 1000,
      paid_amount: 800,
      pending_amount: 200,
      transaction_count: 5,
      currency: 'USD',
    };
    paymentService.getUserPaymentStats.mockResolvedValue(mockStats);

    const req = makeReq();
    const res = makeRes();

    await controller.getUserPaymentStats(req, res);

    expect(paymentService.getUserPaymentStats).toHaveBeenCalledWith('user-1');
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockStats });
  });

  test('returns 500 on service error', async () => {
    paymentService.getUserPaymentStats.mockRejectedValue(new Error('fail'));

    const req = makeReq();
    const res = makeRes();

    await controller.getUserPaymentStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ---------------------------------------------------------------------------
// retryPayment
// ---------------------------------------------------------------------------
describe('retryPayment', () => {
  test('returns 201 with payment and client_secret on success', async () => {
    const mockResult = { payment: { id: 'p2' }, client_secret: 'pi_new_secret' };
    paymentService.retryPayment.mockResolvedValue(mockResult);

    const req = makeReq({ params: { id: 'p1' } });
    const res = makeRes();

    await controller.retryPayment(req, res);

    expect(paymentService.retryPayment).toHaveBeenCalledWith('p1', 'user-1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: mockResult });
  });

  test('returns 403 when payment not found or access denied', async () => {
    paymentService.retryPayment.mockRejectedValue(new Error('Payment not found or access denied'));

    const req = makeReq({ params: { id: 'p-bad' } });
    const res = makeRes();

    await controller.retryPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('returns 400 for invalid status', async () => {
    paymentService.retryPayment.mockRejectedValue(new Error('Only failed payments can be retried'));

    const req = makeReq({ params: { id: 'p1' } });
    const res = makeRes();

    await controller.retryPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 409 for existing payment conflict', async () => {
    paymentService.retryPayment.mockRejectedValue(new Error('A pending or succeeded payment already exists for this case'));

    const req = makeReq({ params: { id: 'p1' } });
    const res = makeRes();

    await controller.retryPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('returns 429 for rate limiting', async () => {
    paymentService.retryPayment.mockRejectedValue(new Error('Please wait at least 60 seconds between retry attempts'));

    const req = makeReq({ params: { id: 'p1' } });
    const res = makeRes();

    await controller.retryPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  test('returns 500 for unknown errors', async () => {
    paymentService.retryPayment.mockRejectedValue(new Error('Something unexpected'));

    const req = makeReq({ params: { id: 'p1' } });
    const res = makeRes();

    await controller.retryPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

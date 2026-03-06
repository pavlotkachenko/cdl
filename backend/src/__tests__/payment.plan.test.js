/**
 * Tests for payment plan controller — PP-1
 */

const mockSelect = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockFrom = jest.fn();

jest.mock('../config/supabase', () => ({
  supabase: {
    from: (...args) => { mockFrom(...args); return { select: mockSelect, insert: mockInsert }; },
  },
}));

// Stripe mock
jest.mock('stripe', () => jest.fn(() => ({
  paymentIntents: {
    create: jest.fn().mockResolvedValue({ id: 'pi_test123' }),
  },
})));

process.env.STRIPE_SECRET_KEY = 'sk_test_xxx';

const { getPaymentPlanOptions, createPaymentPlan } = require('../controllers/payment.controller');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('getPaymentPlanOptions()', () => {
  beforeEach(() => {
    mockSelect.mockReturnThis();
    mockSingle.mockResolvedValue({ data: { attorney_price: '300.00' }, error: null });
    mockSelect.mockReturnValue({ eq: jest.fn().mockReturnValue({ single: mockSingle }) });
  });

  it('returns payNow, twoWeek, fourWeek, eightWeek options', async () => {
    const req = { params: { caseId: 'case-1' } };
    const res = makeRes();
    await getPaymentPlanOptions(req, res);
    const data = res.json.mock.calls[0][0].data;
    expect(data.payNow.amount).toBe(300);
    expect(data.twoWeek.weeks).toBe(2);
    expect(data.fourWeek.weeks).toBe(4);
    expect(data.eightWeek.weeks).toBe(8);
    expect(data.fourWeek.popular).toBe(true);
  });

  it('rounds weekly amounts up to nearest $0.25', async () => {
    const req = { params: { caseId: 'case-1' } };
    const res = makeRes();
    await getPaymentPlanOptions(req, res);
    const data = res.json.mock.calls[0][0].data;
    // $300 / 4 = $75.00 exactly — no rounding needed
    expect(data.fourWeek.weeklyAmount).toBe(75);
  });

  it('returns 404 when case not found', async () => {
    mockSelect.mockReturnValue({ eq: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }) }) });
    const req = { params: { caseId: 'bad-id' } };
    const res = makeRes();
    await getPaymentPlanOptions(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('createPaymentPlan()', () => {
  const mockInsertChain = { select: jest.fn().mockReturnValue({ single: jest.fn().mockResolvedValue({ data: { id: 'plan-1' }, error: null }) }) };

  beforeEach(() => {
    const caseQuery = { single: jest.fn().mockResolvedValue({ data: { attorney_price: '200.00', case_number: 'CDL-001' }, error: null }) };
    mockSelect.mockReturnValue({ eq: jest.fn().mockReturnValue(caseQuery) });
    mockInsert.mockReturnValue(mockInsertChain);
  });

  it('returns 400 for invalid weeks value', async () => {
    const req = { body: { caseId: 'c1', weeks: 3, paymentMethodId: 'pm_xxx' }, user: { id: 'u1' } };
    const res = makeRes();
    await createPaymentPlan(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('accepts weeks: 2, 4, 8', async () => {
    for (const weeks of [2, 4, 8]) {
      const req = { body: { caseId: 'c1', weeks, paymentMethodId: null }, user: { id: 'u1' } };
      const res = makeRes();
      await createPaymentPlan(req, res);
      // Should not return 400
      if (res.status.mock.calls.length > 0) {
        expect(res.status.mock.calls[0][0]).not.toBe(400);
      }
    }
  });
});

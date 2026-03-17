'use strict';

/**
 * Tests for revenue.controller.js
 *
 * Covers all 7 exports: getRevenueMetrics, getDailyRevenue, getRevenueByMethod,
 * getRevenueByAttorney, getRecentTransactions, getMonthlyGrowth, exportToCsv.
 *
 * Each endpoint tries the payments table first and falls back to the cases table
 * when payments are unavailable. Tests cover happy-path (payments), fallback (cases),
 * and 500 error cases.
 */

jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));

const { supabase } = require('../config/supabase');
const logger = require('../utils/logger');
const controller = require('../controllers/revenue.controller');

// ── Helpers ──────────────────────────────────────────────────────────────────

let chain;
function buildChain(result = { data: [], error: null }) {
  chain = {};
  ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(chain);
}

/**
 * Build a chain whose first N from() calls reject (simulating payments table missing),
 * and subsequent calls resolve with `fallbackResult`.
 */
function buildFallbackChain(rejectCount, fallbackResult = { data: [], error: null }) {
  let callIndex = 0;
  supabase.from.mockImplementation(() => {
    callIndex++;
    const ch = {};
    ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
      ch[m] = jest.fn().mockReturnValue(ch);
    });
    ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
    ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

    if (callIndex <= rejectCount) {
      // Payments table → error triggers queryPayments() to return null
      ch.then = (onFulfilled, onRejected) =>
        Promise.resolve({ data: null, error: { message: 'relation "payments" does not exist' } })
          .then(onFulfilled, onRejected);
    } else {
      ch.then = (onFulfilled, onRejected) =>
        Promise.resolve(fallbackResult).then(onFulfilled, onRejected);
    }
    return ch;
  });
}

function makeReq(overrides = {}) {
  return { user: { id: 'admin-1', role: 'admin' }, query: {}, params: {}, body: {}, ...overrides };
}

function makeRes() {
  const res = { json: jest.fn(), status: jest.fn(), setHeader: jest.fn(), send: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.resetAllMocks();
  buildChain();
});

// ── getRevenueMetrics ────────────────────────────────────────────────────────

describe('getRevenueMetrics()', () => {
  it('returns metrics from payments table when available', async () => {
    const payments = [
      { amount: 5000, status: 'succeeded', payment_method: 'card', created_at: '2026-03-10T00:00:00Z' },
      { amount: 3000, status: 'succeeded', payment_method: 'card', created_at: '2026-03-12T00:00:00Z' },
      { amount: 1000, status: 'refunded', payment_method: 'card', created_at: '2026-03-11T00:00:00Z' },
      { amount: 2000, status: 'failed', payment_method: 'card', created_at: '2026-03-11T00:00:00Z' },
    ];
    buildChain({ data: payments, error: null });

    const req = makeReq();
    const res = makeRes();
    await controller.getRevenueMetrics(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total_revenue: 8000,
        refunded_amount: 1000,
        total_transactions: 4,
        failed_transactions: 1,
        success_rate: 50, // 2 succeeded / 4 total
        average_transaction: 4000, // 8000 / 2
      }),
    );
  });

  it('falls back to cases table when payments query fails', async () => {
    const cases = [
      { fee_amount: 500, fee_status: 'paid', created_at: '2026-02-01T00:00:00Z' },
      { fee_amount: 700, fee_status: 'paid', created_at: '2026-02-15T00:00:00Z' },
      { fee_amount: 300, fee_status: 'pending', created_at: '2026-02-20T00:00:00Z' },
    ];
    buildFallbackChain(1, { data: cases, error: null });

    const req = makeReq();
    const res = makeRes();
    await controller.getRevenueMetrics(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total_revenue: 1200,
        refunded_amount: 0,
        total_transactions: 3,
        failed_transactions: 0,
        average_transaction: 600,
      }),
    );
  });

  it('returns 500 when both payments and cases fail', async () => {
    supabase.from.mockImplementation(() => {
      throw new Error('connection lost');
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getRevenueMetrics(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'REVENUE_METRICS_ERROR' }),
      }),
    );
    expect(logger.error).toHaveBeenCalled();
  });
});

// ── getDailyRevenue ──────────────────────────────────────────────────────────

describe('getDailyRevenue()', () => {
  it('returns daily grouped revenue from payments', async () => {
    const payments = [
      { amount: 1000, status: 'succeeded', created_at: '2026-03-10T10:00:00Z' },
      { amount: 2000, status: 'succeeded', created_at: '2026-03-10T14:00:00Z' },
      { amount: 500, status: 'succeeded', created_at: '2026-03-11T08:00:00Z' },
      { amount: 800, status: 'failed', created_at: '2026-03-11T09:00:00Z' },
    ];
    buildChain({ data: payments, error: null });

    const req = makeReq();
    const res = makeRes();
    await controller.getDailyRevenue(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: '2026-03-10', revenue: 3000, transactions: 2 });
    expect(result[1]).toEqual({ date: '2026-03-11', revenue: 500, transactions: 1 });
  });

  it('falls back to cases table', async () => {
    const cases = [
      { fee_amount: 400, fee_status: 'paid', created_at: '2026-03-05T00:00:00Z' },
      { fee_amount: 600, fee_status: 'paid', created_at: '2026-03-05T12:00:00Z' },
    ];
    buildFallbackChain(1, { data: cases, error: null });

    const req = makeReq();
    const res = makeRes();
    await controller.getDailyRevenue(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result).toEqual([{ date: '2026-03-05', revenue: 1000, transactions: 2 }]);
  });

  it('returns 500 on error', async () => {
    supabase.from.mockImplementation(() => { throw new Error('db down'); });

    const req = makeReq();
    const res = makeRes();
    await controller.getDailyRevenue(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'DAILY_REVENUE_ERROR' }) }),
    );
  });
});

// ── getRevenueByMethod ───────────────────────────────────────────────────────

describe('getRevenueByMethod()', () => {
  it('groups succeeded payments by payment_method', async () => {
    const payments = [
      { amount: 3000, status: 'succeeded', payment_method: 'card', created_at: '2026-03-01T00:00:00Z' },
      { amount: 2000, status: 'succeeded', payment_method: 'ach', created_at: '2026-03-02T00:00:00Z' },
      { amount: 5000, status: 'succeeded', payment_method: 'card', created_at: '2026-03-03T00:00:00Z' },
      { amount: 1000, status: 'failed', payment_method: 'card', created_at: '2026-03-04T00:00:00Z' },
    ];
    buildChain({ data: payments, error: null });

    const req = makeReq();
    const res = makeRes();
    await controller.getRevenueByMethod(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: 'card', revenue: 8000 }),
        expect.objectContaining({ method: 'ach', revenue: 2000 }),
      ]),
    );
    // Verify percentages add up to 100
    const totalPct = result.reduce((s, r) => s + r.percentage, 0);
    expect(totalPct).toBe(100);
  });

  it('falls back to single "case_fee" bucket from cases table', async () => {
    const cases = [
      { fee_amount: 1000, fee_status: 'paid', created_at: '2026-03-01T00:00:00Z' },
      { fee_amount: 500, fee_status: 'paid', created_at: '2026-03-02T00:00:00Z' },
    ];
    buildFallbackChain(1, { data: cases, error: null });

    const req = makeReq();
    const res = makeRes();
    await controller.getRevenueByMethod(req, res);

    expect(res.json).toHaveBeenCalledWith([
      { method: 'case_fee', revenue: 1500, percentage: 100 },
    ]);
  });
});

// ── getRevenueByAttorney ─────────────────────────────────────────────────────

describe('getRevenueByAttorney()', () => {
  it('groups revenue by attorney from payments + cases + users joins', async () => {
    // Call 1: payments table succeeds
    // Call 2: cases table (for attorney lookup)
    // Call 3: users table (for names)
    let callCount = 0;
    supabase.from.mockImplementation((table) => {
      callCount++;
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (table === 'payments') {
        const payments = [
          { amount: 5000, status: 'succeeded', case_id: 'case-1', created_at: '2026-03-01T00:00:00Z' },
          { amount: 3000, status: 'succeeded', case_id: 'case-2', created_at: '2026-03-02T00:00:00Z' },
        ];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: payments, error: null }).then(onFulfilled, onRejected);
      } else if (table === 'cases') {
        const cases = [
          { id: 'case-1', assigned_attorney_id: 'att-1' },
          { id: 'case-2', assigned_attorney_id: 'att-1' },
        ];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: cases, error: null }).then(onFulfilled, onRejected);
      } else if (table === 'users') {
        const users = [{ id: 'att-1', full_name: 'Jane Smith' }];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: users, error: null }).then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getRevenueByAttorney(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result).toEqual([
      expect.objectContaining({
        attorney_id: 'att-1',
        attorney_name: 'Jane Smith',
        revenue: 8000,
        transactions: 2,
      }),
    ]);
  });

  it('falls back to cases table with attorney names', async () => {
    let callCount = 0;
    supabase.from.mockImplementation((table) => {
      callCount++;
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (callCount === 1) {
        // First call: payments → error (triggers fallback)
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: null, error: { message: 'no payments' } }).then(onFulfilled, onRejected);
      } else if (table === 'cases') {
        const cases = [
          { assigned_attorney_id: 'att-2', fee_amount: 1500, fee_status: 'paid', created_at: '2026-03-01T00:00:00Z' },
        ];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: cases, error: null }).then(onFulfilled, onRejected);
      } else if (table === 'users') {
        const users = [{ id: 'att-2', full_name: 'John Doe' }];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: users, error: null }).then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getRevenueByAttorney(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result).toEqual([
      expect.objectContaining({
        attorney_id: 'att-2',
        attorney_name: 'John Doe',
        revenue: 1500,
        transactions: 1,
      }),
    ]);
  });

  it('returns 500 on error', async () => {
    supabase.from.mockImplementation(() => { throw new Error('kaboom'); });

    const req = makeReq();
    const res = makeRes();
    await controller.getRevenueByAttorney(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'REVENUE_BY_ATTORNEY_ERROR' }) }),
    );
  });
});

// ── getRecentTransactions ────────────────────────────────────────────────────

describe('getRecentTransactions()', () => {
  it('returns last 20 transactions from payments with user names', async () => {
    let callCount = 0;
    supabase.from.mockImplementation((table) => {
      callCount++;
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (table === 'payments') {
        const payments = [
          { id: 'p-1', user_id: 'u-1', amount: 5000, status: 'succeeded', payment_method: 'card', created_at: '2026-03-10T00:00:00Z' },
        ];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: payments, error: null }).then(onFulfilled, onRejected);
      } else if (table === 'users') {
        const users = [{ id: 'u-1', full_name: 'Alice Driver' }];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: users, error: null }).then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getRecentTransactions(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        date: '2026-03-10T00:00:00Z',
        client: 'Alice Driver',
        amount: 5000,
        status: 'succeeded',
        method: 'card',
      }),
    ]);
  });

  it('falls back to cases table', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (callCount === 1) {
        // payments → error
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: null, error: { message: 'no payments' } }).then(onFulfilled, onRejected);
      } else {
        // cases table
        const cases = [
          { id: 'c-1', customer_name: 'Bob Fleet', fee_amount: 800, fee_status: 'paid', created_at: '2026-03-08T00:00:00Z' },
        ];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: cases, error: null }).then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getRecentTransactions(req, res);

    expect(res.json).toHaveBeenCalledWith([
      expect.objectContaining({
        client: 'Bob Fleet',
        amount: 800,
        status: 'paid',
        method: 'case_fee',
      }),
    ]);
  });

  it('returns 500 on error', async () => {
    supabase.from.mockImplementation(() => { throw new Error('fail'); });

    const req = makeReq();
    const res = makeRes();
    await controller.getRecentTransactions(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'RECENT_TRANSACTIONS_ERROR' }) }),
    );
  });
});

// ── getMonthlyGrowth ─────────────────────────────────────────────────────────

describe('getMonthlyGrowth()', () => {
  it('calculates growth rate from payments table', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (callCount === 1) {
        // Current month payments
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: [{ amount: 10000, status: 'succeeded', created_at: '2026-03-05T00:00:00Z' }], error: null })
            .then(onFulfilled, onRejected);
      } else if (callCount === 2) {
        // Previous month payments
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: [{ amount: 8000, status: 'succeeded', created_at: '2026-02-15T00:00:00Z' }], error: null })
            .then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getMonthlyGrowth(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.current_month_revenue).toBe(10000);
    expect(result.previous_month_revenue).toBe(8000);
    expect(result.growth_rate).toBe(25); // (10000-8000)/8000 * 100 = 25
    expect(result.current_month_transactions).toBe(1);
    expect(result.previous_month_transactions).toBe(1);
  });

  it('returns 100% growth when previous month has zero revenue', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (callCount === 1) {
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: [{ amount: 5000, status: 'succeeded', created_at: '2026-03-01T00:00:00Z' }], error: null })
            .then(onFulfilled, onRejected);
      } else if (callCount === 2) {
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getMonthlyGrowth(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.growth_rate).toBe(100);
  });

  it('falls back to cases table when payments fail', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (callCount <= 2) {
        // Both payment queries fail
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: null, error: { message: 'no payments' } }).then(onFulfilled, onRejected);
      } else if (callCount === 3) {
        // Current month cases
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: [{ fee_amount: 2000, fee_status: 'paid', created_at: '2026-03-02T00:00:00Z' }], error: null })
            .then(onFulfilled, onRejected);
      } else if (callCount === 4) {
        // Previous month cases
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: [{ fee_amount: 1000, fee_status: 'paid', created_at: '2026-02-10T00:00:00Z' }], error: null })
            .then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getMonthlyGrowth(req, res);

    const result = res.json.mock.calls[0][0];
    expect(result.current_month_revenue).toBe(2000);
    expect(result.previous_month_revenue).toBe(1000);
    expect(result.growth_rate).toBe(100); // (2000-1000)/1000 * 100
  });

  it('returns 500 on error', async () => {
    supabase.from.mockImplementation(() => { throw new Error('nope'); });

    const req = makeReq();
    const res = makeRes();
    await controller.getMonthlyGrowth(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'MONTHLY_GROWTH_ERROR' }) }),
    );
  });
});

// ── exportToCsv ──────────────────────────────────────────────────────────────

describe('exportToCsv()', () => {
  it('returns CSV with correct headers and content type from payments', async () => {
    let callCount = 0;
    supabase.from.mockImplementation((table) => {
      callCount++;
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (table === 'payments') {
        const payments = [
          { id: 'p-1', user_id: 'u-1', case_id: 'c-1', amount: 5000, status: 'succeeded', payment_method: 'card', created_at: '2026-03-10T00:00:00Z' },
        ];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: payments, error: null }).then(onFulfilled, onRejected);
      } else if (table === 'users') {
        const users = [{ id: 'u-1', full_name: 'Test User' }];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: users, error: null }).then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.exportToCsv(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="revenue-export.csv"');

    const csv = res.send.mock.calls[0][0];
    const lines = csv.split('\n');
    expect(lines[0]).toBe('date,transaction_id,client,case_id,amount_cents,status,payment_method');
    expect(lines).toHaveLength(2); // header + 1 data row
    expect(lines[1]).toContain('2026-03-10');
    expect(lines[1]).toContain('Test User');
  });

  it('falls back to cases table for CSV export', async () => {
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (callCount === 1) {
        // payments → empty (triggers fallback via payments.length === 0)
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
      } else {
        // cases
        const cases = [
          { id: 'c-5', customer_name: 'Fallback Client', fee_amount: 750, fee_status: 'paid', created_at: '2026-03-04T00:00:00Z' },
        ];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: cases, error: null }).then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.exportToCsv(req, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    const csv = res.send.mock.calls[0][0];
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Fallback Client');
    expect(lines[1]).toContain('case_fee');
  });

  it('escapes CSV values containing commas or quotes', async () => {
    supabase.from.mockImplementation((table) => {
      const ch = {};
      ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit', 'gte', 'lte', 'in'].forEach(m => {
        ch[m] = jest.fn().mockReturnValue(ch);
      });
      ch.single = jest.fn().mockResolvedValue({ data: null, error: null });
      ch.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

      if (table === 'payments') {
        const payments = [
          { id: 'p-2', user_id: 'u-2', case_id: 'c-2', amount: 100, status: 'succeeded', payment_method: 'card', created_at: '2026-03-01T00:00:00Z' },
        ];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: payments, error: null }).then(onFulfilled, onRejected);
      } else if (table === 'users') {
        // Name with a comma to test CSV escaping
        const users = [{ id: 'u-2', full_name: 'Doe, Jane "JD"' }];
        ch.then = (onFulfilled, onRejected) =>
          Promise.resolve({ data: users, error: null }).then(onFulfilled, onRejected);
      }
      return ch;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.exportToCsv(req, res);

    const csv = res.send.mock.calls[0][0];
    // The name contains comma and quotes, so should be escaped
    expect(csv).toContain('"Doe, Jane ""JD"""');
  });

  it('returns 500 on error', async () => {
    supabase.from.mockImplementation(() => { throw new Error('export failed'); });

    const req = makeReq();
    const res = makeRes();
    await controller.exportToCsv(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'EXPORT_CSV_ERROR' }) }),
    );
  });
});

'use strict';

// ============================================================
// Tests for canAccessCase middleware
// ============================================================

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require('../config/supabase');
const { canAccessCase } = require('../middleware/auth');

// ============================================================
// Helpers
// ============================================================
let chain;

function buildChain() {
  chain = {};
  const plain = ['select', 'eq', 'neq', 'in', 'is', 'order', 'limit'];
  plain.forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve({ data: null, error: null }).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(chain);
}

function makeReq(overrides = {}) {
  return {
    user: { id: 'user-1', role: 'driver' },
    params: { id: 'case-1' },
    ...overrides,
  };
}

function makeRes() {
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.resetAllMocks();
  buildChain();
});

// ============================================================
// canAccessCase
// ============================================================
describe('canAccessCase', () => {
  test('returns 400 when case ID is missing', async () => {
    const req = makeReq({ params: {} });
    const res = makeRes();
    const next = jest.fn();

    await canAccessCase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('allows admin to access any case without DB lookup', async () => {
    const req = makeReq({ user: { id: 'admin-1', role: 'admin' } });
    const res = makeRes();
    const next = jest.fn();

    await canAccessCase(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('allows driver to access their own case (driver_id match)', async () => {
    chain.single.mockResolvedValue({
      data: { driver_id: 'user-1', assigned_operator_id: null, assigned_attorney_id: null },
      error: null,
    });

    const req = makeReq({ user: { id: 'user-1', role: 'driver' } });
    const res = makeRes();
    const next = jest.fn();

    await canAccessCase(req, res, next);

    expect(next).toHaveBeenCalled();
    // Verify correct columns were selected
    expect(chain.select).toHaveBeenCalledWith('driver_id, assigned_operator_id, assigned_attorney_id');
  });

  test('allows operator to access assigned case (assigned_operator_id match)', async () => {
    chain.single.mockResolvedValue({
      data: { driver_id: 'drv-1', assigned_operator_id: 'op-1', assigned_attorney_id: null },
      error: null,
    });

    const req = makeReq({ user: { id: 'op-1', role: 'operator' } });
    const res = makeRes();
    const next = jest.fn();

    await canAccessCase(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('allows attorney to access assigned case (assigned_attorney_id match)', async () => {
    chain.single.mockResolvedValue({
      data: { driver_id: 'drv-1', assigned_operator_id: 'op-1', assigned_attorney_id: 'att-1' },
      error: null,
    });

    const req = makeReq({ user: { id: 'att-1', role: 'attorney' } });
    const res = makeRes();
    const next = jest.fn();

    await canAccessCase(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('returns 403 for unrelated user', async () => {
    chain.single.mockResolvedValue({
      data: { driver_id: 'drv-1', assigned_operator_id: 'op-1', assigned_attorney_id: 'att-1' },
      error: null,
    });

    const req = makeReq({ user: { id: 'other-user', role: 'driver' } });
    const res = makeRes();
    const next = jest.fn();

    await canAccessCase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 404 for non-existent case', async () => {
    chain.single.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    });

    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await canAccessCase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 500 when supabase throws', async () => {
    chain.single.mockRejectedValue(new Error('DB connection failed'));

    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    await canAccessCase(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(next).not.toHaveBeenCalled();
  });
});

/**
 * Tests for requireSubscription middleware — PL-3
 */

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require('../config/supabase');
const { requireSubscription } = require('../middleware/auth');

// ─── Chain factory ───────────────────────────────────────────────────────────

function makeChain(result = { data: [], error: null }) {
  const c = {};
  ['select', 'eq', 'in', 'limit'].forEach(m => {
    c[m] = jest.fn().mockReturnValue(c);
  });
  c.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(c);
  return c;
}

function makeRes() {
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => jest.resetAllMocks());

describe('requireSubscription middleware', () => {
  it('calls next() when user has an active subscription', async () => {
    makeChain({ data: [{ id: 'sub-1', status: 'active' }], error: null });
    const req = { user: { id: 'u1' } };
    const res = makeRes();
    const next = jest.fn();

    await requireSubscription(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 402 when no active subscription found', async () => {
    makeChain({ data: [], error: null });
    const req = { user: { id: 'u1' } };
    const res = makeRes();
    const next = jest.fn();

    await requireSubscription(req, res, next);

    expect(res.status).toHaveBeenCalledWith(402);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'SUBSCRIPTION_REQUIRED' }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when req.user is missing', async () => {
    const req = {};
    const res = makeRes();
    const next = jest.fn();

    await requireSubscription(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 402 for canceled or expired subscriptions (not in allowed statuses)', async () => {
    // DB query filters by ['active','trialing'] so canceled returns []
    makeChain({ data: [], error: null });
    const req = { user: { id: 'u1' } };
    const res = makeRes();
    const next = jest.fn();

    await requireSubscription(req, res, next);

    expect(res.status).toHaveBeenCalledWith(402);
  });
});

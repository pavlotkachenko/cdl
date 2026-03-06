/**
 * Tests for subscription.service.js
 *
 * Stripe is not configured (no STRIPE_SECRET_KEY) so all paid-plan paths
 * fall through to the direct DB-insert branch, making tests fully offline.
 */

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require('../config/supabase');

// Ensure Stripe is disabled so the service takes the DB path for all plans
delete process.env.STRIPE_SECRET_KEY;

// Set plan price IDs used in tests
process.env.STRIPE_PRICE_BASIC = 'price_basic_monthly';
process.env.STRIPE_PRICE_PREMIUM = 'price_premium_monthly';

// Required AFTER env setup so module-level `stripe = null`
const {
  PLANS,
  getPlans,
  getCurrentSubscription,
  createCheckoutSession,
  cancelSubscription,
  handleWebhookEvent,
} = require('../services/subscription.service');

// ─── Chain factory ───────────────────────────────────────────────────────────

function makeChain(defaultResult = { data: null, error: null }) {
  const c = {};
  ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'order', 'limit'].forEach(m => {
    c[m] = jest.fn().mockReturnValue(c);
  });
  c.single      = jest.fn().mockResolvedValue(defaultResult);
  c.maybeSingle = jest.fn().mockResolvedValue(defaultResult);
  c.then = (onFulfilled, onRejected) =>
    Promise.resolve(defaultResult).then(onFulfilled, onRejected);
  return c;
}

const MOCK_SUB_ROW = {
  id: 'sub-1',
  user_id: 'user-1',
  status: 'active',
  plan_name: 'basic',
  price_per_month: '29.00',
  customer_type: 'subscriber_driver',
  start_date: '2025-01-01',
  end_date: '2025-02-01',
  created_at: '2025-01-01T00:00:00Z',
};

let userChain, subChain;

beforeEach(() => {
  jest.resetAllMocks();
  userChain = makeChain({ data: { role: 'driver' }, error: null });
  subChain  = makeChain({ data: [], error: null });

  supabase.from.mockImplementation(table =>
    table === 'users' ? userChain : subChain,
  );
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('getPlans()', () => {
  it('returns 3 plans with required shape', () => {
    const plans = getPlans();
    expect(plans).toHaveLength(3);
    expect(plans[0]).toMatchObject({ id: 'free', price: 0, features: expect.any(Array) });
    expect(plans[1]).toMatchObject({ id: 'basic', price: 29, recommended: true });
    expect(plans[2]).toMatchObject({ id: 'premium', price: 79 });
  });
});

describe('getCurrentSubscription()', () => {
  it('returns mapped subscription when an active row exists', async () => {
    subChain.then = (onFulfilled) =>
      Promise.resolve({ data: [MOCK_SUB_ROW], error: null }).then(onFulfilled);

    const result = await getCurrentSubscription('user-1');
    expect(result).toMatchObject({
      id: 'sub-1',
      status: 'active',
      plan_name: 'basic',
      price_per_month: 29,
      cancel_at_period_end: false,
    });
  });

  it('returns null when no active subscription exists', async () => {
    subChain.then = (onFulfilled) =>
      Promise.resolve({ data: [], error: null }).then(onFulfilled);

    const result = await getCurrentSubscription('user-2');
    expect(result).toBeNull();
  });
});

describe('createCheckoutSession()', () => {
  it('activates free plan directly in DB and returns successUrl', async () => {
    const newRow = { ...MOCK_SUB_ROW, plan_name: 'free', price_per_month: '0.00' };
    subChain.single.mockResolvedValue({ data: newRow, error: null });

    const result = await createCheckoutSession(
      'user-1', 'price_free', 'http://app/success', 'http://app/cancel',
    );

    expect(subChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ plan_name: 'free', status: 'active', price_per_month: 0 }),
    );
    expect(result.url).toBe('http://app/success');
    expect(result.subscription).toMatchObject({ plan_name: 'free' });
  });

  it('activates paid plan via DB when Stripe is not configured', async () => {
    const newRow = { ...MOCK_SUB_ROW, plan_name: 'basic' };
    subChain.single.mockResolvedValue({ data: newRow, error: null });

    const result = await createCheckoutSession(
      'user-1', 'price_basic_monthly', 'http://app/success', 'http://app/cancel',
    );

    expect(subChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ plan_name: 'basic', price_per_month: 29 }),
    );
    expect(result.subscription).toMatchObject({ plan_name: 'basic' });
  });

  it('throws when priceId does not match any plan', async () => {
    await expect(
      createCheckoutSession('user-1', 'price_unknown', 'http://app/success', 'http://app/cancel'),
    ).rejects.toThrow('Invalid plan selected');
  });
});

describe('cancelSubscription()', () => {
  it('updates status to canceled and returns mapped subscription', async () => {
    const canceledRow = { ...MOCK_SUB_ROW, status: 'canceled' };
    subChain.single
      .mockResolvedValueOnce({ data: MOCK_SUB_ROW, error: null }) // fetch
      .mockResolvedValueOnce({ data: canceledRow,  error: null }); // update

    const result = await cancelSubscription('sub-1', 'user-1');
    expect(subChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'canceled' }),
    );
    expect(result.status).toBe('canceled');
  });

  it('throws when subscription not found', async () => {
    subChain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    await expect(cancelSubscription('sub-999', 'user-1')).rejects.toThrow('Subscription not found');
  });
});

describe('handleWebhookEvent()', () => {
  it('inserts a new subscription on checkout.session.completed', async () => {
    userChain.single.mockResolvedValue({ data: { role: 'driver' }, error: null });
    subChain.then = (onFulfilled) =>
      Promise.resolve({ data: null, error: null }).then(onFulfilled);

    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { userId: 'user-1', planId: 'basic' },
        },
      },
    };

    const result = await handleWebhookEvent(event);

    expect(supabase.from).toHaveBeenCalledWith('subscriptions');
    expect(subChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', plan_name: 'basic', status: 'active' }),
    );
    expect(result).toEqual({ received: true });
  });
});

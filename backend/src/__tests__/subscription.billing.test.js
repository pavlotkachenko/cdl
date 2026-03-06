/**
 * Sprint 028 — Subscription Billing Tests
 * Covers: createBillingPortalSession (SB-1), handleWebhookEvent extensions (SB-3, SB-4),
 *         getInvoices (SB-5).
 *
 * Pattern: jest.resetModules() in beforeEach + require inside each test so the
 * supabase mock instance matches the one the service binds at module load time.
 */

jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));

/**
 * Build a Supabase chain mock on the provided (freshly-required) supabase instance.
 */
function buildChain(supabase, result = { data: null, error: null }) {
  const chain = {};
  ['select', 'insert', 'update', 'eq', 'in', 'order', 'limit'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue(result);
  chain.then = (onFulfilled) => Promise.resolve(result).then(onFulfilled);
  supabase.from.mockReturnValue(chain);
  return chain;
}

function makeRes() {
  const res = { json: jest.fn(), status: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.resetAllMocks();
  delete process.env.STRIPE_SECRET_KEY;
  jest.resetModules();
  // Re-register the supabase mock after resetModules
  jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
});

// ─── SB-1: createBillingPortalSession ─────────────────────────────────────────

describe('createBillingPortalSession (SB-1)', () => {
  it('returns fallback URL when Stripe is not configured', async () => {
    const { createBillingPortalSession } = require('../services/subscription.service');
    const result = await createBillingPortalSession('u1', 'http://app/return');
    expect(result).toEqual({ url: 'http://app/return' });
  });

  it('returns APP_URL/attorney/subscription as default returnUrl when Stripe absent', async () => {
    process.env.APP_URL = 'http://localhost:4200';
    const { createBillingPortalSession } = require('../services/subscription.service');
    const result = await createBillingPortalSession('u1');
    expect(result.url).toBe('http://localhost:4200/attorney/subscription');
    delete process.env.APP_URL;
  });

  it('creates billing portal session via Stripe for existing customer', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

    const mockCreate = jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/portal/sess_abc' });
    const mockCustomersList = jest.fn().mockResolvedValue({ data: [{ id: 'cus_existing' }] });

    jest.mock('stripe', () => () => ({
      customers: { list: mockCustomersList, create: jest.fn() },
      billingPortal: { sessions: { create: mockCreate } },
    }), { virtual: true });

    const { supabase } = require('../config/supabase');
    buildChain(supabase, { data: { email: 'user@example.com' }, error: null });

    const { createBillingPortalSession } = require('../services/subscription.service');
    const result = await createBillingPortalSession('u1', 'http://app/return');

    expect(result).toEqual({ url: 'https://billing.stripe.com/portal/sess_abc' });
    expect(mockCreate).toHaveBeenCalledWith({ customer: 'cus_existing', return_url: 'http://app/return' });
  });

  it('creates new Stripe customer when none found, then creates session', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

    const mockCustomerCreate = jest.fn().mockResolvedValue({ id: 'cus_new' });
    const mockPortalCreate = jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/portal/sess_new' });

    jest.mock('stripe', () => () => ({
      customers: {
        list: jest.fn().mockResolvedValue({ data: [] }),
        create: mockCustomerCreate,
      },
      billingPortal: { sessions: { create: mockPortalCreate } },
    }), { virtual: true });

    const { supabase } = require('../config/supabase');
    buildChain(supabase, { data: { email: 'new@example.com' }, error: null });

    const { createBillingPortalSession } = require('../services/subscription.service');
    const result = await createBillingPortalSession('u1', 'http://return');

    expect(mockCustomerCreate).toHaveBeenCalledWith({ email: 'new@example.com', metadata: { userId: 'u1' } });
    expect(result.url).toBe('https://billing.stripe.com/portal/sess_new');
  });
});

// ─── SB-3: customer.subscription.updated webhook ──────────────────────────────

describe('handleWebhookEvent — customer.subscription.updated (SB-3)', () => {
  function makeUpdatedEvent(metadata = { userId: 'u1', planId: 'basic' }, extra = {}) {
    return {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_123',
          status: 'active',
          cancel_at_period_end: false,
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
          metadata,
          ...extra,
        },
      },
    };
  }

  it('updates subscription status and end_date when metadata has userId', async () => {
    const { supabase } = require('../config/supabase');
    const chain = buildChain(supabase, { data: null, error: null });
    const { handleWebhookEvent } = require('../services/subscription.service');

    const result = await handleWebhookEvent(makeUpdatedEvent());
    expect(result).toEqual({ received: true });
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({
      status: 'active',
      plan_name: 'basic',
      price_per_month: 29,
    }));
  });

  it('sets status to "canceling" when cancel_at_period_end is true', async () => {
    const { supabase } = require('../config/supabase');
    const chain = buildChain(supabase, { data: null, error: null });
    const { handleWebhookEvent } = require('../services/subscription.service');

    await handleWebhookEvent(makeUpdatedEvent({ userId: 'u1', planId: 'basic' }, { cancel_at_period_end: true }));
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'canceling' }));
  });

  it('skips DB update when metadata is missing userId', async () => {
    const { supabase } = require('../config/supabase');
    const chain = buildChain(supabase, { data: null, error: null });
    const { handleWebhookEvent } = require('../services/subscription.service');

    await handleWebhookEvent(makeUpdatedEvent({}));
    expect(chain.update).not.toHaveBeenCalled();
  });
});

// ─── SB-4: invoice.paid webhook ───────────────────────────────────────────────

describe('handleWebhookEvent — invoice.paid (SB-4)', () => {
  const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;

  function makeInvoicePaidEvent(metadata = { userId: 'u1' }) {
    return {
      type: 'invoice.paid',
      data: {
        object: {
          id: 'inv_abc',
          subscription: 'sub_123',
          subscription_details: { metadata },
          lines: { data: [{ period: { end: periodEnd } }] },
        },
      },
    };
  }

  it('sets status to active and updates end_date on invoice.paid', async () => {
    const { supabase } = require('../config/supabase');
    const chain = buildChain(supabase, { data: null, error: null });
    const { handleWebhookEvent } = require('../services/subscription.service');

    const result = await handleWebhookEvent(makeInvoicePaidEvent());
    expect(result).toEqual({ received: true });
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('skips when subscription field is null (non-subscription invoice)', async () => {
    const { supabase } = require('../config/supabase');
    const chain = buildChain(supabase, { data: null, error: null });
    const { handleWebhookEvent } = require('../services/subscription.service');

    await handleWebhookEvent({ type: 'invoice.paid', data: { object: { id: 'inv_x', subscription: null } } });
    expect(chain.update).not.toHaveBeenCalled();
  });

  it('skips when subscription_details.metadata has no userId', async () => {
    const { supabase } = require('../config/supabase');
    const chain = buildChain(supabase, { data: null, error: null });
    const { handleWebhookEvent } = require('../services/subscription.service');

    await handleWebhookEvent(makeInvoicePaidEvent({}));
    expect(chain.update).not.toHaveBeenCalled();
  });
});

// ─── SB-5: getInvoices ────────────────────────────────────────────────────────

describe('getInvoices (SB-5)', () => {
  it('returns empty array when Stripe is not configured', async () => {
    const { getInvoices } = require('../services/subscription.service');
    const result = await getInvoices('u1');
    expect(result).toEqual([]);
  });

  it('returns empty array when user has no Stripe customer record', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

    jest.mock('stripe', () => () => ({
      customers: { list: jest.fn().mockResolvedValue({ data: [] }) },
      invoices: { list: jest.fn() },
    }), { virtual: true });

    const { supabase } = require('../config/supabase');
    buildChain(supabase, { data: { email: 'nobody@example.com' }, error: null });

    const { getInvoices } = require('../services/subscription.service');
    const result = await getInvoices('u1');
    expect(result).toEqual([]);
  });

  it('returns mapped invoices for known Stripe customer', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';

    const now = Math.floor(Date.now() / 1000);
    const mockInvoice = {
      id: 'inv_123', amount_paid: 2900, currency: 'usd', status: 'paid',
      created: now, invoice_pdf: 'https://stripe.com/inv.pdf',
      hosted_invoice_url: 'https://invoice.stripe.com/hosted',
    };
    const mockInvoicesList = jest.fn().mockResolvedValue({ data: [mockInvoice] });

    jest.mock('stripe', () => () => ({
      customers: { list: jest.fn().mockResolvedValue({ data: [{ id: 'cus_abc' }] }) },
      invoices: { list: mockInvoicesList },
    }), { virtual: true });

    const { supabase } = require('../config/supabase');
    buildChain(supabase, { data: { email: 'attorney@example.com' }, error: null });

    const { getInvoices } = require('../services/subscription.service');
    const result = await getInvoices('u1');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'inv_123', amount: 29, currency: 'usd', status: 'paid' });
    expect(mockInvoicesList).toHaveBeenCalledWith({ customer: 'cus_abc', limit: 10 });
  });

  it('returns empty array when user not found in DB (Stripe absent)', async () => {
    const { supabase } = require('../config/supabase');
    buildChain(supabase, { data: null, error: { message: 'not found' } });

    const { getInvoices } = require('../services/subscription.service');
    const result = await getInvoices('bad-uid');
    expect(result).toEqual([]);
  });
});

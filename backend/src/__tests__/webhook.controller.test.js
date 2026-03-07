/**
 * Tests for webhook.controller.js — Sprint 036 WH-4
 */

jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

const { supabase } = require('../config/supabase');
const { listWebhooks, createWebhook, updateWebhook, deleteWebhook } = require('../controllers/webhook.controller');

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeReq = (overrides = {}) => ({
  user: { carrierId: 'carrier-uuid' },
  params: {},
  body: {},
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  supabase.eq.mockReturnThis();
});

// ── listWebhooks ─────────────────────────────────────────────────────────────

describe('listWebhooks()', () => {
  it('returns 403 when carrierId missing from token', async () => {
    const req = makeReq({ user: {} });
    const res = makeRes();
    await listWebhooks(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it('returns webhook list for authenticated carrier', async () => {
    const WEBHOOKS = [{ id: 'wh-1', url: 'https://a.com', events: ['case.created'], active: true }];
    supabase.order.mockResolvedValueOnce({ data: WEBHOOKS, error: null });
    const req = makeReq();
    const res = makeRes();
    await listWebhooks(req, res);
    expect(res.json).toHaveBeenCalledWith({ webhooks: WEBHOOKS });
  });
});

// ── createWebhook ─────────────────────────────────────────────────────────────

describe('createWebhook()', () => {
  it('returns 400 when url is missing', async () => {
    const req = makeReq({ body: { events: ['case.created'] } });
    const res = makeRes();
    await createWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when events array is empty', async () => {
    const req = makeReq({ body: { url: 'https://a.com', events: [] } });
    const res = makeRes();
    await createWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for invalid event names', async () => {
    const req = makeReq({ body: { url: 'https://a.com', events: ['invalid.event'] } });
    const res = makeRes();
    await createWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates webhook with auto-generated secret and returns 201', async () => {
    const CREATED = { id: 'wh-1', url: 'https://a.com', events: ['case.created'], secret: 'abc', active: true };
    supabase.single.mockResolvedValueOnce({ data: CREATED, error: null });
    const req = makeReq({ body: { url: 'https://a.com', events: ['case.created'] } });
    const res = makeRes();
    await createWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ webhook: CREATED });
  });
});

// ── updateWebhook ─────────────────────────────────────────────────────────────

describe('updateWebhook()', () => {
  it('returns 404 when webhook not found', async () => {
    supabase.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    const req = makeReq({ params: { id: 'bad-id' }, body: { active: false } });
    const res = makeRes();
    await updateWebhook(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates active flag and returns webhook', async () => {
    const UPDATED = { id: 'wh-1', url: 'https://a.com', active: false };
    supabase.single.mockResolvedValueOnce({ data: UPDATED, error: null });
    const req = makeReq({ params: { id: 'wh-1' }, body: { active: false } });
    const res = makeRes();
    await updateWebhook(req, res);
    expect(res.json).toHaveBeenCalledWith({ webhook: UPDATED });
  });
});

// ── deleteWebhook ─────────────────────────────────────────────────────────────

describe('deleteWebhook()', () => {
  it('deletes webhook and returns success message', async () => {
    // eq() uses default mockReturnThis throughout the chain;
    // await on a non-thenable mock resolves to it — no error property → success path
    const req = makeReq({ params: { id: 'wh-1' } });
    const res = makeRes();
    await deleteWebhook(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Webhook deleted' });
  });
});

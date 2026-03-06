'use strict';

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require('../config/supabase');
const adminController = require('../controllers/admin.controller');

// ─────────────────────────────────────────────
// Chain helpers
// ─────────────────────────────────────────────
let chain;

function buildChain(arrayResult = { data: [], error: null }) {
  chain = {};
  ['select', 'insert', 'update', 'eq', 'neq', 'order', 'limit'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  // head-mode count query
  chain.head = jest.fn().mockReturnValue(chain);
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(arrayResult).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(chain);
}

function makeReq(overrides = {}) {
  return { user: { id: 'admin-1', role: 'admin' }, query: {}, params: {}, body: {}, ...overrides };
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

// ─────────────────────────────────────────────
// getUsers
// ─────────────────────────────────────────────
describe('getUsers', () => {
  test('returns mapped users list', async () => {
    const raw = [
      { id: 'u1', full_name: 'Alice', email: 'alice@test.com', role: 'driver', is_active: true, created_at: '2026-01-01', last_login: null },
      { id: 'u2', full_name: 'Bob', email: 'bob@test.com', role: 'attorney', is_active: false, created_at: '2026-02-01', last_login: '2026-03-01' },
    ];
    chain.then = (onFulfilled) => Promise.resolve({ data: raw, error: null }).then(onFulfilled);

    const req = makeReq();
    const res = makeRes();
    await adminController.getUsers(req, res);

    const { users } = res.json.mock.calls[0][0];
    expect(users).toHaveLength(2);
    expect(users[0]).toMatchObject({ id: 'u1', name: 'Alice', status: 'active' });
    expect(users[1]).toMatchObject({ id: 'u2', status: 'suspended' });
  });

  test('applies role filter query param', async () => {
    chain.then = (onFulfilled) => Promise.resolve({ data: [], error: null }).then(onFulfilled);
    const req = makeReq({ query: { role: 'driver' } });
    const res = makeRes();
    await adminController.getUsers(req, res);
    expect(chain.eq).toHaveBeenCalledWith('role', 'driver');
  });

  test('applies status=active filter', async () => {
    chain.then = (onFulfilled) => Promise.resolve({ data: [], error: null }).then(onFulfilled);
    const req = makeReq({ query: { status: 'active' } });
    const res = makeRes();
    await adminController.getUsers(req, res);
    expect(chain.eq).toHaveBeenCalledWith('is_active', true);
  });
});

// ─────────────────────────────────────────────
// inviteUser
// ─────────────────────────────────────────────
describe('inviteUser', () => {
  test('creates user and returns 201', async () => {
    chain.maybeSingle.mockResolvedValue({ data: null, error: null }); // no duplicate
    chain.single.mockResolvedValue({ data: { id: 'u-new', email: 'new@test.com', role: 'driver' }, error: null });

    const req = makeReq({ body: { email: 'new@test.com', role: 'driver' } });
    const res = makeRes();
    await adminController.inviteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].user).toMatchObject({ email: 'new@test.com', role: 'driver', status: 'pending' });
  });

  test('returns 400 when email is missing', async () => {
    const req = makeReq({ body: { role: 'driver' } });
    const res = makeRes();
    await adminController.inviteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('returns 409 when email already exists', async () => {
    chain.maybeSingle.mockResolvedValue({ data: { id: 'existing' }, error: null });
    const req = makeReq({ body: { email: 'taken@test.com', role: 'attorney' } });
    const res = makeRes();
    await adminController.inviteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json.mock.calls[0][0].error.code).toBe('DUPLICATE_EMAIL');
  });
});

// ─────────────────────────────────────────────
// changeUserRole
// ─────────────────────────────────────────────
describe('changeUserRole', () => {
  test('updates role and returns updated user', async () => {
    // First single() = fetch target (non-admin)
    // Second single() = update result
    chain.single
      .mockResolvedValueOnce({ data: { role: 'driver' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'u1', role: 'carrier' }, error: null });

    const req = makeReq({ params: { id: 'u1' }, body: { role: 'carrier' } });
    const res = makeRes();
    await adminController.changeUserRole(req, res);

    expect(res.json.mock.calls[0][0].user).toMatchObject({ id: 'u1', role: 'carrier' });
  });

  test('returns 404 when user not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    const req = makeReq({ params: { id: 'ghost' }, body: { role: 'driver' } });
    const res = makeRes();
    await adminController.changeUserRole(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 when trying to demote last admin', async () => {
    chain.single.mockResolvedValueOnce({ data: { role: 'admin' }, error: null });
    // count query via chain.then → returns count: 1
    chain.then = (onFulfilled) => Promise.resolve({ data: null, error: null, count: 1 }).then(onFulfilled);

    const req = makeReq({ params: { id: 'admin-1' }, body: { role: 'driver' } });
    const res = makeRes();
    await adminController.changeUserRole(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('LAST_ADMIN');
  });
});

// ─────────────────────────────────────────────
// suspendUser
// ─────────────────────────────────────────────
describe('suspendUser', () => {
  test('sets is_active=false and returns suspended status', async () => {
    chain.single.mockResolvedValue({ data: { id: 'u1', is_active: false }, error: null });
    const req = makeReq({ params: { id: 'u1' } });
    const res = makeRes();
    await adminController.suspendUser(req, res);
    expect(res.json.mock.calls[0][0].user).toMatchObject({ id: 'u1', status: 'suspended' });
  });
});

// ─────────────────────────────────────────────
// unsuspendUser
// ─────────────────────────────────────────────
describe('unsuspendUser', () => {
  test('sets is_active=true and returns active status', async () => {
    chain.single.mockResolvedValue({ data: { id: 'u1', is_active: true }, error: null });
    const req = makeReq({ params: { id: 'u1' } });
    const res = makeRes();
    await adminController.unsuspendUser(req, res);
    expect(res.json.mock.calls[0][0].user).toMatchObject({ id: 'u1', status: 'active' });
  });
});

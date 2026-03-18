'use strict';

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));
jest.mock('../socket/socket', () => ({
  emitToUser: jest.fn(),
  emitToRole: jest.fn(),
  emitToCase: jest.fn(),
}));
jest.mock('../services/status-workflow.service', () => ({
  validateTransition: jest.fn(),
}));

const { supabase } = require('../config/supabase');
const { emitToUser } = require('../socket/socket');
const { validateTransition } = require('../services/status-workflow.service');
const adminController = require('../controllers/admin.controller');

// ─────────────────────────────────────────────
// Chain helpers
// ─────────────────────────────────────────────
let chain;

function buildChain(arrayResult = { data: [], error: null }) {
  chain = {};
  ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'limit',
   'not', 'gte', 'is', 'in', 'or', 'range'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  // head-mode count query
  chain.head = jest.fn().mockReturnValue(chain);
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(arrayResult).then(onFulfilled, onRejected);
  chain.catch = jest.fn().mockReturnValue(Promise.resolve());
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

// ─── OC-7: Assignment Request Approval ───────────────────────────
describe('getAssignmentRequests', () => {
  test('returns pending requests with joins', async () => {
    buildChain({
      data: [{
        id: 'ar-1', status: 'pending', created_at: '2026-03-10T14:00:00Z',
        operator_id: 'op-1', case_id: 'c1',
        operator: { id: 'op-1', full_name: 'Lisa Chen' },
        case: { id: 'c1', case_number: 'CDL-610', violation_type: 'Speeding', state: 'TX' },
      }],
      error: null,
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getAssignmentRequests(req, res);

    expect(res.json).toHaveBeenCalledWith({
      requests: [expect.objectContaining({
        id: 'ar-1',
        operator: { id: 'op-1', full_name: 'Lisa Chen' },
        case: expect.objectContaining({ case_number: 'CDL-610' }),
      })],
    });
  });

  test('returns empty array when no pending requests', async () => {
    buildChain({ data: [], error: null });
    const req = makeReq();
    const res = makeRes();
    await adminController.getAssignmentRequests(req, res);
    expect(res.json).toHaveBeenCalledWith({ requests: [] });
  });
});

describe('approveAssignmentRequest', () => {
  function setupApprove(request, caseData) {
    let singleCallCount = 0;
    chain.single = jest.fn().mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: request, error: null });
      if (singleCallCount === 2) return Promise.resolve({ data: caseData, error: null });
      return Promise.resolve({ data: null, error: null });
    });
  }

  test('approves request and assigns operator to case', async () => {
    setupApprove(
      { id: 'ar-1', status: 'pending', operator_id: 'op-1', case_id: 'c1' },
      { id: 'c1', case_number: 'CDL-610', assigned_operator_id: null },
    );

    const req = makeReq({ params: { requestId: 'ar-1' } });
    const res = makeRes();
    await adminController.approveAssignmentRequest(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(emitToUser).toHaveBeenCalledWith('op-1', 'assignment:approved', expect.any(Object));
  });

  test('returns 404 for missing request', async () => {
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    const req = makeReq({ params: { requestId: 'missing' } });
    const res = makeRes();
    await adminController.approveAssignmentRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 for already processed request', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { id: 'ar-1', status: 'approved', operator_id: 'op-1', case_id: 'c1' },
      error: null,
    });
    const req = makeReq({ params: { requestId: 'ar-1' } });
    const res = makeRes();
    await adminController.approveAssignmentRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'ALREADY_PROCESSED' }) }),
    );
  });

  test('returns 409 when case already assigned to different operator', async () => {
    setupApprove(
      { id: 'ar-1', status: 'pending', operator_id: 'op-1', case_id: 'c1' },
      { id: 'c1', case_number: 'CDL-610', assigned_operator_id: 'op-other' },
    );

    const req = makeReq({ params: { requestId: 'ar-1' } });
    const res = makeRes();
    await adminController.approveAssignmentRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });
});

describe('rejectAssignmentRequest', () => {
  function setupReject() {
    let singleCallCount = 0;
    chain.single = jest.fn().mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) return Promise.resolve({ data: { id: 'ar-1', status: 'pending', operator_id: 'op-1', case_id: 'c1' }, error: null });
      if (singleCallCount === 2) return Promise.resolve({ data: { case_number: 'CDL-610' }, error: null });
      return Promise.resolve({ data: null, error: null });
    });
  }

  test('rejects request with reason', async () => {
    setupReject();
    const req = makeReq({ params: { requestId: 'ar-1' }, body: { reason: 'No capacity' } });
    const res = makeRes();
    await adminController.rejectAssignmentRequest(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(emitToUser).toHaveBeenCalledWith('op-1', 'assignment:rejected',
      expect.objectContaining({ reason: 'No capacity' }),
    );
  });

  test('rejects without reason', async () => {
    setupReject();
    const req = makeReq({ params: { requestId: 'ar-1' }, body: {} });
    const res = makeRes();
    await adminController.rejectAssignmentRequest(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(emitToUser).toHaveBeenCalledWith('op-1', 'assignment:rejected',
      expect.objectContaining({ reason: null }),
    );
  });

  test('returns 404 for missing request', async () => {
    chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
    const req = makeReq({ params: { requestId: 'missing' } });
    const res = makeRes();
    await adminController.rejectAssignmentRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('returns 400 for already processed request', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { id: 'ar-1', status: 'rejected', operator_id: 'op-1', case_id: 'c1' },
      error: null,
    });
    const req = makeReq({ params: { requestId: 'ar-1' } });
    const res = makeRes();
    await adminController.rejectAssignmentRequest(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ═══════════════════════════════════════════════
// AC-1: New Admin Dashboard & Case Management Endpoints
// ═══════════════════════════════════════════════

describe('getDashboardStats', () => {
  test('returns aggregate case and staff counts', async () => {
    // getDashboardStats calls supabase.from() 9 times (9 count queries)
    // Each uses chain.then for the count result
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in'].forEach(m => { c[m] = jest.fn().mockReturnValue(c); });
      c.head = jest.fn().mockReturnValue(c);
      // Return different counts per call:
      // 1=totalCases, 2=activeCases, 3=pending, 4=resolved, 5=closed,
      // 6=casesThisWeek, 7=totalClients, 8=totalOperators, 9=totalAttorneys
      const counts = [100, 60, 10, 25, 15, 8, 50, 5, 12];
      c.then = (onFulfilled) =>
        Promise.resolve({ count: counts[callCount - 1] || 0, error: null }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getDashboardStats(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.totalCases).toBe(100);
    expect(body.activeCases).toBe(60);
    expect(body.pendingCases).toBe(10);
    expect(body.resolvedCases).toBe(25);
    expect(body.closedCases).toBe(15);
    expect(body.casesThisWeek).toBe(8);
    expect(body.totalClients).toBe(50);
    expect(body.totalOperators).toBe(5);
    expect(body.totalAttorneys).toBe(12);
  });

  test('returns zeros when no data exists', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in'].forEach(m => { c[m] = jest.fn().mockReturnValue(c); });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ count: 0, error: null }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getDashboardStats(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.totalCases).toBe(0);
    expect(body.activeCases).toBe(0);
  });

  test('returns 500 on database error', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in'].forEach(m => { c[m] = jest.fn().mockReturnValue(c); });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ count: null, error: { message: 'db fail' } }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getDashboardStats(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.code).toBe('FETCH_FAILED');
  });
});

describe('getAllCases', () => {
  // Helper: build mock chains for getAllCases (call 1 = main query, call 2 = case_files)
  function setupGetAllCases(rawCases, { total, fileRows = [] } = {}) {
    let mainChain;
    let fromCallCount = 0;
    supabase.from.mockImplementation((table) => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'ilike', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.single = jest.fn().mockResolvedValue({ data: null, error: null });
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (fromCallCount === 1) {
        // Main cases query — inline count via { count: 'exact' }
        c.then = (onFulfilled) => Promise.resolve({
          data: rawCases, count: total ?? rawCases.length, error: null,
        }).then(onFulfilled);
        mainChain = c;
      } else {
        // case_files batch query
        c.then = (onFulfilled) => Promise.resolve({ data: fileRows, error: null }).then(onFulfilled);
      }
      return c;
    });
    return { getMainChain: () => mainChain };
  }

  const fullCase = {
    id: 'c1', case_number: 'CDL-001', status: 'new', state: 'TX',
    violation_type: 'Speeding', violation_date: '2026-01-01',
    customer_name: 'Miguel', customer_email: 'miguel@test.com',
    driver_phone: '555-1234', customer_type: 'driver',
    court_date: '2026-04-01', next_action_date: '2026-03-20',
    assigned_operator_id: 'op-1', assigned_attorney_id: 'att-1',
    attorney_price: '350.00', price_cdl: '150.00',
    subscriber_paid: true, court_fee: '75.00', court_fee_paid_by: 'driver',
    carrier: 'Swift Transport', who_sent: 'driver',
    operator: { id: 'op-1', full_name: 'Lisa M.' },
    attorney: { id: 'att-1', full_name: 'James H.' },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: '2026-03-10',
  };

  test('returns cases with all 19 fields, operator/attorney names, and total count', async () => {
    setupGetAllCases([fullCase], { total: 1, fileRows: [{ case_id: 'c1' }, { case_id: 'c1' }] });

    const req = makeReq({ query: {} });
    const res = makeRes();
    await adminController.getAllCases(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.cases).toHaveLength(1);
    const c = body.cases[0];
    expect(c).toMatchObject({
      case_number: 'CDL-001', status: 'new', state: 'TX',
      violation_type: 'Speeding', violation_date: '2026-01-01',
      customer_name: 'Miguel', customer_email: 'miguel@test.com',
      driver_phone: '555-1234', customer_type: 'driver',
      court_date: '2026-04-01', next_action_date: '2026-03-20',
      operator_name: 'Lisa M.', attorney_name: 'James H.',
      carrier: 'Swift Transport', who_sent: 'driver',
      court_fee_paid_by: 'driver', subscriber_paid: true,
    });
    // Numeric coercion
    expect(c.attorney_price).toBe(350);
    expect(c.price_cdl).toBe(150);
    expect(c.court_fee).toBe(75);
    // File count
    expect(c.file_count).toBe(2);
    // Computed
    expect(c.ageHours).toBeGreaterThanOrEqual(1);
    expect(body.total).toBe(1);
  });

  test('applies single status filter', async () => {
    const { getMainChain } = setupGetAllCases([]);
    const req = makeReq({ query: { status: 'reviewed' } });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(getMainChain().eq).toHaveBeenCalledWith('status', 'reviewed');
  });

  test('applies multi-value status filter with comma-separated values', async () => {
    const { getMainChain } = setupGetAllCases([]);
    const req = makeReq({ query: { status: 'new,reviewed' } });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(getMainChain().in).toHaveBeenCalledWith('status', ['new', 'reviewed']);
  });

  test('filters unassigned cases when operator_id=null', async () => {
    const { getMainChain } = setupGetAllCases([]);
    const req = makeReq({ query: { operator_id: 'null' } });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(getMainChain().is).toHaveBeenCalledWith('assigned_operator_id', null);
  });

  test('applies state filter (single value, uppercased)', async () => {
    const { getMainChain } = setupGetAllCases([]);
    const req = makeReq({ query: { state: 'tx' } });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(getMainChain().eq).toHaveBeenCalledWith('state', 'TX');
  });

  test('applies multi-value state filter', async () => {
    const { getMainChain } = setupGetAllCases([]);
    const req = makeReq({ query: { state: 'TX,CA' } });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(getMainChain().in).toHaveBeenCalledWith('state', ['TX', 'CA']);
  });

  test('applies carrier ilike filter', async () => {
    const { getMainChain } = setupGetAllCases([]);
    const req = makeReq({ query: { carrier: 'swift' } });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(getMainChain().ilike).toHaveBeenCalledWith('carrier', '%swift%');
  });

  test('applies search filter via or() including carrier', async () => {
    const { getMainChain } = setupGetAllCases([]);
    const req = makeReq({ query: { search: 'CDL' } });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    const orArg = getMainChain().or.mock.calls[0][0];
    expect(orArg).toContain('case_number.ilike.%CDL%');
    expect(orArg).toContain('carrier.ilike.%CDL%');
  });

  test('applies sort_by and sort_dir', async () => {
    const { getMainChain } = setupGetAllCases([]);
    const req = makeReq({ query: { sort_by: 'attorney_price', sort_dir: 'asc' } });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(getMainChain().order).toHaveBeenCalledWith('attorney_price', { ascending: true });
  });

  test('falls back to created_at desc for invalid sort_by', async () => {
    const { getMainChain } = setupGetAllCases([]);
    const req = makeReq({ query: { sort_by: 'DROP_TABLE', sort_dir: 'desc' } });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(getMainChain().order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  test('file_count is 0 for cases with no files', async () => {
    setupGetAllCases([fullCase], { fileRows: [] });
    const req = makeReq({ query: {} });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(res.json.mock.calls[0][0].cases[0].file_count).toBe(0);
  });

  test('returns null for missing nullable fields', async () => {
    const sparse = {
      ...fullCase,
      driver_phone: null, customer_type: null, court_date: null,
      next_action_date: null, attorney_price: null, price_cdl: null,
      subscriber_paid: null, court_fee: null, court_fee_paid_by: null,
      carrier: null, who_sent: null,
      operator: null, attorney: null,
    };
    setupGetAllCases([sparse]);
    const req = makeReq({ query: {} });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    const c = res.json.mock.calls[0][0].cases[0];
    expect(c.driver_phone).toBeNull();
    expect(c.attorney_price).toBeNull();
    expect(c.operator_name).toBeNull();
    expect(c.attorney_name).toBeNull();
    expect(c.subscriber_paid).toBeNull();
  });

  test('returns 500 on database error', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'ilike', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ data: null, error: { message: 'fail' } }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq({ query: {} });
    const res = makeRes();
    await adminController.getAllCases(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getAdminCaseDetail', () => {
  test('returns full case with activity log and staff names', async () => {
    const caseObj = {
      id: 'c1', case_number: 'CDL-001', status: 'reviewed',
      assigned_operator_id: 'op-1', assigned_attorney_id: 'att-1',
      attorney: { full_name: 'James H.' },
    };
    const activityRows = [
      { id: 'a1', action: 'status_change', details: {}, created_at: '2026-03-10', user: { full_name: 'Lisa M.' } },
    ];

    let fromCallCount = 0;
    supabase.from.mockImplementation((table) => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (table === 'cases') {
        c.single = jest.fn().mockResolvedValue({ data: caseObj, error: null });
      } else if (table === 'activity_log') {
        c.then = (onFulfilled) => Promise.resolve({ data: activityRows, error: null }).then(onFulfilled);
      } else if (table === 'users') {
        c.single = jest.fn().mockResolvedValue({ data: { full_name: 'Lisa M.' }, error: null });
      }
      return c;
    });

    const req = makeReq({ params: { id: 'c1' } });
    const res = makeRes();
    await adminController.getAdminCaseDetail(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.case).toMatchObject({ id: 'c1', case_number: 'CDL-001' });
    expect(body.activity).toHaveLength(1);
    expect(body.activity[0].user_name).toBe('Lisa M.');
    expect(body.operator_name).toBe('Lisa M.');
    expect(body.attorney_name).toBe('James H.');
  });

  test('returns 404 for non-existent case', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq({ params: { id: 'ghost' } });
    const res = makeRes();
    await adminController.getAdminCaseDetail(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].error.code).toBe('NOT_FOUND');
  });

  test('returns 500 on database error', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.single = jest.fn().mockRejectedValue(new Error('db crash'));
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq({ params: { id: 'c1' } });
    const res = makeRes();
    await adminController.getAdminCaseDetail(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('getOperators', () => {
  test('returns operators with active case counts', async () => {
    const operators = [
      { id: 'op-1', full_name: 'Lisa M.', email: 'lisa@test.com', is_active: true },
      { id: 'op-2', full_name: 'Alex T.', email: 'alex@test.com', is_active: true },
    ];

    let fromCallCount = 0;
    supabase.from.mockImplementation(() => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (fromCallCount === 1) {
        // Users query
        c.then = (onFulfilled) => Promise.resolve({ data: operators, error: null }).then(onFulfilled);
      } else {
        // Case count queries — alternate active (12) and total (25)
        const count = fromCallCount % 2 === 0 ? 12 : 25;
        c.then = (onFulfilled) => Promise.resolve({ count, error: null }).then(onFulfilled);
      }
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getOperators(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.operators).toHaveLength(2);
    expect(body.operators[0]).toMatchObject({ id: 'op-1', name: 'Lisa M.', activeCaseCount: 12, totalCaseCount: 25 });
  });

  test('returns empty array when no operators exist', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ data: [], error: null }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getOperators(req, res);
    expect(res.json.mock.calls[0][0].operators).toEqual([]);
  });

  test('returns 500 on database error', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ data: null, error: { message: 'fail' } }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getOperators(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('updateCaseStatus', () => {
  function setupStatusUpdate(caseData) {
    let fromCallCount = 0;
    supabase.from.mockImplementation((table) => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit', 'update', 'insert'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (table === 'cases' && fromCallCount === 1) {
        // Fetch case
        c.single = jest.fn().mockResolvedValue({ data: caseData, error: null });
      } else if (table === 'cases') {
        // Update case
        c.single = jest.fn().mockResolvedValue({ data: { ...caseData, status: 'reviewed' }, error: null });
      } else {
        // activity_log / notifications
        c.single = jest.fn().mockResolvedValue({ data: null, error: null });
        c.then = (onFulfilled) => Promise.resolve({ data: null, error: null }).then(onFulfilled);
      }
      return c;
    });
  }

  test('validates transition via workflow service and updates status', async () => {
    const caseData = { id: 'c1', case_number: 'CDL-001', status: 'new', driver_id: 'd1' };
    setupStatusUpdate(caseData);
    validateTransition.mockReturnValue({ allowed: true, requiresNote: false });

    const req = makeReq({ params: { id: 'c1' }, body: { status: 'reviewed' } });
    const res = makeRes();
    await adminController.updateCaseStatus(req, res);

    expect(validateTransition).toHaveBeenCalledWith('new', 'reviewed');
    expect(res.json).toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].case).toBeDefined();
  });

  test('rejects invalid transitions with 400', async () => {
    const caseData = { id: 'c1', case_number: 'CDL-001', status: 'new', driver_id: 'd1' };
    setupStatusUpdate(caseData);
    validateTransition.mockReturnValue({ allowed: false, requiresNote: false, error: 'Cannot transition from "new" to "closed"' });

    const req = makeReq({ params: { id: 'c1' }, body: { status: 'closed' } });
    const res = makeRes();
    await adminController.updateCaseStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('INVALID_TRANSITION');
  });

  test('requires note when transition demands it', async () => {
    const caseData = { id: 'c1', case_number: 'CDL-001', status: 'assigned_to_attorney', driver_id: 'd1' };
    setupStatusUpdate(caseData);
    validateTransition.mockReturnValue({ allowed: true, requiresNote: true });

    const req = makeReq({ params: { id: 'c1' }, body: { status: 'closed' } });
    const res = makeRes();
    await adminController.updateCaseStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('NOTE_REQUIRED');
  });

  test('allows admin override bypassing workflow validation', async () => {
    const caseData = { id: 'c1', case_number: 'CDL-001', status: 'closed', driver_id: 'd1' };
    setupStatusUpdate(caseData);

    const req = makeReq({ params: { id: 'c1' }, body: { status: 'new', override: true } });
    const res = makeRes();
    await adminController.updateCaseStatus(req, res);

    expect(validateTransition).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  test('returns 400 when status is missing', async () => {
    buildChain();
    const req = makeReq({ params: { id: 'c1' }, body: {} });
    const res = makeRes();
    await adminController.updateCaseStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 for non-existent case', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit', 'update', 'insert'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq({ params: { id: 'ghost' }, body: { status: 'reviewed' } });
    const res = makeRes();
    await adminController.updateCaseStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('getChartData', () => {
  function setupChartQuery(data) {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ data, error: null }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });
  }

  test('violation-distribution: returns grouped counts', async () => {
    setupChartQuery([
      { violation_type: 'Speeding' }, { violation_type: 'Speeding' },
      { violation_type: 'DUI' },
    ]);

    const req = makeReq({ params: { type: 'violation-distribution' } });
    const res = makeRes();
    await adminController.getChartData(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.labels).toContain('Speeding');
    expect(body.labels).toContain('DUI');
    expect(body.data[body.labels.indexOf('Speeding')]).toBe(2);
    expect(body.data[body.labels.indexOf('DUI')]).toBe(1);
  });

  test('attorney-workload: returns attorney names and counts', async () => {
    setupChartQuery([
      { attorney: { full_name: 'James H.' } },
      { attorney: { full_name: 'James H.' } },
      { attorney: { full_name: 'Sarah K.' } },
    ]);

    const req = makeReq({ params: { type: 'attorney-workload' } });
    const res = makeRes();
    await adminController.getChartData(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.labels).toContain('James H.');
    expect(body.data[body.labels.indexOf('James H.')]).toBe(2);
  });

  test('status-distribution: returns status counts', async () => {
    setupChartQuery([
      { status: 'new' }, { status: 'new' }, { status: 'reviewed' },
    ]);

    const req = makeReq({ params: { type: 'status-distribution' } });
    const res = makeRes();
    await adminController.getChartData(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.labels).toContain('new');
    expect(body.data[body.labels.indexOf('new')]).toBe(2);
  });

  test('returns 400 for unknown chart type', async () => {
    const req = makeReq({ params: { type: 'unknown-chart' } });
    const res = makeRes();
    await adminController.getChartData(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('INVALID_CHART_TYPE');
  });
});

describe('getWorkloadDistribution', () => {
  test('returns staff with utilization percentages', async () => {
    const staffData = [
      { id: 'op-1', full_name: 'Lisa M.', role: 'operator', is_active: true },
      { id: 'att-1', full_name: 'James H.', role: 'attorney', is_active: true },
    ];

    let fromCallCount = 0;
    supabase.from.mockImplementation(() => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (fromCallCount === 1) {
        // Staff query
        c.then = (onFulfilled) => Promise.resolve({ data: staffData, error: null }).then(onFulfilled);
      } else if (fromCallCount === 2) {
        // Operator active cases = 14
        c.then = (onFulfilled) => Promise.resolve({ count: 14, error: null }).then(onFulfilled);
      } else {
        // Attorney active cases = 9
        c.then = (onFulfilled) => Promise.resolve({ count: 9, error: null }).then(onFulfilled);
      }
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getWorkloadDistribution(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.staff).toHaveLength(2);
    expect(body.staff[0]).toMatchObject({
      id: 'op-1', name: 'Lisa M.', role: 'operator',
      activeCases: 14, capacity: 20, utilization: 70,
    });
    expect(body.staff[1]).toMatchObject({
      id: 'att-1', name: 'James H.', role: 'attorney',
      activeCases: 9, capacity: 15, utilization: 60,
    });
  });

  test('returns empty array when no staff exist', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ data: [], error: null }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getWorkloadDistribution(req, res);
    expect(res.json.mock.calls[0][0].staff).toEqual([]);
  });
});

// ═══════════════════════════════════════════════
// Sprint 056 — Mock Data Migration: Client & Staff Performance Endpoints
// ═══════════════════════════════════════════════

describe('getAllClients', () => {
  function setupGetAllClients(drivers, { countResults = [], lastCaseRows = [] } = {}) {
    let fromCallCount = 0;
    supabase.from.mockImplementation(() => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.single = jest.fn().mockResolvedValue({ data: null, error: null });
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (fromCallCount === 1) {
        // Users query (drivers)
        c.then = (onFulfilled) => Promise.resolve({ data: drivers, error: null }).then(onFulfilled);
      } else {
        // Per-driver queries: totalCases count, activeCases count, lastCase query
        // Pattern repeats per driver: count, count, data
        const perDriverIdx = (fromCallCount - 2) % 3; // 0 = total, 1 = active, 2 = last case
        const driverIdx = Math.floor((fromCallCount - 2) / 3);
        if (perDriverIdx === 0) {
          // Total cases count
          const cnt = countResults[driverIdx]?.total ?? 5;
          c.then = (onFulfilled) => Promise.resolve({ count: cnt, error: null }).then(onFulfilled);
        } else if (perDriverIdx === 1) {
          // Active cases count
          const cnt = countResults[driverIdx]?.active ?? 2;
          c.then = (onFulfilled) => Promise.resolve({ count: cnt, error: null }).then(onFulfilled);
        } else {
          // Last case query (returns data array)
          const rows = lastCaseRows[driverIdx] ?? [{ updated_at: '2026-03-10' }];
          c.then = (onFulfilled) => Promise.resolve({ data: rows, error: null }).then(onFulfilled);
        }
      }
      return c;
    });
  }

  test('returns client list with totalCases and activeCases counts', async () => {
    const drivers = [
      { id: 'u1', full_name: 'Miguel R.', email: 'miguel@test.com', phone: '555-1234', cdl_number: 'CDL111', address: '123 Main St', city: 'Dallas', state: 'TX', zip_code: '75001', created_at: '2026-01-01' },
      { id: 'u2', full_name: 'Sarah L.', email: 'sarah@test.com', phone: null, cdl_number: null, address: null, city: null, state: null, zip_code: null, created_at: '2026-02-01' },
    ];
    setupGetAllClients(drivers, {
      countResults: [{ total: 10, active: 3 }, { total: 5, active: 0 }],
      lastCaseRows: [[{ updated_at: '2026-03-05' }], []],
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getAllClients(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.clients).toHaveLength(2);
    expect(body.clients[0]).toMatchObject({
      id: 'u1', name: 'Miguel R.', email: 'miguel@test.com',
      phone: '555-1234', cdlNumber: 'CDL111',
      totalCases: 10, activeCases: 3,
      lastContact: '2026-03-05',
    });
    expect(body.clients[1]).toMatchObject({
      id: 'u2', name: 'Sarah L.', totalCases: 5, activeCases: 0,
      phone: null, cdlNumber: null, lastContact: null,
    });
  });

  test('filters by search term', async () => {
    setupGetAllClients([]);

    const req = makeReq({ query: { search: 'miguel' } });
    const res = makeRes();
    await adminController.getAllClients(req, res);

    // The first from() call builds the users query; verify or() was called with search ilike
    const firstChainCalls = supabase.from.mock.results[0].value;
    expect(firstChainCalls.or).toHaveBeenCalledWith(
      expect.stringContaining('full_name.ilike.%miguel%')
    );
    expect(res.json.mock.calls[0][0].clients).toEqual([]);
  });

  test('filters by status=active (only clients with active cases)', async () => {
    const drivers = [
      { id: 'u1', full_name: 'Miguel', email: 'miguel@test.com', phone: null, cdl_number: null, address: null, city: null, state: null, zip_code: null, created_at: '2026-01-01' },
      { id: 'u2', full_name: 'Sarah', email: 'sarah@test.com', phone: null, cdl_number: null, address: null, city: null, state: null, zip_code: null, created_at: '2026-02-01' },
    ];
    setupGetAllClients(drivers, {
      countResults: [{ total: 5, active: 2 }, { total: 3, active: 0 }],
    });

    const req = makeReq({ query: { status: 'active' } });
    const res = makeRes();
    await adminController.getAllClients(req, res);

    const body = res.json.mock.calls[0][0];
    // Only Miguel has active cases
    expect(body.clients).toHaveLength(1);
    expect(body.clients[0].name).toBe('Miguel');
  });

  test('returns 500 on error', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ data: null, error: { message: 'db fail' } }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getAllClients(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.code).toBe('FETCH_FAILED');
  });
});

describe('getClient', () => {
  function setupGetClient(user, { totalCases = 5, activeCases = 2, recentCases = [] } = {}) {
    let fromCallCount = 0;
    supabase.from.mockImplementation(() => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (fromCallCount === 1) {
        // User fetch (single)
        c.single = jest.fn().mockResolvedValue({ data: user, error: user ? null : { message: 'not found' } });
      } else if (fromCallCount === 2) {
        // Total cases count
        c.then = (onFulfilled) => Promise.resolve({ count: totalCases, error: null }).then(onFulfilled);
      } else if (fromCallCount === 3) {
        // Active cases count
        c.then = (onFulfilled) => Promise.resolve({ count: activeCases, error: null }).then(onFulfilled);
      } else {
        // Recent cases
        c.then = (onFulfilled) => Promise.resolve({ data: recentCases, error: null }).then(onFulfilled);
      }
      return c;
    });
  }

  test('returns client with recentCases array', async () => {
    const user = { id: 'u1', full_name: 'Miguel R.', email: 'miguel@test.com', phone: '555-1234', cdl_number: 'CDL111', address: '123 Main', city: 'Dallas', state: 'TX', zip_code: '75001', created_at: '2026-01-01' };
    const cases = [
      { id: 'c1', case_number: 'CDL-001', status: 'new', violation_type: 'Speeding', state: 'TX', court_date: '2026-04-01', created_at: '2026-03-01', updated_at: '2026-03-05' },
    ];
    setupGetClient(user, { totalCases: 10, activeCases: 3, recentCases: cases });

    const req = makeReq({ params: { id: 'u1' } });
    const res = makeRes();
    await adminController.getClient(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.client).toMatchObject({
      id: 'u1', name: 'Miguel R.', email: 'miguel@test.com',
      phone: '555-1234', cdlNumber: 'CDL111',
      totalCases: 10, activeCases: 3,
      lastContact: '2026-03-05',
    });
    expect(body.recentCases).toHaveLength(1);
    expect(body.recentCases[0]).toMatchObject({
      id: 'c1', caseNumber: 'CDL-001', status: 'new',
    });
  });

  test('returns 404 when not found', async () => {
    setupGetClient(null);

    const req = makeReq({ params: { id: 'ghost' } });
    const res = makeRes();
    await adminController.getClient(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].error.code).toBe('NOT_FOUND');
  });

  test('returns 500 on error', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.single = jest.fn().mockRejectedValue(new Error('db crash'));
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq({ params: { id: 'u1' } });
    const res = makeRes();
    await adminController.getClient(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.code).toBe('FETCH_FAILED');
  });
});

describe('updateClient', () => {
  function setupUpdateClient(existing, updatedData) {
    let fromCallCount = 0;
    supabase.from.mockImplementation(() => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit', 'update'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (fromCallCount === 1) {
        // Check existence
        c.single = jest.fn().mockResolvedValue({ data: existing, error: existing ? null : { message: 'not found' } });
      } else {
        // Update query
        c.single = jest.fn().mockResolvedValue({ data: updatedData, error: null });
      }
      return c;
    });
  }

  test('updates and returns client', async () => {
    setupUpdateClient(
      { id: 'u1' },
      { id: 'u1', full_name: 'Miguel R.', email: 'new@test.com', phone: '555-9999', cdl_number: 'CDL111' }
    );

    const req = makeReq({ params: { id: 'u1' }, body: { phone: '555-9999', email: 'new@test.com' } });
    const res = makeRes();
    await adminController.updateClient(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.client).toMatchObject({
      id: 'u1', name: 'Miguel R.', email: 'new@test.com', phone: '555-9999',
    });
  });

  test('returns 400 when no valid fields', async () => {
    buildChain();
    const req = makeReq({ params: { id: 'u1' }, body: {} });
    const res = makeRes();
    await adminController.updateClient(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].error.code).toBe('VALIDATION_ERROR');
  });

  test('returns 404 when client not found', async () => {
    setupUpdateClient(null, null);

    const req = makeReq({ params: { id: 'ghost' }, body: { phone: '555-0000' } });
    const res = makeRes();
    await adminController.updateClient(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0].error.code).toBe('NOT_FOUND');
  });
});

describe('getStaffPerformance', () => {
  function setupStaffPerformance(staffUsers, { perStaffCounts = [], resolvedData = [] } = {}) {
    let fromCallCount = 0;
    supabase.from.mockImplementation(() => {
      fromCallCount++;
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());

      if (fromCallCount === 1) {
        // Staff users query
        c.then = (onFulfilled) => Promise.resolve({ data: staffUsers, error: null }).then(onFulfilled);
      } else {
        // Per-staff queries: total count, active count, resolved count, resolvedData
        // Pattern per staff member: count, count, count, data
        const perStaffIdx = (fromCallCount - 2) % 4;
        const staffIdx = Math.floor((fromCallCount - 2) / 4);
        const counts = perStaffCounts[staffIdx] || { total: 10, active: 3, resolved: 7 };
        if (perStaffIdx === 0) {
          // Total cases
          c.then = (onFulfilled) => Promise.resolve({ count: counts.total, error: null }).then(onFulfilled);
        } else if (perStaffIdx === 1) {
          // Active cases
          c.then = (onFulfilled) => Promise.resolve({ count: counts.active, error: null }).then(onFulfilled);
        } else if (perStaffIdx === 2) {
          // Resolved cases
          c.then = (onFulfilled) => Promise.resolve({ count: counts.resolved, error: null }).then(onFulfilled);
        } else {
          // Resolved data (for avg resolution time)
          const data = resolvedData[staffIdx] || [];
          c.then = (onFulfilled) => Promise.resolve({ data, error: null }).then(onFulfilled);
        }
      }
      return c;
    });
  }

  test('returns metrics array with correct fields', async () => {
    const staff = [
      { id: 'op-1', full_name: 'Lisa M.', email: 'lisa@test.com', role: 'operator' },
      { id: 'att-1', full_name: 'James H.', email: 'james@test.com', role: 'attorney' },
    ];
    const resolvedRows = [
      { created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-11T00:00:00Z' }, // 10 days
      { created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-21T00:00:00Z' }, // 20 days
    ];
    setupStaffPerformance(staff, {
      perStaffCounts: [
        { total: 20, active: 5, resolved: 15 },
        { total: 10, active: 2, resolved: 8 },
      ],
      resolvedData: [resolvedRows, []],
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getStaffPerformance(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.metrics).toHaveLength(2);
    expect(body.metrics[0]).toMatchObject({
      id: 'op-1', name: 'Lisa M.', role: 'operator',
      casesHandled: 20, activeCases: 5, resolvedCases: 15,
      successRate: 75, // 15/20 * 100
    });
    expect(body.metrics[0].avgResolutionDays).toBeGreaterThan(0);
    expect(body.metrics[1]).toMatchObject({
      id: 'att-1', name: 'James H.', role: 'attorney',
      casesHandled: 10, activeCases: 2, resolvedCases: 8,
      successRate: 80, // 8/10 * 100
    });
  });

  test('returns 500 on error', async () => {
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'neq', 'not', 'gte', 'is', 'in', 'or', 'order', 'range', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      c.head = jest.fn().mockReturnValue(c);
      c.then = (onFulfilled) => Promise.resolve({ data: null, error: { message: 'db fail' } }).then(onFulfilled);
      c.catch = jest.fn().mockReturnValue(Promise.resolve());
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await adminController.getStaffPerformance(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].error.code).toBe('FETCH_FAILED');
  });
});

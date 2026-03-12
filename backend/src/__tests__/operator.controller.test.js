'use strict';

// ============================================================
// Mocks
// ============================================================
jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require('../config/supabase');
const operatorController = require('../controllers/operator.controller');

// ============================================================
// Chain helper (thenable for array queries)
// ============================================================
let chain;

function buildChain(arrayResult = { data: [], error: null, count: 0 }) {
  chain = {};
  const plain = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in', 'is',
    'gte', 'lte', 'order', 'limit', 'head'];
  plain.forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.catch = jest.fn().mockReturnValue(chain);
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(arrayResult).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(chain);
}

function makeReq(overrides = {}) {
  return {
    user: { id: 'op-1', role: 'operator', full_name: 'Test Operator' },
    query: {},
    params: {},
    body: {},
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
// getOperatorCases
// ============================================================
describe('getOperatorCases', () => {
  test('returns cases scoped to operator with summary', async () => {
    const now = Date.now();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

    const cases = [
      { id: 'c1', case_number: 'CDL-001', status: 'reviewed', state: 'CA',
        violation_type: 'speeding', created_at: oneHourAgo, customer_name: 'John Doe',
        attorney_price: null, driver: null },
    ];

    // First awaited chain call (cases query) → cases array
    // Second awaited chain call (pending assignment requests count) → { count: 1 }
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: cases, error: null }
        : { data: null, error: null, count: 1 };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    const { cases: returned, summary } = res.json.mock.calls[0][0];
    expect(returned).toHaveLength(1);
    expect(returned[0].ageHours).toBeGreaterThanOrEqual(0);
    expect(summary.assignedToMe).toBe(1);
    expect(summary.inProgress).toBe(1); // 'reviewed' is in progress
    expect(summary.pendingApproval).toBe(1);
  });

  test('scopes query to assigned_operator_id', async () => {
    const req = makeReq();
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    expect(chain.eq).toHaveBeenCalledWith('assigned_operator_id', 'op-1');
  });

  test('applies optional status filter', async () => {
    const req = makeReq({ query: { status: 'reviewed' } });
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    expect(chain.eq).toHaveBeenCalledWith('status', 'reviewed');
  });

  test('returns empty cases and zeroed summary when no cases assigned', async () => {
    const req = makeReq();
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    const { cases: returned, summary } = res.json.mock.calls[0][0];
    expect(returned).toEqual([]);
    expect(summary.assignedToMe).toBe(0);
    expect(summary.inProgress).toBe(0);
    expect(summary.resolvedToday).toBe(0);
  });

  test('returns 500 on supabase error', async () => {
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: null, error: { message: 'db error' } }).then(onFulfilled);

    const req = makeReq();
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'FETCH_ERROR' }) })
    );
  });
});

// ============================================================
// getUnassignedCases
// ============================================================
describe('getUnassignedCases', () => {
  test('returns unassigned cases with requested flag', async () => {
    const now = Date.now();
    const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000).toISOString();

    const cases = [
      { id: 'u1', case_number: 'CDL-610', status: 'new', state: 'NY',
        violation_type: 'lane change', created_at: twoHoursAgo, customer_name: 'Sarah Kim' },
    ];

    const requests = [{ case_id: 'u1', status: 'pending' }];

    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: cases, error: null }
        : { data: requests, error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getUnassignedCases(req, res);

    const { cases: returned } = res.json.mock.calls[0][0];
    expect(returned).toHaveLength(1);
    expect(returned[0].requested).toBe(true);
    expect(returned[0].ageHours).toBeGreaterThanOrEqual(1);
  });

  test('marks cases as not requested when no pending requests exist', async () => {
    const cases = [
      { id: 'u1', case_number: 'CDL-610', status: 'new', state: 'NY',
        violation_type: 'lane change', created_at: new Date().toISOString(), customer_name: 'Sarah Kim' },
    ];

    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: cases, error: null }
        : { data: [], error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getUnassignedCases(req, res);

    const { cases: returned } = res.json.mock.calls[0][0];
    expect(returned[0].requested).toBe(false);
  });

  test('queries for null assigned_operator_id and new/submitted status', async () => {
    const req = makeReq();
    const res = makeRes();

    await operatorController.getUnassignedCases(req, res);

    expect(chain.is).toHaveBeenCalledWith('assigned_operator_id', null);
    expect(chain.in).toHaveBeenCalledWith('status', ['new', 'submitted']);
  });

  test('returns 500 on supabase error', async () => {
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: null, error: { message: 'db error' } }).then(onFulfilled);

    const req = makeReq();
    const res = makeRes();

    await operatorController.getUnassignedCases(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'FETCH_ERROR' }) })
    );
  });
});

// ============================================================
// requestAssignment
// ============================================================
describe('requestAssignment', () => {
  test('creates assignment request for unassigned case', async () => {
    // .single() calls: 1st = case lookup, 2nd = maybeSingle (existing check), 3rd = insert result
    let singleCallCount = 0;
    chain.single = jest.fn().mockImplementation(() => {
      singleCallCount++;
      if (singleCallCount === 1) {
        // Case lookup — found and unassigned
        return Promise.resolve({ data: { id: 'c1', case_number: 'CDL-001', assigned_operator_id: null }, error: null });
      }
      // Insert result
      return Promise.resolve({ data: { id: 'r1', case_id: 'c1', operator_id: 'op-1', status: 'pending' }, error: null });
    });

    // maybeSingle: no existing pending request
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

    // thenable for admin query
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: [{ id: 'admin-1' }], error: null }).then(onFulfilled);

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ request: expect.objectContaining({ case_id: 'c1' }) })
    );
  });

  test('returns 404 when case not found', async () => {
    chain.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });

    const req = makeReq({ params: { caseId: 'nonexistent' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'NOT_FOUND' }) })
    );
  });

  test('returns 400 when case is already assigned', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { id: 'c1', case_number: 'CDL-001', assigned_operator_id: 'other-op' },
      error: null,
    });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'ALREADY_ASSIGNED' }) })
    );
  });

  test('returns 400 when duplicate pending request exists', async () => {
    chain.single = jest.fn().mockResolvedValue({
      data: { id: 'c1', case_number: 'CDL-001', assigned_operator_id: null },
      error: null,
    });
    chain.maybeSingle = jest.fn().mockResolvedValue({
      data: { id: 'existing-request' },
      error: null,
    });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.objectContaining({ code: 'DUPLICATE_REQUEST' }) })
    );
  });

  test('returns 500 on insert error', async () => {
    chain.single = jest.fn().mockImplementation(() => {
      // First call: case lookup
      chain.single = jest.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } });
      return Promise.resolve({ data: { id: 'c1', case_number: 'CDL-001', assigned_operator_id: null }, error: null });
    });
    chain.maybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });

    const req = makeReq({ params: { caseId: 'c1' } });
    const res = makeRes();

    await operatorController.requestAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ============================================================
// getAvailableAttorneys
// ============================================================
describe('getAvailableAttorneys', () => {
  const ATTORNEYS = [
    { id: 'a1', full_name: 'Alice Smith', email: 'alice@law.com', specializations: ['speeding'], jurisdictions: ['CA'] },
    { id: 'a2', full_name: 'Bob Jones', email: 'bob@law.com', specializations: [], jurisdictions: [] },
  ];

  const ACTIVE_CASES = [
    { assigned_attorney_id: 'a1' },
    { assigned_attorney_id: 'a1' },
    { assigned_attorney_id: 'a2' },
  ];

  test('returns attorneys with computed activeCount', async () => {
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: ATTORNEYS, error: null }   // attorneys query
        : { data: ACTIVE_CASES, error: null }; // case counts query
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    const { attorneys } = res.json.mock.calls[0][0];
    expect(attorneys).toHaveLength(2);
    const alice = attorneys.find(a => a.id === 'a1');
    const bob = attorneys.find(a => a.id === 'a2');
    expect(alice.activeCount).toBe(2);
    expect(bob.activeCount).toBe(1);
  });

  test('returns attorneys with activeCount=0 when no active cases', async () => {
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: ATTORNEYS, error: null }
        : { data: [], error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    const { attorneys } = res.json.mock.calls[0][0];
    expect(attorneys.every(a => a.activeCount === 0)).toBe(true);
  });

  test('handles null assigned_attorney_id gracefully in count map', async () => {
    const casesWithNull = [
      { assigned_attorney_id: 'a1' },
      { assigned_attorney_id: null },  // unassigned case
    ];

    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: [ATTORNEYS[0]], error: null }
        : { data: casesWithNull, error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    const { attorneys } = res.json.mock.calls[0][0];
    expect(attorneys[0].activeCount).toBe(1);
  });

  test('returns 500 when attorney fetch fails', async () => {
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: null, error: { message: 'db error' } }).then(onFulfilled);

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test('formats attorney response correctly', async () => {
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: ATTORNEYS, error: null }
        : { data: [], error: null };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq();
    const res = makeRes();

    await operatorController.getAvailableAttorneys(req, res);

    const { attorneys } = res.json.mock.calls[0][0];
    expect(attorneys[0]).toMatchObject({
      id: 'a1',
      fullName: 'Alice Smith',
      email: 'alice@law.com',
      specializations: ['speeding'],
      jurisdictions: ['CA'],
      activeCount: 0,
    });
  });
});

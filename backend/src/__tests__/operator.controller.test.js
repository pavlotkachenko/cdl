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
  const plain = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in',
    'gte', 'lte', 'order', 'limit', 'head'];
  plain.forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(arrayResult).then(onFulfilled, onRejected);
  supabase.from.mockReturnValue(chain);
}

function makeReq(overrides = {}) {
  return {
    user: { id: 'op-1', role: 'operator' },
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
  test('returns cases with computed ageHours', async () => {
    const now = Date.now();
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();

    const cases = [
      { id: 'c1', case_number: 'CDL-001', status: 'new', state: 'CA',
        violation_type: 'speeding', created_at: oneHourAgo, customer_name: 'John Doe',
        attorney_price: null, driver: null },
    ];

    // First awaited chain call (cases query) → cases array
    // Second awaited chain call (assignedToday count) → { count: 2 }
    let callCount = 0;
    chain.then = (onFulfilled) => {
      callCount++;
      const result = callCount === 1
        ? { data: cases, error: null }
        : { data: null, error: null, count: 2 };
      return Promise.resolve(result).then(onFulfilled);
    };

    const req = makeReq({ query: { status: 'new' } });
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    const { cases: returned, summary } = res.json.mock.calls[0][0];
    expect(returned).toHaveLength(1);
    expect(returned[0].ageHours).toBeGreaterThanOrEqual(0);
    expect(summary.newCount).toBe(1);
    expect(summary.avgAgeHours).toBeGreaterThanOrEqual(0);
    expect(summary.assignedToday).toBe(2);
  });

  test('defaults to status=new when no query param provided', async () => {
    const req = makeReq({ query: {} });
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

    // Should query cases table with status eq 'new'
    expect(chain.eq).toHaveBeenCalledWith('status', 'new');
  });

  test('returns empty cases and zeroed summary when queue is empty', async () => {
    const req = makeReq({ query: { status: 'new' } });
    const res = makeRes();

    // Default: buildChain gives { data: [], error: null, count: 0 }
    await operatorController.getOperatorCases(req, res);

    const { cases: returned, summary } = res.json.mock.calls[0][0];
    expect(returned).toEqual([]);
    expect(summary.newCount).toBe(0);
    expect(summary.avgAgeHours).toBe(0);
  });

  test('returns 500 on supabase error', async () => {
    chain.then = (onFulfilled) =>
      Promise.resolve({ data: null, error: { message: 'db error' } }).then(onFulfilled);

    const req = makeReq();
    const res = makeRes();

    await operatorController.getOperatorCases(req, res);

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

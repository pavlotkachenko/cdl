'use strict';

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = require('../config/supabase');
const controller = require('../controllers/operatorDashboard.controller');

let chain;

function buildChain(arrayResult = { data: [], error: null }) {
  chain = {};
  ['select', 'eq', 'neq', 'not', 'in', 'or', 'gte', 'is', 'order', 'limit', 'range'].forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue({ data: null, error: null });
  chain.then = (onFulfilled) => Promise.resolve(arrayResult).then(onFulfilled);
  supabase.from.mockReturnValue(chain);
}

function makeReq(overrides = {}) {
  return { user: { id: 'op-1', role: 'operator' }, query: {}, params: {}, body: {}, ...overrides };
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
// getWorkloadStats
// ─────────────────────────────────────────────
describe('getWorkloadStats', () => {
  test('returns all workload fields', async () => {
    // Each supabase.from() call returns the chain; counts come from head-mode queries
    let callIndex = 0;
    supabase.from.mockImplementation(() => {
      const c = {};
      ['select', 'eq', 'neq', 'not', 'in', 'gte', 'is', 'order', 'limit'].forEach(m => {
        c[m] = jest.fn().mockReturnValue(c);
      });
      const counts = [67, 10, 8, 7, 5, 3]; // total, new, assigned, inProgress, resolved, today
      const idx = callIndex++;
      if (idx < 6) {
        // Count queries
        c.then = (onFulfilled) => Promise.resolve({ count: counts[idx], error: null }).then(onFulfilled);
      } else {
        // Closed cases for avg resolution
        c.then = (onFulfilled) => Promise.resolve({
          data: [
            { created_at: '2026-01-01T00:00:00Z', closed_at: '2026-01-11T00:00:00Z' },
          ],
          error: null,
        }).then(onFulfilled);
      }
      return c;
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getWorkloadStats(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.totalCases).toBe(67);
    expect(body.newCases).toBe(10);
    expect(body.assignedCases).toBe(8);
    expect(body.inProgressCases).toBe(7);
    expect(body.resolvedCases).toBe(5);
    expect(body.todaysCases).toBe(3);
    expect(body.averageResolutionTime).toBe(10);
  });

  test('returns 500 on error', async () => {
    supabase.from.mockImplementation(() => {
      throw new Error('DB down');
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getWorkloadStats(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─────────────────────────────────────────────
// getCaseQueue
// ─────────────────────────────────────────────
describe('getCaseQueue', () => {
  test('returns mapped case queue', async () => {
    const cases = [
      {
        id: 'c1', case_number: 'CDL-001', customer_name: 'Miguel',
        violation_type: 'speeding', violation_date: '2026-01-01',
        state: 'TX', status: 'new',
        created_at: new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(),
      },
    ];
    buildChain({ data: cases, count: 1, error: null });

    const req = makeReq();
    const res = makeRes();
    await controller.getCaseQueue(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.cases).toHaveLength(1);
    expect(body.cases[0]).toMatchObject({
      caseId: 'c1',
      driverName: 'Miguel',
      violationType: 'speeding',
      violationState: 'TX',
      status: 'new',
      priority: 'high', // 100 hours > 72
    });
    expect(body.total).toBe(1);
  });

  test('applies status filter', async () => {
    buildChain({ data: [], count: 0, error: null });

    const req = makeReq({ query: { status: 'new' } });
    const res = makeRes();
    await controller.getCaseQueue(req, res);

    expect(chain.eq).toHaveBeenCalledWith('status', 'new');
  });

  test('applies search filter', async () => {
    buildChain({ data: [], count: 0, error: null });

    const req = makeReq({ query: { search: 'miguel' } });
    const res = makeRes();
    await controller.getCaseQueue(req, res);

    expect(chain.or).toHaveBeenCalledWith(
      expect.stringContaining('customer_name.ilike.%miguel%')
    );
  });
});

// ─────────────────────────────────────────────
// getStatusDistribution
// ─────────────────────────────────────────────
describe('getStatusDistribution', () => {
  test('returns labels and values', async () => {
    buildChain({
      data: [{ status: 'new' }, { status: 'new' }, { status: 'closed' }],
      error: null,
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getStatusDistribution(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.labels).toContain('new');
    expect(body.labels).toContain('closed');
    expect(body.values[body.labels.indexOf('new')]).toBe(2);
    expect(body.values[body.labels.indexOf('closed')]).toBe(1);
  });
});

// ─────────────────────────────────────────────
// getViolationDistribution
// ─────────────────────────────────────────────
describe('getViolationDistribution', () => {
  test('returns labels and values', async () => {
    buildChain({
      data: [{ violation_type: 'speeding' }, { violation_type: 'speeding' }, { violation_type: 'parking' }],
      error: null,
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getViolationDistribution(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body.labels).toContain('speeding');
    expect(body.values[body.labels.indexOf('speeding')]).toBe(2);
  });
});

// ─────────────────────────────────────────────
// getAttorneyWorkload
// ─────────────────────────────────────────────
describe('getAttorneyWorkload', () => {
  test('returns attorney workload distribution', async () => {
    buildChain({
      data: [
        { attorney: { full_name: 'James W.' } },
        { attorney: { full_name: 'James W.' } },
        { attorney: { full_name: 'Sarah K.' } },
      ],
      error: null,
    });

    const req = makeReq();
    const res = makeRes();
    await controller.getAttorneyWorkload(req, res);

    const body = res.json.mock.calls[0][0];
    expect(body).toHaveLength(2);
    const james = body.find(a => a.name === 'James W.');
    expect(james.activeCases).toBe(2);
  });
});

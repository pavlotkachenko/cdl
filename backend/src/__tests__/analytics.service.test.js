'use strict';

jest.mock('../config/database', () => ({
  supabase: { from: jest.fn() }
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}), { virtual: true });

const { supabase } = require('../config/database');
const {
  getCaseAnalytics,
  getAttorneyAnalytics,
  getOperatorAnalytics
} = require('../services/analytics.service');

// --- Supabase chain mock ---
const chain = {
  select: jest.fn(),
  eq: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  single: jest.fn()
};

// Terminal result holder — set this per test to control what `await query` resolves to
let queryResult = { data: [], error: null };

function setupChain() {
  // Only call mockReturnValue on jest.fn() properties, not plain functions like `then`
  Object.keys(chain).filter(k => k !== 'then').forEach(k => chain[k].mockReturnValue(chain));
  supabase.from.mockReturnValue(chain);
  // Make the chain itself thenable (await query resolves to queryResult)
  chain.then = (resolve) => resolve(queryResult);
}

beforeEach(() => {
  jest.resetAllMocks();
  queryResult = { data: [], error: null };
  setupChain();
});

// ---------------------------------------------------------------------------
// getCaseAnalytics
// ---------------------------------------------------------------------------
describe('getCaseAnalytics', () => {
  test('returns zeroed summary for empty case array', async () => {
    queryResult = { data: [], error: null };
    const result = await getCaseAnalytics();

    expect(result.summary.totalCases).toBe(0);
    expect(result.summary.resolvedCases).toBe(0);
    expect(result.summary.totalRevenue).toBe(0);
    expect(result.summary.avgResolutionTime).toBe(0);
    expect(result.distributions.status).toEqual({});
  });

  test('counts status distribution correctly', async () => {
    queryResult = {
      data: [
        { status: 'new', violation_type: null, violation_state: null, outcome: null, fee_amount: null, closed_at: null, created_at: '2025-01-01T00:00:00Z' },
        { status: 'new', violation_type: null, violation_state: null, outcome: null, fee_amount: null, closed_at: null, created_at: '2025-01-02T00:00:00Z' },
        { status: 'closed', violation_type: null, violation_state: null, outcome: null, fee_amount: null, closed_at: null, created_at: '2025-01-03T00:00:00Z' }
      ],
      error: null
    };

    const result = await getCaseAnalytics();
    expect(result.distributions.status).toEqual({ new: 2, closed: 1 });
    expect(result.summary.totalCases).toBe(3);
  });

  test('avgResolutionTime only counts cases with status=closed AND closed_at set', async () => {
    const created = '2025-01-01T00:00:00Z';
    const closed = '2025-01-11T00:00:00Z'; // 10 days later

    queryResult = {
      data: [
        // closed with closed_at → counts
        { status: 'closed', closed_at: closed, created_at: created, fee_amount: null, violation_type: null, violation_state: null, outcome: null },
        // closed but no closed_at → does NOT count
        { status: 'closed', closed_at: null, created_at: created, fee_amount: null, violation_type: null, violation_state: null, outcome: null },
        // non-closed with closed_at → does NOT count
        { status: 'in_progress', closed_at: closed, created_at: created, fee_amount: null, violation_type: null, violation_state: null, outcome: null }
      ],
      error: null
    };

    const result = await getCaseAnalytics();
    expect(result.summary.resolvedCases).toBe(1);
    expect(result.summary.avgResolutionTime).toBe(10);
  });

  test('totalRevenue sums fee_amount across all cases (parseFloat safe)', async () => {
    queryResult = {
      data: [
        { status: 'new', fee_amount: '100.50', closed_at: null, created_at: '2025-01-01T00:00:00Z', violation_type: null, violation_state: null, outcome: null },
        { status: 'closed', fee_amount: '249.99', closed_at: null, created_at: '2025-01-01T00:00:00Z', violation_type: null, violation_state: null, outcome: null },
        { status: 'new', fee_amount: null, closed_at: null, created_at: '2025-01-01T00:00:00Z', violation_type: null, violation_state: null, outcome: null }
      ],
      error: null
    };

    const result = await getCaseAnalytics();
    expect(result.summary.totalRevenue).toBeCloseTo(350.49, 1);
  });

  test('throws when supabase returns an error', async () => {
    queryResult = { data: null, error: { message: 'DB failure' } };
    await expect(getCaseAnalytics()).rejects.toMatchObject({ message: 'DB failure' });
  });
});

// ---------------------------------------------------------------------------
// getAttorneyAnalytics
// ---------------------------------------------------------------------------
describe('getAttorneyAnalytics', () => {
  test('successRate is 0 when no closed cases exist', async () => {
    queryResult = {
      data: [
        { status: 'in_progress', outcome: null, fee_amount: null, closed_at: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', case_id: 'c1', case_number: 'C-001', violation_type: null }
      ],
      error: null
    };

    const result = await getAttorneyAnalytics('atty-1');
    expect(result.summary.successRate).toBe(0);
    expect(result.summary.closedCases).toBe(0);
  });

  test('successRate = wonCases / closedCases * 100', async () => {
    const makeCase = (status, outcome, closedAt = null) => ({
      status,
      outcome,
      closed_at: closedAt,
      fee_amount: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      case_id: Math.random(),
      case_number: 'C-X',
      violation_type: null
    });

    queryResult = {
      data: [
        makeCase('closed', 'dismissed', '2025-02-01T00:00:00Z'), // won
        makeCase('closed', 'dismissed', '2025-02-01T00:00:00Z'), // won
        makeCase('closed', 'lost', '2025-02-01T00:00:00Z'),      // not won
        makeCase('closed', null, '2025-02-01T00:00:00Z')         // not won
      ],
      error: null
    };

    const result = await getAttorneyAnalytics('atty-1');
    expect(result.summary.closedCases).toBe(4);
    // 2 won out of 4 closed = 50%
    expect(result.summary.successRate).toBe(50);
  });

  test('counts won outcomes: dismissed, reduced, won', async () => {
    const makeCase = (outcome) => ({
      status: 'closed',
      outcome,
      closed_at: '2025-02-01T00:00:00Z',
      fee_amount: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      case_id: Math.random(),
      case_number: 'C-X',
      violation_type: null
    });

    queryResult = {
      data: [
        makeCase('dismissed'),
        makeCase('reduced'),
        makeCase('won'),
        makeCase('lost')
      ],
      error: null
    };

    const result = await getAttorneyAnalytics('atty-1');
    // 3 won out of 4 closed = 75%
    expect(result.summary.successRate).toBe(75);
  });

  test('activeCases excludes closed, dismissed, withdrawn', async () => {
    queryResult = {
      data: [
        { status: 'in_progress', outcome: null, fee_amount: null, closed_at: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', case_id: 'c1', case_number: 'C-1', violation_type: null },
        { status: 'closed', outcome: null, fee_amount: null, closed_at: '2025-02-01T00:00:00Z', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', case_id: 'c2', case_number: 'C-2', violation_type: null },
        { status: 'dismissed', outcome: null, fee_amount: null, closed_at: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', case_id: 'c3', case_number: 'C-3', violation_type: null },
        { status: 'assigned', outcome: null, fee_amount: null, closed_at: null, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z', case_id: 'c4', case_number: 'C-4', violation_type: null }
      ],
      error: null
    };

    const result = await getAttorneyAnalytics('atty-1');
    expect(result.summary.activeCases).toBe(2); // in_progress + assigned
  });

  test('returns { attorneyId, summary, casesByStatus, recentActivity } shape', async () => {
    queryResult = { data: [], error: null };
    const result = await getAttorneyAnalytics('atty-1');
    expect(result).toHaveProperty('attorneyId', 'atty-1');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('casesByStatus');
    expect(result).toHaveProperty('recentActivity');
  });
});

// ---------------------------------------------------------------------------
// getOperatorAnalytics
// ---------------------------------------------------------------------------
describe('getOperatorAnalytics', () => {
  test('avgProcessingTime is hours from created_at to assigned_at', async () => {
    const created = '2025-01-01T00:00:00Z';
    const assigned = '2025-01-01T04:00:00Z'; // 4 hours later

    queryResult = {
      data: [
        { status: 'assigned', created_at: created, assigned_at: assigned },
        { status: 'new', created_at: created, assigned_at: null } // new → not counted
      ],
      error: null
    };

    const result = await getOperatorAnalytics('op-1');
    expect(result.summary.avgProcessingTime).toBe(4);
  });

  test('avgProcessingTime is 0 when no cases have been processed', async () => {
    queryResult = {
      data: [
        { status: 'new', created_at: '2025-01-01T00:00:00Z', assigned_at: null }
      ],
      error: null
    };

    const result = await getOperatorAnalytics('op-1');
    expect(result.summary.avgProcessingTime).toBe(0);
  });

  test('casesByStatus groups cases correctly', async () => {
    queryResult = {
      data: [
        { status: 'new', created_at: '2025-01-01T00:00:00Z', assigned_at: null },
        { status: 'new', created_at: '2025-01-01T00:00:00Z', assigned_at: null },
        { status: 'closed', created_at: '2025-01-01T00:00:00Z', assigned_at: '2025-01-01T01:00:00Z' }
      ],
      error: null
    };

    const result = await getOperatorAnalytics('op-1');
    expect(result.casesByStatus).toEqual({ new: 2, closed: 1 });
  });

  test('dailyActivity groups cases by creation date', async () => {
    queryResult = {
      data: [
        { status: 'new', created_at: '2025-01-15T10:00:00Z', assigned_at: null },
        { status: 'new', created_at: '2025-01-15T14:00:00Z', assigned_at: null },
        { status: 'assigned', created_at: '2025-01-16T09:00:00Z', assigned_at: '2025-01-16T10:00:00Z' }
      ],
      error: null
    };

    const result = await getOperatorAnalytics('op-1');
    expect(result.dailyActivity['2025-01-15']).toBe(2);
    expect(result.dailyActivity['2025-01-16']).toBe(1);
  });

  test('returns { operatorId, summary, casesByStatus, dailyActivity } shape', async () => {
    queryResult = { data: [], error: null };
    const result = await getOperatorAnalytics('op-1');
    expect(result).toHaveProperty('operatorId', 'op-1');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('casesByStatus');
    expect(result).toHaveProperty('dailyActivity');
  });
});

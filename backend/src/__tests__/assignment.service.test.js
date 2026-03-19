/**
 * Unit tests for assignment.service.js
 * Covers: calculateScore (pure algorithm), rankAttorneys + autoAssign (DB mocked)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────
const chain = {
  select: jest.fn(), insert: jest.fn(), update: jest.fn(),
  eq: jest.fn(), order: jest.fn(), limit: jest.fn(),
  single: jest.fn(), maybeSingle: jest.fn(), rpc: jest.fn(),
};
const mockFrom = jest.fn();
const mockRpc = jest.fn();

jest.mock('../config/database', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));
jest.mock('../utils/logger', () => ({
  info: jest.fn(), error: jest.fn(), warn: jest.fn(),
}));

const { calculateScore, rankAttorneys, autoAssign } = require('../services/assignment.service');

function setupChain() {
  ['select', 'insert', 'update', 'eq', 'order', 'limit'].forEach(m =>
    chain[m].mockReturnValue(chain)
  );
  mockFrom.mockReturnValue(chain);
}

beforeEach(() => {
  jest.resetAllMocks();
  setupChain();
});

// ── calculateScore (pure) ─────────────────────────────────────────────────────
describe('calculateScore', () => {
  const baseCase = { violation_type: 'speeding', violation_state: 'CA' };

  it('gives full specialization score when attorney specialization matches case type', () => {
    const attorney = {
      specializations: ['speeding', 'cdl'],
      state_licenses: ['CA'],
      current_cases_count: 0,
      success_rate: 1.0,
      availability_status: 'available',
    };
    const result = calculateScore(attorney, baseCase);
    expect(result.breakdown.specialization).toBe(100);
    expect(result.breakdown.stateLicense).toBe(100);
    expect(result.breakdown.workload).toBe(100);
    expect(result.breakdown.successRate).toBe(100);
    expect(result.breakdown.availability).toBe(100);
    expect(result.totalScore).toBe(100);
  });

  it('defaults specialization to 50 when attorney has no specialization data', () => {
    const attorney = {
      specializations: null,
      state_licenses: ['CA'],
      current_cases_count: 5,
      success_rate: 0.8,
      availability_status: 'available',
    };
    const result = calculateScore(attorney, baseCase);
    expect(result.breakdown.specialization).toBe(50);
  });

  it('gives 0 state license score when attorney not licensed in case state', () => {
    const attorney = {
      specializations: ['speeding'],
      state_licenses: ['TX', 'NY'],
      current_cases_count: 0,
      success_rate: 1.0,
      availability_status: 'available',
    };
    const result = calculateScore(attorney, baseCase);
    expect(result.breakdown.stateLicense).toBe(0);
  });

  it('caps workload score at 0 when attorney is overloaded (50+ cases)', () => {
    const attorney = {
      specializations: ['speeding'],
      state_licenses: ['CA'],
      current_cases_count: 50,
      success_rate: 0.9,
      availability_status: 'available',
    };
    const result = calculateScore(attorney, baseCase);
    expect(result.breakdown.workload).toBe(0);
  });

  it('gives partial workload score for moderate case load', () => {
    const attorney = {
      specializations: [],
      state_licenses: [],
      current_cases_count: 25,
      success_rate: 0,
      availability_status: 'unavailable',
    };
    const result = calculateScore(attorney, baseCase);
    expect(result.breakdown.workload).toBe(50);
  });

  it('maps availability_status to correct score', () => {
    const base = { specializations: [], state_licenses: [], current_cases_count: 0, success_rate: 0 };
    expect(calculateScore({ ...base, availability_status: 'available' }, baseCase).breakdown.availability).toBe(100);
    expect(calculateScore({ ...base, availability_status: 'limited' }, baseCase).breakdown.availability).toBe(60);
    expect(calculateScore({ ...base, availability_status: 'busy' }, baseCase).breakdown.availability).toBe(30);
    expect(calculateScore({ ...base, availability_status: 'unavailable' }, baseCase).breakdown.availability).toBe(0);
  });

  it('totalScore is a weighted sum rounded to 2 decimal places', () => {
    const attorney = {
      specializations: [],
      state_licenses: [],
      current_cases_count: 0,
      success_rate: 0,
      availability_status: 'unavailable',
    };
    const result = calculateScore(attorney, baseCase);
    // spec:50*0.30 + state:0*0.25 + workload:100*0.20 + success:0*0.15 + avail:0*0.10 = 15+0+20+0+0 = 35
    expect(result.totalScore).toBe(35);
  });
});

// ── rankAttorneys (DB mocked) ─────────────────────────────────────────────────
describe('rankAttorneys', () => {
  const mockCase = { case_id: 'c1', violation_type: 'speeding', violation_state: 'CA' };
  const attorneys = [
    {
      user_id: 'a1', first_name: 'Alice', last_name: 'Smith', email: 'a@test.com',
      specializations: ['speeding'], state_licenses: ['CA'],
      success_rate: 0.9, availability_status: 'available', current_cases_count: 5,
    },
    {
      user_id: 'a2', first_name: 'Bob', last_name: 'Jones', email: 'b@test.com',
      specializations: [], state_licenses: [],
      success_rate: 0.5, availability_status: 'busy', current_cases_count: 30,
    },
  ];

  it('returns attorneys sorted by score descending', async () => {
    chain.single.mockResolvedValueOnce({ data: mockCase, error: null });
    // attorneys query resolves directly (no .single())
    chain.eq.mockReturnValueOnce({
      ...chain,
      then: undefined,
      // final chained call resolves
      eq: jest.fn().mockResolvedValue({ data: attorneys, error: null }),
    });

    // Simpler: make the chain resolve with attorneys list on the last call
    jest.resetAllMocks();
    setupChain();
    chain.single.mockResolvedValueOnce({ data: mockCase, error: null });
    // The attorneys query: from().select().eq('role').eq('is_active') → resolves
    // eq calls: 1=case_id (case query), 2=role (attorneys), 3=is_active (attorneys, resolves)
    let callCount = 0;
    chain.eq.mockImplementation(() => {
      callCount++;
      if (callCount === 3) {
        return Promise.resolve({ data: attorneys, error: null });
      }
      return chain;
    });

    const ranked = await rankAttorneys('c1');

    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].userId).toBe('a1');
  });

  it('throws if case not found', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: new Error('not found') });

    await expect(rankAttorneys('missing')).rejects.toThrow();
  });
});

// ── autoAssign (DB mocked) ────────────────────────────────────────────────────
describe('autoAssign', () => {
  it('returns null when all attorneys are unavailable', async () => {
    const mockCase = { case_id: 'c1', violation_type: 'speeding', violation_state: 'CA' };
    chain.single.mockResolvedValueOnce({ data: mockCase, error: null });
    // attorneys all unavailable
    const unavailableAttorneys = [
      {
        user_id: 'a1', first_name: 'A', last_name: 'B', email: 'a@test.com',
        specializations: [], state_licenses: [], success_rate: 0,
        availability_status: 'unavailable', current_cases_count: 50,
      },
    ];
    // eq calls: 1=case_id (case query), 2=role (attorneys), 3=is_active (attorneys, resolves)
    let callCount = 0;
    chain.eq.mockImplementation(() => {
      callCount++;
      if (callCount === 3) return Promise.resolve({ data: unavailableAttorneys, error: null });
      return chain;
    });

    const result = await autoAssign('c1');
    expect(result).toBeNull();
  });
});

/**
 * Sprint 030 RT-1 — Rating Service + IN-3 email trigger tests
 */

jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));

const { supabase } = require('../config/supabase');

function buildChainFor(supabase, selectResult = { data: null, error: null }, upsertResult = { data: null, error: null }) {
  // First call (select cases) returns selectResult, second call (upsert ratings) returns upsertResult
  let callCount = 0;
  supabase.from.mockImplementation(() => {
    callCount++;
    const chain = {};
    ['select', 'eq', 'order', 'upsert'].forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
    chain.single = jest.fn().mockResolvedValue(callCount === 1 ? selectResult : upsertResult);
    chain.then = (onFulfilled) => Promise.resolve(callCount === 1 ? selectResult : upsertResult).then(onFulfilled);
    return chain;
  });
}

describe('Rating Service — createRating (RT-1)', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('throws when score is out of range', async () => {
    const { createRating } = require('../services/rating.service');
    await expect(createRating({ driverId: 'u1', caseId: 'c1', score: 6 }))
      .rejects.toThrow('Score must be between 1 and 5');
  });

  it('throws when case is not found', async () => {
    buildChainFor(supabase, { data: null, error: { message: 'not found' } });
    const { createRating } = require('../services/rating.service');
    await expect(createRating({ driverId: 'u1', caseId: 'c1', score: 4 }))
      .rejects.toThrow('Case not found');
  });

  it('throws Unauthorized when driver does not own the case', async () => {
    buildChainFor(supabase, {
      data: { id: 'c1', driver_id: 'other_driver', assigned_attorney_id: 'att1', status: 'closed' },
      error: null,
    });
    const { createRating } = require('../services/rating.service');
    await expect(createRating({ driverId: 'u1', caseId: 'c1', score: 4 }))
      .rejects.toThrow('Unauthorized');
  });

  it('throws when case is not yet resolved', async () => {
    buildChainFor(supabase, {
      data: { id: 'c1', driver_id: 'u1', assigned_attorney_id: 'att1', status: 'new' },
      error: null,
    });
    const { createRating } = require('../services/rating.service');
    await expect(createRating({ driverId: 'u1', caseId: 'c1', score: 4 }))
      .rejects.toThrow('Case must be resolved before rating');
  });

  it('creates a rating for a valid closed case', async () => {
    const mockRating = { id: 'r1', driver_id: 'u1', case_id: 'c1', attorney_id: 'att1', score: 5 };
    let callCount = 0;
    supabase.from.mockImplementation(() => {
      callCount++;
      const chain = {};
      ['select', 'eq', 'upsert', 'order'].forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
      if (callCount === 1) {
        chain.single = jest.fn().mockResolvedValue({
          data: { id: 'c1', driver_id: 'u1', assigned_attorney_id: 'att1', status: 'closed' },
          error: null,
        });
      } else {
        chain.single = jest.fn().mockResolvedValue({ data: mockRating, error: null });
      }
      return chain;
    });

    const { createRating } = require('../services/rating.service');
    const result = await createRating({ driverId: 'u1', caseId: 'c1', score: 5 });
    expect(result).toEqual(mockRating);
  });

  it('throws when no attorney is assigned', async () => {
    buildChainFor(supabase, {
      data: { id: 'c1', driver_id: 'u1', assigned_attorney_id: null, status: 'closed' },
      error: null,
    });
    const { createRating } = require('../services/rating.service');
    await expect(createRating({ driverId: 'u1', caseId: 'c1', score: 4 }))
      .rejects.toThrow('No attorney assigned to this case');
  });
});

describe('Rating Service — getAttorneyRating (RT-1)', () => {
  beforeEach(() => { jest.resetAllMocks(); });

  it('returns aggregate rating stats', async () => {
    const mockRatings = [
      { id: 'r1', score: 5, comment: 'Great', created_at: '2026-01-01', driver_id: 'u1' },
      { id: 'r2', score: 4, comment: null, created_at: '2026-01-02', driver_id: 'u2' },
    ];
    const chain = {};
    ['select', 'eq', 'order'].forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
    chain.then = (onFulfilled) => Promise.resolve({ data: mockRatings, error: null }).then(onFulfilled);
    supabase.from.mockReturnValue(chain);

    const { getAttorneyRating } = require('../services/rating.service');
    const result = await getAttorneyRating('att1');

    expect(result.attorney_id).toBe('att1');
    expect(result.total_ratings).toBe(2);
    expect(result.average_score).toBe(4.5);
    expect(result.ratings).toHaveLength(2);
  });

  it('returns null average_score when there are no ratings', async () => {
    const chain = {};
    ['select', 'eq', 'order'].forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
    chain.then = (onFulfilled) => Promise.resolve({ data: [], error: null }).then(onFulfilled);
    supabase.from.mockReturnValue(chain);

    const { getAttorneyRating } = require('../services/rating.service');
    const result = await getAttorneyRating('att_new');
    expect(result.average_score).toBeNull();
    expect(result.total_ratings).toBe(0);
  });
});

describe('Invoice Service — getInvoiceByCase (IN-1)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    jest.mock('../config/supabase', () => ({ supabase: { from: jest.fn() } }));
  });

  function buildInvoiceChain(supabase, result) {
    const chain = {};
    ['select', 'eq'].forEach(m => { chain[m] = jest.fn().mockReturnValue(chain); });
    chain.single = jest.fn().mockResolvedValue(result);
    supabase.from.mockReturnValue(chain);
  }

  it('returns null when case has no attorney_price', async () => {
    const { supabase } = require('../config/supabase');
    buildInvoiceChain(supabase, {
      data: {
        id: 'c1', case_number: 'CDL-001', customer_name: 'John', attorney_price: null,
        driver_id: 'u1', assigned_attorney_id: 'att1', status: 'closed',
        attorney: { full_name: 'Jane Doe', email: 'j@doe.com' },
      },
      error: null,
    });
    const { getInvoiceByCase } = require('../services/invoice.service');
    const result = await getInvoiceByCase('c1', 'u1', 'driver');
    expect(result).toBeNull();
  });

  it('throws Case not found when case does not exist', async () => {
    const { supabase } = require('../config/supabase');
    buildInvoiceChain(supabase, { data: null, error: { message: 'not found' } });
    const { getInvoiceByCase } = require('../services/invoice.service');
    await expect(getInvoiceByCase('bad', 'u1', 'driver')).rejects.toThrow('Case not found');
  });

  it('throws Unauthorized when driver requests another driver case', async () => {
    const { supabase } = require('../config/supabase');
    buildInvoiceChain(supabase, {
      data: {
        id: 'c1', case_number: 'CDL-001', customer_name: 'John', attorney_price: 500,
        driver_id: 'other_driver', assigned_attorney_id: 'att1', status: 'closed',
        attorney: { full_name: 'Jane', email: 'j@j.com' },
      },
      error: null,
    });
    const { getInvoiceByCase } = require('../services/invoice.service');
    await expect(getInvoiceByCase('c1', 'u1', 'driver')).rejects.toThrow('Unauthorized');
  });

  it('returns invoice with correct fields for authorized driver', async () => {
    const { supabase } = require('../config/supabase');
    buildInvoiceChain(supabase, {
      data: {
        id: 'c1', case_number: 'CDL-001', customer_name: 'John Doe', attorney_price: '250.00',
        attorney_price_set_at: '2026-01-15T00:00:00Z', violation_type: 'speeding',
        violation_date: '2026-01-01', state: 'TX', status: 'closed',
        driver_id: 'u1', assigned_attorney_id: 'att1',
        attorney: { full_name: 'Jane Smith', email: 'j@smith.com' },
      },
      error: null,
    });
    const { getInvoiceByCase } = require('../services/invoice.service');
    const result = await getInvoiceByCase('c1', 'u1', 'driver');
    expect(result).toMatchObject({
      invoice_number: expect.stringContaining('INV-'),
      amount: 250,
      currency: 'USD',
      attorney_name: 'Jane Smith',
    });
  });
});

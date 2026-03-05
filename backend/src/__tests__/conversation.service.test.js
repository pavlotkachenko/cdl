'use strict';

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() }
}));

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

const { supabase } = require('../config/supabase');
const { AppError } = require('../utils/errors');
const {
  getUserConversations,
  createConversation
} = require('../services/conversation.service');

// --- Supabase chain mock ---
const chain = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  or: jest.fn(),
  order: jest.fn(),
  range: jest.fn(),
  single: jest.fn(),
  maybeSingle: jest.fn()
};

function setupChain() {
  Object.keys(chain).forEach(k => chain[k].mockReturnValue(chain));
  supabase.from.mockReturnValue(chain);
}

beforeEach(() => {
  jest.resetAllMocks();
  setupChain();
});

// ---------------------------------------------------------------------------
// getUserConversations
// ---------------------------------------------------------------------------
describe('getUserConversations', () => {
  test('returns { conversations, total } shape', async () => {
    chain.range.mockResolvedValueOnce({
      data: [{ id: 'conv-1' }, { id: 'conv-2' }],
      error: null,
      count: 2
    });

    const result = await getUserConversations('user-1');
    expect(result).toHaveProperty('conversations');
    expect(result).toHaveProperty('total');
    expect(result.conversations).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  test('returns empty conversations array when none exist', async () => {
    chain.range.mockResolvedValueOnce({ data: null, error: null, count: 0 });

    const result = await getUserConversations('user-1');
    expect(result.conversations).toEqual([]);
    expect(result.total).toBe(0);
  });

  test('throws AppError 500 when DB returns error', async () => {
    chain.range.mockResolvedValueOnce({ data: null, error: { message: 'DB error' }, count: null });

    await expect(getUserConversations('user-1')).rejects.toThrow(AppError);
  });
});

// ---------------------------------------------------------------------------
// createConversation
// ---------------------------------------------------------------------------
describe('createConversation', () => {
  const params = { caseId: 'case-1', driverId: 'driver-1', attorneyId: 'atty-1' };

  test('throws AppError 400 when conversation already exists', async () => {
    // first single() → existing conversation found
    chain.single.mockResolvedValueOnce({ data: { id: 'existing-conv' }, error: null });

    await expect(createConversation(params)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('already exists')
    });
  });

  test('throws AppError 404 when case not found', async () => {
    // first single() → no existing conversation
    chain.single.mockResolvedValueOnce({ data: null, error: null });
    // second single() → case not found
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

    await expect(createConversation(params)).rejects.toMatchObject({
      statusCode: 404,
      message: expect.stringContaining('Case not found')
    });
  });

  test('throws AppError 403 when driverId does not match case.driver_id', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: null }); // no existing
    chain.single.mockResolvedValueOnce({
      data: {
        id: 'case-1',
        driver_id: 'different-driver',
        assigned_attorney_id: 'atty-1',
        status: 'in_progress'
      },
      error: null
    });

    await expect(createConversation(params)).rejects.toMatchObject({ statusCode: 403 });
  });

  test('throws AppError 400 when attorney is not assigned to the case', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: null }); // no existing
    chain.single.mockResolvedValueOnce({
      data: {
        id: 'case-1',
        driver_id: 'driver-1',
        assigned_attorney_id: 'different-atty',
        status: 'in_progress'
      },
      error: null
    });

    await expect(createConversation(params)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('Attorney not assigned')
    });
  });

  test('throws AppError 400 for a closed case', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: null }); // no existing
    chain.single.mockResolvedValueOnce({
      data: {
        id: 'case-1',
        driver_id: 'driver-1',
        assigned_attorney_id: 'atty-1',
        status: 'closed'
      },
      error: null
    });

    await expect(createConversation(params)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('closed')
    });
  });

  test('creates and returns conversation on happy path', async () => {
    const newConv = { id: 'new-conv', case_id: 'case-1', driver_id: 'driver-1', attorney_id: 'atty-1' };

    chain.single.mockResolvedValueOnce({ data: null, error: null }); // no existing
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', driver_id: 'driver-1', assigned_attorney_id: 'atty-1', status: 'in_progress' },
      error: null
    }); // case found
    chain.single.mockResolvedValueOnce({ data: newConv, error: null }); // insert

    const result = await createConversation(params);
    expect(result).toEqual(newConv);
  });
});

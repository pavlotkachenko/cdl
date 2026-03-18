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
  maybeSingle: jest.fn(),
  in: jest.fn()
};

function setupChain() {
  Object.keys(chain).forEach(k => chain[k].mockReturnValue(chain));
  supabase.from.mockReturnValue(chain);
}

/**
 * Prepend a resolveAuthUserId mock to chain.single.
 * The service calls resolveAuthUserId(userId) which does
 * supabase.from('users').select('auth_user_id').eq('id', userId).single()
 * We mock it to return the same ID (identity mapping in tests).
 */
function mockResolveAuth(userId) {
  chain.single.mockResolvedValueOnce({ data: { auth_user_id: userId }, error: null });
}

/**
 * Mock hydrateConversations / hydrateMessages user lookup (.in() query).
 * Returns empty data so hydration falls through gracefully.
 */
function mockHydrateUsers() {
  chain.in.mockResolvedValueOnce({ data: [] });
}

/** Mock hydrate cases lookup */
function mockHydrateCases() {
  chain.in.mockResolvedValueOnce({ data: [] });
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
    mockResolveAuth('user-1');
    chain.range.mockResolvedValueOnce({
      data: [{ id: 'conv-1' }, { id: 'conv-2' }],
      error: null,
      count: 2
    });
    // hydrate users + cases (empty in test)
    mockHydrateUsers();
    mockHydrateCases();

    const result = await getUserConversations('user-1');
    expect(result).toHaveProperty('conversations');
    expect(result).toHaveProperty('total');
    expect(result.conversations).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  test('returns empty conversations array when none exist', async () => {
    mockResolveAuth('user-1');
    chain.range.mockResolvedValueOnce({ data: null, error: null, count: 0 });

    const result = await getUserConversations('user-1');
    expect(result.conversations).toEqual([]);
    expect(result.total).toBe(0);
  });

  test('throws AppError 500 when DB returns error', async () => {
    mockResolveAuth('user-1');
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
    mockResolveAuth('driver-1');  // resolve driverId
    mockResolveAuth('atty-1');    // resolve attorneyId
    // first single() → existing conversation found
    chain.single.mockResolvedValueOnce({ data: { id: 'existing-conv' }, error: null });

    await expect(createConversation(params)).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('already exists')
    });
  });

  test('throws AppError 404 when case not found', async () => {
    mockResolveAuth('driver-1');
    mockResolveAuth('atty-1');
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
    mockResolveAuth('driver-1');
    mockResolveAuth('atty-1');
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
    mockResolveAuth('driver-1');
    mockResolveAuth('atty-1');
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
    mockResolveAuth('driver-1');
    mockResolveAuth('atty-1');
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

    mockResolveAuth('driver-1');
    mockResolveAuth('atty-1');
    chain.single.mockResolvedValueOnce({ data: null, error: null }); // no existing
    chain.single.mockResolvedValueOnce({
      data: { id: 'case-1', driver_id: 'driver-1', assigned_attorney_id: 'atty-1', status: 'in_progress' },
      error: null
    }); // case found
    chain.single.mockResolvedValueOnce({ data: newConv, error: null }); // insert
    // hydrate users + cases
    mockHydrateUsers();
    mockHydrateCases();

    const result = await createConversation(params);
    expect(result.id).toBe('new-conv');
  });
});

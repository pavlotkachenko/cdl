/**
 * Tests for webhook.service.js — Sprint 036 WH-4
 */

jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    // then/catch on the mock object so the service chain works
    then: jest.fn().mockReturnValue({ catch: jest.fn() }),
    catch: jest.fn(),
  },
}));

global.fetch = jest.fn();

const { signPayload, dispatch } = require('../services/webhook.service');
const { supabase } = require('../config/supabase');

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch.mockResolvedValue({ ok: true });
  // Restore then/catch chain defaults
  supabase.then.mockReturnValue({ catch: jest.fn() });
});

// ── signPayload ────────────────────────────────────────────────────────────────

describe('signPayload()', () => {
  it('returns a sha256= prefixed HMAC string', () => {
    const sig = signPayload('mysecret', 'hello');
    expect(sig).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it('produces different signatures for different secrets', () => {
    const s1 = signPayload('secret1', 'payload');
    const s2 = signPayload('secret2', 'payload');
    expect(s1).not.toBe(s2);
  });

  it('produces different signatures for different payloads', () => {
    const s1 = signPayload('secret', 'payload1');
    const s2 = signPayload('secret', 'payload2');
    expect(s1).not.toBe(s2);
  });
});

// ── dispatch ──────────────────────────────────────────────────────────────────

describe('dispatch()', () => {
  it('does nothing when carrierId is falsy', () => {
    dispatch(null, 'case.created', {});
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('queries carrier_webhooks filtered by carrier and event', () => {
    dispatch('carrier-uuid', 'case.created', { caseId: '123' });
    expect(supabase.from).toHaveBeenCalledWith('carrier_webhooks');
    expect(supabase.eq).toHaveBeenCalledWith('carrier_id', 'carrier-uuid');
    expect(supabase.eq).toHaveBeenCalledWith('active', true);
    expect(supabase.contains).toHaveBeenCalledWith('events', ['case.created']);
  });
});

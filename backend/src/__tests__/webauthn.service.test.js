/**
 * Tests for webauthn.service.js — Sprint 037 BIO-3
 */

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn().mockResolvedValue({ challenge: 'reg-challenge', rpID: 'localhost' }),
  verifyRegistrationResponse: jest.fn().mockResolvedValue({
    verified: true,
    registrationInfo: {
      credential: { id: Buffer.from('cred-id'), publicKey: Buffer.from('pub-key'), counter: 0 },
      credentialDeviceType: 'singleDevice',
    },
  }),
  generateAuthenticationOptions: jest.fn().mockResolvedValue({ challenge: 'auth-challenge' }),
  verifyAuthenticationResponse: jest.fn().mockResolvedValue({
    verified: true,
    authenticationInfo: { newCounter: 1 },
  }),
}));

jest.mock('jsonwebtoken', () => ({ sign: jest.fn().mockReturnValue('mock-jwt') }));

// Supabase mock — single is the key terminal; eq chains back to the mock object
jest.mock('../config/supabase', () => {
  const single = jest.fn();
  const mock = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single,
  };
  return { supabase: mock };
});

const { supabase } = require('../config/supabase');
const {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  _storeChallenge,
  _consumeChallenge,
} = require('../services/webauthn.service');

beforeEach(() => {
  jest.clearAllMocks();
  supabase.eq.mockReturnThis();
  supabase.single.mockResolvedValue({ data: null, error: null });
});

// ── Challenge store ────────────────────────────────────────────────────────────

describe('challenge store', () => {
  it('stores and retrieves a challenge', () => {
    _storeChallenge('user-1', 'my-challenge');
    expect(_consumeChallenge('user-1')).toBe('my-challenge');
  });

  it('returns null after challenge is consumed', () => {
    _storeChallenge('user-2', 'challenge');
    _consumeChallenge('user-2');
    expect(_consumeChallenge('user-2')).toBeNull();
  });
});

// ── getRegistrationOptions ────────────────────────────────────────────────────

describe('getRegistrationOptions()', () => {
  it('returns options with a challenge', async () => {
    // Creds lookup: from().select().eq() — eq returns mock, await mock = mock, data = undefined → []
    supabase.eq.mockResolvedValueOnce({ data: [], error: null });
    const opts = await getRegistrationOptions({ id: 'u1', email: 'a@b.com', full_name: 'Alice' });
    expect(opts).toHaveProperty('challenge', 'reg-challenge');
  });
});

// ── verifyRegistration ────────────────────────────────────────────────────────

describe('verifyRegistration()', () => {
  it('stores credential and returns verified:true', async () => {
    _storeChallenge('u1', 'reg-challenge');
    supabase.insert.mockResolvedValueOnce({ error: null });
    const result = await verifyRegistration('u1', { id: 'cred-id', response: {} });
    expect(result).toEqual({ verified: true });
  });

  it('throws when challenge is missing', async () => {
    await expect(verifyRegistration('no-challenge-user', {})).rejects.toThrow('Challenge expired');
  });
});

// ── getAuthenticationOptions ──────────────────────────────────────────────────

describe('getAuthenticationOptions()', () => {
  it('returns challenge matching stored credentials', async () => {
    // User lookup: from('users').select().eq('email').single()
    // eq returns this (supabase), then single() resolves
    supabase.single.mockResolvedValueOnce({ data: { id: 'u1' }, error: null });
    // Creds lookup: from('webauthn_credentials').select().eq('user_id') — terminal eq
    supabase.eq
      .mockReturnValueOnce(supabase)  // first eq: email lookup, chains to .single()
      .mockResolvedValueOnce({ data: [{ credential_id: 'cred-id' }], error: null }); // second eq: terminal
    const { options } = await getAuthenticationOptions('a@b.com');
    expect(options).toHaveProperty('challenge', 'auth-challenge');
  });

  it('throws when no credentials registered for user', async () => {
    supabase.single.mockResolvedValueOnce({ data: { id: 'u2' }, error: null });
    supabase.eq
      .mockReturnValueOnce(supabase)
      .mockResolvedValueOnce({ data: [], error: null });
    await expect(getAuthenticationOptions('b@b.com')).rejects.toThrow('No credentials');
  });
});

// ── verifyAuthentication ──────────────────────────────────────────────────────

describe('verifyAuthentication()', () => {
  it('returns JWT token on success', async () => {
    // eq calls in order:
    // 1. .eq('email', email)   → chains to .single() for user lookup
    // 2. .eq('user_id', ...)   → chains in creds lookup
    // 3. .eq('credential_id') → chains to .single() for creds lookup
    // 4. .eq('user_id', ...)   → update chain
    // 5. .eq('credential_id') → update chain terminal
    supabase.eq
      .mockReturnValueOnce(supabase)                                   // 1: email
      .mockReturnValueOnce(supabase)                                   // 2: user_id (creds)
      .mockReturnValueOnce(supabase)                                   // 3: credential_id (creds)
      .mockReturnValueOnce(supabase)                                   // 4: user_id (update)
      .mockResolvedValueOnce({ error: null });                         // 5: credential_id (update, terminal)

    supabase.single
      .mockResolvedValueOnce({ data: { id: 'u1', role: 'driver', full_name: 'Alice', carrier_id: null }, error: null })
      .mockResolvedValueOnce({ data: { credential_id: 'cred-id', public_key: 'cHViLWtleQ==', counter: 0 }, error: null });

    _storeChallenge('u1', 'auth-challenge');
    const result = await verifyAuthentication('a@b.com', { id: 'cred-id', response: {} });
    expect(result).toHaveProperty('token', 'mock-jwt');
  });

  it('throws when authentication verification fails', async () => {
    const { verifyAuthenticationResponse } = require('@simplewebauthn/server');
    verifyAuthenticationResponse.mockResolvedValueOnce({ verified: false });

    supabase.eq
      .mockReturnValueOnce(supabase)
      .mockReturnValueOnce(supabase)
      .mockReturnValueOnce(supabase);

    supabase.single
      .mockResolvedValueOnce({ data: { id: 'u1', role: 'driver', full_name: 'Alice', carrier_id: null }, error: null })
      .mockResolvedValueOnce({ data: { credential_id: 'cred-id', public_key: 'cHViLWtleQ==', counter: 0 }, error: null });

    _storeChallenge('u1', 'auth-challenge');
    await expect(verifyAuthentication('a@b.com', { id: 'cred-id' })).rejects.toThrow('verification failed');
  });
});

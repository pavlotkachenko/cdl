'use strict';

process.env.JWT_SECRET = 'test-jwt-secret-32chars-padding!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32chars-pad!!';

jest.mock('../config/supabase', () => ({
  supabase: { from: jest.fn() }
}));

jest.mock('bcrypt');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {
  validatePasswordStrength,
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  verifyResetToken
} = require('../services/auth.service');

const { supabase } = require('../config/supabase');

// --- Supabase chain mock ---
const chain = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  eq: jest.fn(),
  gt: jest.fn(),
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
// validatePasswordStrength — pure function
// ---------------------------------------------------------------------------
describe('validatePasswordStrength', () => {
  test('returns valid for a strong password', () => {
    const result = validatePasswordStrength('SecurePass1!');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('fails when password is too short', () => {
    const { valid, errors } = validatePasswordStrength('Ab1!');
    expect(valid).toBe(false);
    expect(errors).toContain('Password must be at least 8 characters long');
  });

  test('fails when no uppercase letter', () => {
    const { valid, errors } = validatePasswordStrength('securepass1!');
    expect(valid).toBe(false);
    expect(errors).toContain('Password must contain at least one uppercase letter');
  });

  test('fails when no lowercase letter', () => {
    const { valid, errors } = validatePasswordStrength('SECUREPASS1!');
    expect(valid).toBe(false);
    expect(errors).toContain('Password must contain at least one lowercase letter');
  });

  test('fails when no number', () => {
    const { valid, errors } = validatePasswordStrength('SecurePass!!');
    expect(valid).toBe(false);
    expect(errors).toContain('Password must contain at least one number');
  });

  test('fails when no special character', () => {
    const { valid, errors } = validatePasswordStrength('SecurePass1');
    expect(valid).toBe(false);
    expect(errors).toContain('Password must contain at least one special character');
  });

  test('returns multiple errors for empty password', () => {
    const { valid, errors } = validatePasswordStrength('');
    expect(valid).toBe(false);
    expect(errors.length).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// hashPassword
// ---------------------------------------------------------------------------
describe('hashPassword', () => {
  test('calls bcrypt with SALT_ROUNDS=12 and returns hash', async () => {
    bcrypt.genSalt.mockResolvedValue('salt');
    bcrypt.hash.mockResolvedValue('$2b$12$hashed');

    const result = await hashPassword('myPassword');

    expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
    expect(bcrypt.hash).toHaveBeenCalledWith('myPassword', 'salt');
    expect(result).toBe('$2b$12$hashed');
  });

  test('throws "Failed to hash password" when bcrypt errors', async () => {
    bcrypt.genSalt.mockRejectedValue(new Error('bcrypt error'));
    await expect(hashPassword('myPassword')).rejects.toThrow('Failed to hash password');
  });
});

// ---------------------------------------------------------------------------
// comparePassword
// ---------------------------------------------------------------------------
describe('comparePassword', () => {
  test('returns true when password matches hash', async () => {
    bcrypt.compare.mockResolvedValue(true);
    expect(await comparePassword('plain', '$hash')).toBe(true);
  });

  test('returns false when password does not match', async () => {
    bcrypt.compare.mockResolvedValue(false);
    expect(await comparePassword('wrong', '$hash')).toBe(false);
  });

  test('throws "Failed to compare passwords" on bcrypt error', async () => {
    bcrypt.compare.mockRejectedValue(new Error('err'));
    await expect(comparePassword('p', 'h')).rejects.toThrow('Failed to compare passwords');
  });
});

// ---------------------------------------------------------------------------
// generateAccessToken
// ---------------------------------------------------------------------------
describe('generateAccessToken', () => {
  test('token contains correct claims (id, role, email, type)', () => {
    const token = generateAccessToken('user-123', 'driver', 'test@example.com');
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'cdl-platform',
      audience: 'cdl-api'
    });

    expect(decoded.id).toBe('user-123');
    expect(decoded.role).toBe('driver');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.type).toBe('access');
  });

  test('token expires in ~15 minutes', () => {
    const before = Math.floor(Date.now() / 1000);
    const token = generateAccessToken('u', 'driver', 'e@e.com');
    const decoded = jwt.decode(token);
    const ttl = decoded.exp - before;

    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(15 * 60);
  });

  test('token has correct issuer and audience', () => {
    const token = generateAccessToken('u', 'attorney', 'a@a.com');
    const decoded = jwt.decode(token);
    expect(decoded.iss).toBe('cdl-platform');
    expect(decoded.aud).toBe('cdl-api');
  });
});

// ---------------------------------------------------------------------------
// generateRefreshToken
// ---------------------------------------------------------------------------
describe('generateRefreshToken', () => {
  test('returns token and tokenId', () => {
    const result = generateRefreshToken('user-abc');
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('tokenId');
    expect(typeof result.token).toBe('string');
    expect(typeof result.tokenId).toBe('string');
  });

  test('decoded refresh token has type=refresh', () => {
    const { token } = generateRefreshToken('user-abc');
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'cdl-platform',
      audience: 'cdl-api'
    });
    expect(decoded.type).toBe('refresh');
    expect(decoded.id).toBe('user-abc');
  });
});

// ---------------------------------------------------------------------------
// verifyRefreshToken
// ---------------------------------------------------------------------------
describe('verifyRefreshToken', () => {
  test('returns decoded payload for a valid token', () => {
    const { token } = generateRefreshToken('user-xyz');
    const decoded = verifyRefreshToken(token);
    expect(decoded.id).toBe('user-xyz');
    expect(decoded.type).toBe('refresh');
  });

  test('throws "Invalid or expired refresh token" for garbage input', () => {
    expect(() => verifyRefreshToken('not.a.token')).toThrow('Invalid or expired refresh token');
  });

  test('throws for token signed with wrong secret', () => {
    const fakeToken = jwt.sign({ id: 'x', type: 'refresh' }, 'wrong-secret', {
      issuer: 'cdl-platform',
      audience: 'cdl-api'
    });
    expect(() => verifyRefreshToken(fakeToken)).toThrow('Invalid or expired refresh token');
  });
});

// ---------------------------------------------------------------------------
// verifyResetToken
// ---------------------------------------------------------------------------
describe('verifyResetToken', () => {
  test('throws "Invalid reset token" when DB returns error/null', async () => {
    chain.single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    await expect(verifyResetToken('some-raw-token')).rejects.toThrow('Invalid reset token');
  });

  test('throws "Reset token already used" when used_at is set', async () => {
    chain.single.mockResolvedValueOnce({
      data: {
        user_id: 'u1',
        expires_at: new Date(Date.now() + 100_000).toISOString(),
        used_at: new Date().toISOString()
      },
      error: null
    });
    await expect(verifyResetToken('used-token')).rejects.toThrow('Reset token already used');
  });

  test('throws "Reset token expired" when expires_at is in the past', async () => {
    chain.single.mockResolvedValueOnce({
      data: {
        user_id: 'u1',
        expires_at: new Date(Date.now() - 1000).toISOString(),
        used_at: null
      },
      error: null
    });
    await expect(verifyResetToken('expired-token')).rejects.toThrow('Reset token expired');
  });

  test('returns userId for a valid, unused, unexpired token', async () => {
    chain.single.mockResolvedValueOnce({
      data: {
        user_id: 'user-valid',
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
        used_at: null
      },
      error: null
    });
    const userId = await verifyResetToken('valid-token');
    expect(userId).toBe('user-valid');
  });
});

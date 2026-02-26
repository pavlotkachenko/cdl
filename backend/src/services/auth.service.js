// ============================================
// AUTHENTICATION SERVICE
// Core authentication logic and password management
// ============================================

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { supabase } = require('../config/supabase');

const SALT_ROUNDS = 12;
const JWT_ACCESS_EXPIRY = '15m';
const JWT_REFRESH_EXPIRY = '7d';
const RESET_TOKEN_EXPIRY = 3600000; // 1 hour in ms

/**
 * Hash password with bcrypt
 * @param {String} password - Plain text password
 * @returns {Promise<String>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Password hashing error:', error);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare password with hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password
 * @returns {Promise<Boolean>} True if match
 */
const comparePassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password comparison error:', error);
    throw new Error('Failed to compare passwords');
  }
};

/**
 * Generate JWT access token
 * @param {String} userId - User ID
 * @param {String} role - User role
 * @param {String} email - User email
 * @returns {String} JWT access token
 */
const generateAccessToken = (userId, role, email) => {
  const payload = {
    id: userId,
    role: role,
    email: email,
    type: 'access'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRY,
    issuer: 'cdl-platform',
    audience: 'cdl-api'
  });
};

/**
 * Generate JWT refresh token
 * @param {String} userId - User ID
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (userId) => {
  const tokenId = crypto.randomUUID();
  
  const payload = {
    id: userId,
    tokenId: tokenId,
    type: 'refresh'
  };

  return {
    token: jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRY,
      issuer: 'cdl-platform',
      audience: 'cdl-api'
    }),
    tokenId: tokenId
  };
};

/**
 * Verify refresh token
 * @param {String} token - Refresh token
 * @returns {Object} Decoded token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      issuer: 'cdl-platform',
      audience: 'cdl-api'
    });
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Store refresh token in database
 * @param {String} userId - User ID
 * @param {String} tokenId - Token ID
 * @param {Date} expiresAt - Expiration date
 */
const storeRefreshToken = async (userId, tokenId, expiresAt) => {
  const tokenHash = crypto.createHash('sha256').update(tokenId).digest('hex');
  
  const { error } = await supabase
    .from('refresh_tokens')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

  if (error) {
    console.error('Store refresh token error:', error);
    throw new Error('Failed to store refresh token');
  }
};

/**
 * Verify refresh token exists in database
 * @param {String} userId - User ID
 * @param {String} tokenId - Token ID
 * @returns {Promise<Boolean>} True if valid
 */
const verifyRefreshTokenInDb = async (userId, tokenId) => {
  const tokenHash = crypto.createHash('sha256').update(tokenId).digest('hex');
  
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return false;
  }

  return true;
};

/**
 * Invalidate refresh token
 * @param {String} userId - User ID
 * @param {String} tokenId - Token ID
 */
const invalidateRefreshToken = async (userId, tokenId) => {
  const tokenHash = crypto.createHash('sha256').update(tokenId).digest('hex');
  
  const { error } = await supabase
    .from('refresh_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token_hash', tokenHash);

  if (error) {
    console.error('Invalidate refresh token error:', error);
    throw new Error('Failed to invalidate refresh token');
  }
};

/**
 * Invalidate all user refresh tokens (logout from all devices)
 * @param {String} userId - User ID
 */
const invalidateAllRefreshTokens = async (userId) => {
  const { error } = await supabase
    .from('refresh_tokens')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Invalidate all tokens error:', error);
    throw new Error('Failed to invalidate tokens');
  }
};

/**
 * Generate password reset token
 * @returns {String} Reset token
 */
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Store password reset token
 * @param {String} userId - User ID
 * @param {String} token - Reset token
 * @returns {Promise<void>}
 */
const storeResetToken = async (userId, token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY);

  // Invalidate existing reset tokens
  await supabase
    .from('password_reset_tokens')
    .delete()
    .eq('user_id', userId);

  const { error } = await supabase
    .from('password_reset_tokens')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

  if (error) {
    console.error('Store reset token error:', error);
    throw new Error('Failed to store reset token');
  }
};

/**
 * Verify password reset token
 * @param {String} token - Reset token
 * @returns {Promise<String>} User ID if valid
 */
const verifyResetToken = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { data, error } = await supabase
    .from('password_reset_tokens')
    .select('user_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !data) {
    throw new Error('Invalid reset token');
  }

  if (data.used_at) {
    throw new Error('Reset token already used');
  }

  if (new Date(data.expires_at) < new Date()) {
    throw new Error('Reset token expired');
  }

  return data.user_id;
};

/**
 * Mark reset token as used
 * @param {String} token - Reset token
 */
const markResetTokenAsUsed = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { error } = await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);

  if (error) {
    console.error('Mark reset token used error:', error);
  }
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Generate email verification token
 * @returns {String} Verification token
 */
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Store email verification token
 * @param {String} userId - User ID
 * @param {String} token - Verification token
 */
const storeEmailVerificationToken = async (userId, token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 86400000); // 24 hours

  const { error } = await supabase
    .from('email_verification_tokens')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt
    });

  if (error) {
    console.error('Store verification token error:', error);
    throw new Error('Failed to store verification token');
  }
};

/**
 * Verify email verification token
 * @param {String} token - Verification token
 * @returns {Promise<String>} User ID if valid
 */
const verifyEmailToken = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { data, error } = await supabase
    .from('email_verification_tokens')
    .select('user_id, expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !data) {
    throw new Error('Invalid verification token');
  }

  if (new Date(data.expires_at) < new Date()) {
    throw new Error('Verification token expired');
  }

  // Delete the token after verification
  await supabase
    .from('email_verification_tokens')
    .delete()
    .eq('token_hash', tokenHash);

  return data.user_id;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  storeRefreshToken,
  verifyRefreshTokenInDb,
  invalidateRefreshToken,
  invalidateAllRefreshTokens,
  generateResetToken,
  storeResetToken,
  verifyResetToken,
  markResetTokenAsUsed,
  validatePasswordStrength,
  generateEmailVerificationToken,
  storeEmailVerificationToken,
  verifyEmailToken
};

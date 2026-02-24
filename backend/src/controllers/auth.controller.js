// ============================================
// AUTHENTICATION CONTROLLER
// Handles user registration, login, logout, password reset
// ============================================

const { validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const authService = require('../services/auth.service');

/**
 * Register new user
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    const { email, password, full_name, phone, role = 'driver' } = req.body;

    // Validate password strength
    const passwordValidation = authService.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Weak Password',
        errors: passwordValidation.errors
      });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({
        error: 'User Exists',
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await authService.hashPassword(password);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        full_name,
        phone,
        role,
        is_active: true,
        email_verified: false
      })
      .select()
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      return res.status(500).json({
        error: 'Registration Failed',
        message: 'Failed to create user account'
      });
    }

    // Generate email verification token
    const verificationToken = authService.generateEmailVerificationToken();
    await authService.storeEmailVerificationToken(newUser.id, verificationToken);

    // TODO: Send verification email
    // await emailService.sendVerificationEmail(email, verificationToken);

    // Generate tokens
    const accessToken = authService.generateAccessToken(newUser.id, newUser.role, newUser.email);
    const { token: refreshToken, tokenId } = authService.generateRefreshToken(newUser.id);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await authService.storeRefreshToken(newUser.id, tokenId, expiresAt);

    // Remove sensitive data
    delete newUser.password_hash;

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      user: newUser,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed'
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Get user from database
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !user) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Account Inactive',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await authService.comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate tokens
    const accessToken = authService.generateAccessToken(user.id, user.role, user.email);
    const { token: refreshToken, tokenId } = authService.generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await authService.storeRefreshToken(user.id, tokenId, expiresAt);

    // Remove sensitive data
    delete user.password_hash;

    res.json({
      message: 'Login successful',
      user,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    });
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token required'
      });
    }

    // Verify and decode refresh token
    try {
      const decoded = authService.verifyRefreshToken(refreshToken);
      await authService.invalidateRefreshToken(decoded.id, decoded.tokenId);
    } catch (error) {
      // Token might be invalid, but we still return success
      console.warn('Logout with invalid token:', error.message);
    }

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed'
    });
  }
};

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token required'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = authService.verifyRefreshToken(refreshToken);
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Invalid or expired refresh token'
      });
    }

    // Verify token exists in database
    const isValid = await authService.verifyRefreshTokenInDb(decoded.id, decoded.tokenId);
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Refresh token not found or expired'
      });
    }

    // Get user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (fetchError || !user || !user.is_active) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found or inactive'
      });
    }

    // Generate new access token
    const newAccessToken = authService.generateAccessToken(user.id, user.role, user.email);

    res.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Token refresh failed'
    });
  }
};

/**
 * Forgot password - Send reset email
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Get user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success even if user not found (security best practice)
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = authService.generateResetToken();
    await authService.storeResetToken(user.id, resetToken);

    // TODO: Send reset email
    // await emailService.sendPasswordResetEmail(user.email, user.full_name, resetToken);

    console.log(`Password reset token for ${email}: ${resetToken}`); // For development

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Password reset request failed'
    });
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    const { token, newPassword } = req.body;

    // Validate password strength
    const passwordValidation = authService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Weak Password',
        errors: passwordValidation.errors
      });
    }

    // Verify reset token
    let userId;
    try {
      userId = await authService.verifyResetToken(token);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid Token',
        message: error.message
      });
    }

    // Hash new password
    const hashedPassword = await authService.hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({
        error: 'Update Failed',
        message: 'Failed to update password'
      });
    }

    // Mark token as used
    await authService.markResetTokenAsUsed(token);

    // Invalidate all refresh tokens (logout from all devices)
    await authService.invalidateAllRefreshTokens(userId);

    res.json({
      message: 'Password reset successful. Please login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Password reset failed'
    });
  }
};

/**
 * Verify email with token
 * POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Verification token required'
      });
    }

    // Verify token
    let userId;
    try {
      userId = await authService.verifyEmailToken(token);
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid Token',
        message: error.message
      });
    }

    // Update user email_verified status
    const { error: updateError } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', userId);

    if (updateError) {
      console.error('Email verification update error:', updateError);
      return res.status(500).json({
        error: 'Verification Failed',
        message: 'Failed to verify email'
      });
    }

    res.json({
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Email verification failed'
    });
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, is_active, email_verified, created_at, last_login')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    res.json({
      user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user profile'
    });
  }
};

module.exports = exports;

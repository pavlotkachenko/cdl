// ============================================
// AUTHENTICATION ROUTES
// Complete auth endpoints with validation
// ============================================

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register new user
 */
router.post('/register',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('full_name')
      .trim()
      .notEmpty()
      .withMessage('Full name required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Full name must be between 2 and 100 characters'),
    body('phone')
      .optional()
      .matches(/^[\d\s\-\(\)\+]+$/)
      .withMessage('Invalid phone number format'),
    body('role')
      .optional()
      .isIn(['driver', 'operator', 'attorney', 'admin'])
      .withMessage('Invalid role')
  ],
  authController.register
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password required')
  ],
  authController.login
);

/**
 * POST /api/auth/logout
 * Logout user (invalidate refresh token)
 */
router.post('/logout',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token required')
  ],
  authController.logout
);

/**
 * POST /api/auth/refresh-token
 * Refresh access token
 */
router.post('/refresh-token',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token required')
  ],
  authController.refreshToken
);

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password',
  [
    body('email')
      .isEmail()
      .withMessage('Valid email required')
      .normalizeEmail()
  ],
  authController.forgotPassword
);

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
  ],
  authController.resetPassword
);

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email',
  [
    body('token')
      .notEmpty()
      .withMessage('Verification token required')
  ],
  authController.verifyEmail
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me',
  authenticate,
  authController.getCurrentUser
);

module.exports = router;

// ============================================
// User Routes
// ============================================
// User management endpoints

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      res.json({ 
        message: 'User list endpoint ready',
        users: []
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me',
  authenticate,
  async (req, res) => {
    try {
      res.json({ user: req.user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PATCH /api/users/me/preferences
 * Update current user notification preferences (e.g. sms_opt_in).
 */
router.patch('/me/preferences',
  authenticate,
  async (req, res) => {
    try {
      const { sms_opt_in } = req.body;

      if (typeof sms_opt_in !== 'boolean') {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'sms_opt_in must be a boolean' },
        });
      }

      const { data, error } = await supabase
        .from('users')
        .update({ sms_opt_in })
        .eq('id', req.user.id)
        .select('id, sms_opt_in')
        .single();

      if (error) {
        console.error('[PATCH /me/preferences] DB error:', error.message);
        return res.status(500).json({
          error: { code: 'SERVER_ERROR', message: 'Failed to update preferences' },
        });
      }

      res.json({ preferences: { sms_opt_in: data.sms_opt_in } });
    } catch (err) {
      console.error('[PATCH /me/preferences]', err.message);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
    }
  }
);

/**
 * PATCH /api/users/me/push-token
 * Register or update the OneSignal push token for the current user.
 */
router.patch('/me/push-token',
  authenticate,
  async (req, res) => {
    try {
      const { push_token } = req.body;

      if (!push_token || typeof push_token !== 'string') {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'push_token must be a non-empty string' },
        });
      }

      const { error } = await supabase
        .from('users')
        .update({ push_token })
        .eq('id', req.user.id);

      if (error) {
        console.error('[PATCH /me/push-token] DB error:', error.message);
        return res.status(500).json({
          error: { code: 'SERVER_ERROR', message: 'Failed to save push token' },
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('[PATCH /me/push-token]', err.message);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
    }
  }
);

module.exports = router;

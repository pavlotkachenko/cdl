// ============================================
// User Routes
// ============================================
// User management endpoints

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { supabase } = require('../config/supabase');
const { uploadSingle, handleUploadError } = require('../middleware/upload.middleware');
const { uploadToSupabase, deleteFromSupabase, getPublicUrl } = require('../services/storage.service');

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

/**
 * PUT /api/users/profile
 * Update current user profile (name, phone)
 */
router.put('/profile',
  authenticate,
  async (req, res) => {
    try {
      const { name, phone } = req.body;
      const updates = {};

      if (name !== undefined) updates.full_name = name;
      if (phone !== undefined) updates.phone = phone;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'No fields to update' },
        });
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', req.user.id)
        .select('id, full_name, email, phone, avatar_url, role')
        .single();

      if (error) {
        console.error('[PUT /profile] DB error:', error.message);
        return res.status(500).json({
          error: { code: 'SERVER_ERROR', message: 'Failed to update profile' },
        });
      }

      res.json({
        user: {
          id: data.id,
          name: data.full_name,
          email: data.email,
          phone: data.phone,
          avatar_url: data.avatar_url,
          role: data.role,
        },
      });
    } catch (err) {
      console.error('[PUT /profile]', err.message);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Internal server error' } });
    }
  }
);

/**
 * POST /api/users/me/avatar
 * Upload or replace avatar image
 */
router.post('/me/avatar',
  authenticate,
  (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) return handleUploadError(err, req, res, next);
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' },
        });
      }

      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Only JPG, PNG, GIF, or WebP images are allowed' },
        });
      }

      if (req.file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'Avatar must be under 5 MB' },
        });
      }

      // Delete old avatar if present
      const { data: currentUser } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', req.user.id)
        .single();

      if (currentUser?.avatar_url) {
        try {
          await deleteFromSupabase(currentUser.avatar_url);
        } catch (_) { /* ignore delete errors for old file */ }
      }

      const ext = req.file.originalname.split('.').pop() || 'jpg';
      const fileName = `${req.user.id}_${Date.now()}.${ext}`;
      await uploadToSupabase(req.file.buffer, fileName, req.file.mimetype, 'avatars');
      const avatarPath = `avatars/${fileName}`;
      const avatarUrl = getPublicUrl(avatarPath);

      await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', req.user.id);

      res.json({ avatar_url: avatarUrl });
    } catch (err) {
      console.error('[POST /me/avatar]', err.message);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to upload avatar' } });
    }
  }
);

module.exports = router;

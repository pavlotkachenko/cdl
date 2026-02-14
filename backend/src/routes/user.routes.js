// ============================================
// User Routes
// ============================================
// User management endpoints

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

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

module.exports = router;

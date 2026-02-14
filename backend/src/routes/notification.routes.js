// ============================================
// Notification Routes
// ============================================
// User notification endpoints

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/',
  authenticate,
  async (req, res) => {
    try {
      res.json({ 
        notifications: [],
        unread_count: 0
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read',
  authenticate,
  async (req, res) => {
    try {
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;

// ============================================
// NOTIFICATION ROUTES
// User notification management endpoints
// ============================================

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

/**
 * GET /api/notifications
 * Get user's notifications with pagination
 */
router.get('/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('unread_only').optional().isBoolean().withMessage('unread_only must be boolean')
  ],
  notificationController.getNotifications
);

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count',
  authenticate,
  notificationController.getUnreadCount
);

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
 */
router.get('/preferences',
  authenticate,
  notificationController.getPreferences
);

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
router.put('/preferences',
  authenticate,
  [
    body('channel')
      .isIn(['email', 'sms', 'in_app', 'push'])
      .withMessage('Invalid channel type'),
    body('enabled')
      .isBoolean()
      .withMessage('enabled must be boolean'),
    body('quiet_hours_start')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time format (HH:MM)'),
    body('quiet_hours_end')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Invalid time format (HH:MM)')
  ],
  notificationController.updatePreferences
);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all',
  authenticate,
  notificationController.markAllAsRead
);

/**
 * PATCH /api/notifications/:id/read
 * Mark specific notification as read
 */
router.patch('/:id/read',
  authenticate,
  notificationController.markAsRead
);

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id',
  authenticate,
  notificationController.deleteNotification
);

module.exports = router;

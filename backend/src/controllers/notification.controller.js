// ============================================
// NOTIFICATION CONTROLLER
// Handles notification endpoints
// ============================================

const { validationResult } = require('express-validator');
const notificationService = require('../services/notification.service');

/**
 * Get user notifications
 * GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unread_only = false } = req.query;

    const result = await notificationService.getUserNotifications(
      userId,
      parseInt(page),
      parseInt(limit),
      unread_only === 'true'
    );

    res.json(result);

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get notifications'
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      unread_count: count
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get unread count'
    });
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    await notificationService.markAsRead(notificationId, userId);

    res.json({
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await notificationService.markAllAsRead(userId);

    res.json({
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to mark all notifications as read'
    });
  }
};

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = await notificationService.getPreferences(userId);

    res.json({
      preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get notification preferences'
    });
  }
};

/**
 * Update notification preferences
 * PUT /api/notifications/preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { channel, enabled, quiet_hours_start, quiet_hours_end } = req.body;

    await notificationService.updatePreferences(
      userId,
      channel,
      enabled,
      quiet_hours_start,
      quiet_hours_end
    );

    res.json({
      message: 'Notification preferences updated successfully'
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update notification preferences'
    });
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const { supabase } = require('../config/supabase');

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete notification error:', error);
      return res.status(500).json({
        error: 'Delete Failed',
        message: 'Failed to delete notification'
      });
    }

    res.json({
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete notification'
    });
  }
};

module.exports = exports;

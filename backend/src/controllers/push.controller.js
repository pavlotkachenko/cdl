/**
 * Push Notification Controller
 * Handles push notification subscription management
 * Location: backend/src/controllers/push.controller.js
 */

const webPushService = require('../services/web-push.service');

/**
 * Get VAPID public key
 * GET /api/push/vapid-public-key
 */
exports.getPublicKey = async (req, res) => {
  try {
    if (!webPushService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications not configured'
      });
    }

    const publicKey = webPushService.getPublicKey();

    res.json({
      success: true,
      publicKey: publicKey
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get VAPID public key'
    });
  }
};

/**
 * Subscribe to push notifications
 * POST /api/push/subscribe
 * Body: { endpoint, keys: { p256dh, auth } }
 */
exports.subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint, keys } = req.body;

    // Validate request body
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription data. Required: endpoint, keys.p256dh, keys.auth'
      });
    }

    // Validate endpoint format
    if (typeof endpoint !== 'string' || !endpoint.startsWith('http')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid endpoint format'
      });
    }

    // Check if push notifications are enabled
    if (!webPushService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications not configured on server'
      });
    }

    // Save subscription
    const subscription = await webPushService.saveSubscription(userId, {
      endpoint,
      keys
    });

    console.log(`User ${userId} subscribed to push notifications`);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      subscription: {
        id: subscription.id,
        endpoint: subscription.endpoint,
        createdAt: subscription.created_at
      }
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to push notifications'
    });
  }
};

/**
 * Unsubscribe from push notifications
 * POST /api/push/unsubscribe
 * Body: { endpoint }
 */
exports.unsubscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { endpoint } = req.body;

    // Validate request body
    if (!endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Endpoint is required'
      });
    }

    // Verify the subscription belongs to the user
    const subscription = await webPushService.getUserSubscriptionByEndpoint(userId, endpoint);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    // Remove subscription
    await webPushService.removeSubscription(endpoint);

    console.log(`User ${userId} unsubscribed from push notifications`);

    res.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from push notifications'
    });
  }
};

/**
 * Get user's push subscriptions
 * GET /api/push/subscriptions
 */
exports.getSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptions = await webPushService.getUserSubscriptions(userId);

    res.json({
      success: true,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.subscription.endpoint,
        createdAt: sub.createdAt
      })),
      count: subscriptions.length
    });
  } catch (error) {
    console.error('Error getting push subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get push subscriptions'
    });
  }
};

/**
 * Remove all user's push subscriptions
 * DELETE /api/push/subscriptions
 */
exports.removeAllSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await webPushService.removeUserSubscriptions(userId);

    console.log(`Removed ${count} subscriptions for user ${userId}`);

    res.json({
      success: true,
      message: `Removed ${count} subscription(s)`,
      count: count
    });
  } catch (error) {
    console.error('Error removing all subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove subscriptions'
    });
  }
};

/**
 * Send test notification
 * POST /api/push/test
 */
exports.sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!webPushService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications not configured'
      });
    }

    const result = await webPushService.sendTestNotification(userId);

    if (result.sent === 0) {
      return res.status(404).json({
        success: false,
        error: 'No active push subscriptions found'
      });
    }

    res.json({
      success: true,
      message: 'Test notification sent',
      sent: result.sent,
      failed: result.failed
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
};

/**
 * Get notification preferences (placeholder for future implementation)
 * GET /api/push/preferences
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Implement preferences storage in database
    // For now, return default preferences
    const defaultPreferences = {
      enabled: true,
      types: {
        new_message: true,
        case_status: true,
        court_reminder: true,
        payment_confirmation: true
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };

    res.json({
      success: true,
      preferences: defaultPreferences
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notification preferences'
    });
  }
};

/**
 * Update notification preferences (placeholder for future implementation)
 * PUT /api/push/preferences
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferences format'
      });
    }

    // TODO: Implement preferences storage in database
    // For now, just return the preferences
    console.log(`User ${userId} updated notification preferences:`, preferences);

    res.json({
      success: true,
      message: 'Notification preferences updated',
      preferences: preferences
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
};

/**
 * Admin: Send notification to specific user
 * POST /api/push/admin/send
 * Body: { userId, notification: { title, body, ... } }
 */
exports.adminSendToUser = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Admin access required'
      });
    }

    const { userId, notification } = req.body;

    // Validate request
    if (!userId || !notification) {
      return res.status(400).json({
        success: false,
        error: 'userId and notification are required'
      });
    }

    if (!notification.title || !notification.body) {
      return res.status(400).json({
        success: false,
        error: 'notification.title and notification.body are required'
      });
    }

    if (!webPushService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications not configured'
      });
    }

    // Send notification
    const result = await webPushService.sendToUser(userId, notification);

    res.json({
      success: true,
      message: 'Notification sent',
      sent: result.sent,
      failed: result.failed,
      total: result.total
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
};

/**
 * Admin: Send notification to multiple users
 * POST /api/push/admin/send-bulk
 * Body: { userIds: [], notification: { title, body, ... } }
 */
exports.adminSendBulk = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Admin access required'
      });
    }

    const { userIds, notification } = req.body;

    // Validate request
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userIds must be a non-empty array'
      });
    }

    if (!notification || !notification.title || !notification.body) {
      return res.status(400).json({
        success: false,
        error: 'notification.title and notification.body are required'
      });
    }

    if (!webPushService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications not configured'
      });
    }

    // Send notifications
    const result = await webPushService.sendToMultipleUsers(userIds, notification);

    res.json({
      success: true,
      message: 'Bulk notifications sent',
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      users: result.users
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send bulk notifications'
    });
  }
};

/**
 * Admin: Clean up expired subscriptions
 * POST /api/push/admin/cleanup
 */
exports.adminCleanup = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Admin access required'
      });
    }

    const count = await webPushService.cleanupExpiredSubscriptions();

    res.json({
      success: true,
      message: `Cleaned up ${count} expired subscription(s)`,
      count: count
    });
  } catch (error) {
    console.error('Error cleaning up subscriptions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clean up subscriptions'
    });
  }
};

/**
 * Web Push Service
 * Handles web push notifications using web-push library
 * Location: backend/src/services/web-push.service.js
 */

const webpush = require('web-push');
const pool = require('../config/database');

class WebPushService {
  constructor() {
    // Initialize VAPID details
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@cdlticket.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn('VAPID keys not configured. Push notifications will not work.');
      console.warn('Run: node backend/src/scripts/generate-vapid-keys.js');
      this.enabled = false;
      return;
    }

    webpush.setVAPIDDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    this.enabled = true;
    console.log('Web Push Service initialized successfully');
  }

  /**
   * Check if push notifications are enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get VAPID public key
   * @returns {string}
   */
  getPublicKey() {
    return process.env.VAPID_PUBLIC_KEY;
  }

  /**
   * Send push notification to a specific subscription
   * @param {Object} subscription - Push subscription object
   * @param {Object} payload - Notification payload
   * @returns {Promise<Object>}
   */
  async sendPushNotification(subscription, payload) {
    if (!this.enabled) {
      console.warn('Push notifications not enabled');
      return { success: false, reason: 'not_enabled' };
    }

    try {
      const payloadString = JSON.stringify(payload);

      const options = {
        TTL: 86400, // 24 hours
        urgency: payload.urgency || 'normal',
        vapidDetails: {
          subject: process.env.VAPID_SUBJECT || 'mailto:admin@cdlticket.com',
          publicKey: process.env.VAPID_PUBLIC_KEY,
          privateKey: process.env.VAPID_PRIVATE_KEY
        }
      };

      const result = await webpush.sendNotification(
        subscription,
        payloadString,
        options
      );

      console.log('Push notification sent successfully:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        statusCode: result.statusCode
      });

      return { success: true, result };
    } catch (error) {
      console.error('Error sending push notification:', error);

      // Handle 410 Gone - subscription expired
      if (error.statusCode === 410) {
        console.log('Subscription expired, removing from database');
        await this.removeExpiredSubscription(subscription.endpoint);
        return { success: false, reason: 'expired', error };
      }

      // Handle 404 Not Found - subscription invalid
      if (error.statusCode === 404) {
        console.log('Subscription not found, removing from database');
        await this.removeExpiredSubscription(subscription.endpoint);
        return { success: false, reason: 'not_found', error };
      }

      // Handle 401 Unauthorized - VAPID issues
      if (error.statusCode === 401) {
        console.error('VAPID authentication failed');
        return { success: false, reason: 'auth_failed', error };
      }

      return { success: false, reason: 'unknown', error };
    }
  }

  /**
   * Send push notification to a specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>}
   */
  async sendToUser(userId, notification) {
    if (!this.enabled) {
      console.warn('Push notifications not enabled');
      return { success: false, sent: 0, failed: 0 };
    }

    try {
      // Get all subscriptions for the user
      const subscriptions = await this.getUserSubscriptions(userId);

      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return { success: true, sent: 0, failed: 0 };
      }

      // Prepare notification payload
      const payload = {
        title: notification.title || 'Notification',
        body: notification.body || notification.message || '',
        icon: notification.icon || '/assets/icons/icon-192x192.png',
        badge: notification.badge || '/assets/icons/badge-96x96.png',
        tag: notification.tag || 'notification',
        data: notification.data || {},
        requireInteraction: notification.requireInteraction || false,
        actions: notification.actions || [],
        vibrate: notification.vibrate || [200, 100, 200],
        timestamp: Date.now(),
        urgency: notification.urgency || 'normal'
      };

      // Add image if provided
      if (notification.image) {
        payload.image = notification.image;
      }

      // Send to all user's subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(sub => this.sendPushNotification(sub.subscription, payload))
      );

      // Count successes and failures
      const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - sent;

      console.log(`Push notifications sent to user ${userId}: ${sent} sent, ${failed} failed`);

      return { success: true, sent, failed, total: subscriptions.length };
    } catch (error) {
      console.error('Error sending push to user:', error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple users
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notification - Notification data
   * @returns {Promise<Object>}
   */
  async sendToMultipleUsers(userIds, notification) {
    if (!this.enabled) {
      console.warn('Push notifications not enabled');
      return { success: false, totalSent: 0, totalFailed: 0 };
    }

    try {
      const results = await Promise.allSettled(
        userIds.map(userId => this.sendToUser(userId, notification))
      );

      const totalSent = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value.sent, 0);

      const totalFailed = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value.failed, 0);

      console.log(`Bulk push sent: ${totalSent} sent, ${totalFailed} failed to ${userIds.length} users`);

      return { success: true, totalSent, totalFailed, users: userIds.length };
    } catch (error) {
      console.error('Error sending bulk push notifications:', error);
      throw error;
    }
  }

  /**
   * Save push subscription to database
   * @param {string} userId - User ID
   * @param {Object} subscription - Push subscription object
   * @returns {Promise<Object>}
   */
  async saveSubscription(userId, subscription) {
    try {
      const query = `
        INSERT INTO push_subscriptions (user_id, endpoint, keys)
        VALUES ($1, $2, $3)
        ON CONFLICT (endpoint) 
        DO UPDATE SET 
          user_id = $1,
          keys = $3,
          created_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const values = [userId, subscription.endpoint, subscription.keys];
      const result = await pool.query(query, values);

      console.log(`Push subscription saved for user ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }
  }

  /**
   * Remove push subscription from database
   * @param {string} endpoint - Subscription endpoint
   * @returns {Promise<boolean>}
   */
  async removeSubscription(endpoint) {
    try {
      const query = 'DELETE FROM push_subscriptions WHERE endpoint = $1';
      const result = await pool.query(query, [endpoint]);

      console.log(`Push subscription removed: ${endpoint.substring(0, 50)}...`);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error removing push subscription:', error);
      throw error;
    }
  }

  /**
   * Remove expired subscription
   * @param {string} endpoint - Subscription endpoint
   * @returns {Promise<boolean>}
   */
  async removeExpiredSubscription(endpoint) {
    return this.removeSubscription(endpoint);
  }

  /**
   * Get all subscriptions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async getUserSubscriptions(userId) {
    try {
      const query = `
        SELECT id, user_id, endpoint, keys, created_at
        FROM push_subscriptions
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [userId]);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        subscription: {
          endpoint: row.endpoint,
          keys: row.keys
        },
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for a user by endpoint
   * @param {string} userId - User ID
   * @param {string} endpoint - Subscription endpoint
   * @returns {Promise<Object|null>}
   */
  async getUserSubscriptionByEndpoint(userId, endpoint) {
    try {
      const query = `
        SELECT id, user_id, endpoint, keys, created_at
        FROM push_subscriptions
        WHERE user_id = $1 AND endpoint = $2
      `;

      const result = await pool.query(query, [userId, endpoint]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        subscription: {
          endpoint: row.endpoint,
          keys: row.keys
        },
        createdAt: row.created_at
      };
    } catch (error) {
      console.error('Error getting user subscription by endpoint:', error);
      throw error;
    }
  }

  /**
   * Remove all subscriptions for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>}
   */
  async removeUserSubscriptions(userId) {
    try {
      const query = 'DELETE FROM push_subscriptions WHERE user_id = $1';
      const result = await pool.query(query, [userId]);

      console.log(`Removed ${result.rowCount} subscriptions for user ${userId}`);
      return result.rowCount;
    } catch (error) {
      console.error('Error removing user subscriptions:', error);
      throw error;
    }
  }

  /**
   * Clean up expired subscriptions (older than 90 days with no activity)
   * @returns {Promise<number>}
   */
  async cleanupExpiredSubscriptions() {
    try {
      const query = `
        DELETE FROM push_subscriptions
        WHERE created_at < NOW() - INTERVAL '90 days'
      `;

      const result = await pool.query(query);

      console.log(`Cleaned up ${result.rowCount} expired push subscriptions`);
      return result.rowCount;
    } catch (error) {
      console.error('Error cleaning up expired subscriptions:', error);
      throw error;
    }
  }

  /**
   * Get subscription count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>}
   */
  async getUserSubscriptionCount(userId) {
    try {
      const query = 'SELECT COUNT(*) FROM push_subscriptions WHERE user_id = $1';
      const result = await pool.query(query, [userId]);

      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      console.error('Error getting subscription count:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   * @param {string} userId - User ID
   * @returns {Promise<Object>}
   */
  async sendTestNotification(userId) {
    const notification = {
      title: 'Test Notification',
      body: 'This is a test push notification from CDL Ticket Management System',
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-96x96.png',
      tag: 'test-notification',
      data: {
        type: 'test',
        url: '/',
        timestamp: Date.now()
      },
      requireInteraction: false,
      urgency: 'normal'
    };

    return this.sendToUser(userId, notification);
  }
}

module.exports = new WebPushService();

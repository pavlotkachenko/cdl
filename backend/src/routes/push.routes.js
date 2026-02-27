/**
 * Push Notification Routes
 * Location: backend/src/routes/push.routes.js
 */

const express = require('express');
const router = express.Router();
const pushController = require('../controllers/push.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Public routes (still require authentication)
router.get('/vapid-public-key', authenticateToken, pushController.getPublicKey);

// Subscription management
router.post('/subscribe', authenticateToken, pushController.subscribe);
router.post('/unsubscribe', authenticateToken, pushController.unsubscribe);
router.get('/subscriptions', authenticateToken, pushController.getSubscriptions);
router.delete('/subscriptions', authenticateToken, pushController.removeAllSubscriptions);

// Test notification
router.post('/test', authenticateToken, pushController.sendTestNotification);

// Preferences
router.get('/preferences', authenticateToken, pushController.getPreferences);
router.put('/preferences', authenticateToken, pushController.updatePreferences);

// Admin routes
router.post('/admin/send', authenticateToken, pushController.adminSendToUser);
router.post('/admin/send-bulk', authenticateToken, pushController.adminSendBulk);
router.post('/admin/cleanup', authenticateToken, pushController.adminCleanup);

module.exports = router;

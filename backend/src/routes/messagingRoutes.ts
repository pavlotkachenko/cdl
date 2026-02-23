/**
 * CDL Messaging System - Backend Routes
 * API endpoints for messaging operations
 */

import express from 'express';
import * as messagingController from '../controllers/messagingController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * Admin-only routes for compliance and reporting
 */
router.get(
  '/admin/conversations',
  authorize(['admin']),
  messagingController.getAllConversationsAdmin
);

router.get(
  '/admin/activity',
  authorize(['admin']),
  messagingController.getConversationActivity
);

router.get(
  '/admin/audit-trail',
  authorize(['admin']),
  messagingController.getAuditTrail
);

router.get(
  '/admin/retention-compliance',
  authorize(['admin']),
  messagingController.getRetentionCompliance
);

router.post(
  '/admin/cleanup-expired',
  authorize(['admin']),
  messagingController.cleanupExpiredMessages
);

router.get(
  '/admin/unread-statistics',
  authorize(['admin']),
  messagingController.getUnreadStatistics
);

router.get(
  '/admin/message-statistics',
  authorize(['admin']),
  messagingController.getMessageStatistics
);

router.post(
  '/admin/archive-conversations',
  authorize(['admin']),
  messagingController.bulkArchiveConversations
);

/**
 * Attorney routes
 */
router.post(
  '/conversations/:conversationId/close',
  authorize(['attorney', 'admin']),
  messagingController.closeConversation
);

router.post(
  '/messages/:messageId/notify',
  authorize(['attorney']),
  messagingController.notifyUrgentMessage
);

/**
 * Shared routes for all authenticated users
 */
router.get(
  '/attachments/:attachmentId/verify',
  messagingController.verifyAttachmentScan
);

export default router;

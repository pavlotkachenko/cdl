// ============================================
// Messaging API Routes
// Location: backend/src/routes/messages.routes.js
// ============================================

const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messages.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// ============================================
// Conversations
// ============================================

// Get all conversations for current user
router.get('/conversations', authenticate, messagesController.getConversations);

// Get specific conversation
router.get('/conversations/:conversationId', authenticate, messagesController.getConversation);

// Create new conversation
router.post('/conversations', authenticate, messagesController.createConversation);

// ============================================
// Messages
// ============================================

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', authenticate, messagesController.getMessages);

// Send a message
router.post('/conversations/:conversationId/messages', authenticate, messagesController.sendMessage);

// Send message with file attachment
router.post(
  '/conversations/:conversationId/messages/with-file',
  authenticate,
  upload.single('file'),
  messagesController.sendMessageWithFile
);

// Mark messages as read
router.post('/conversations/:conversationId/mark-read', authenticate, messagesController.markAsRead);

// Delete a message
router.delete('/messages/:messageId', authenticate, messagesController.deleteMessage);

// ============================================
// Search
// ============================================

// Search messages
router.get('/search', authenticate, messagesController.searchMessages);

// ============================================
// Quick Questions
// ============================================

// Get quick question templates
router.get('/quick-questions', authenticate, messagesController.getQuickQuestions);

// ============================================
// Video Calls
// ============================================

// Generate video call link
router.post('/video-calls/generate', authenticate, messagesController.generateVideoLink);

// Get video call history
router.get('/video-calls/history', authenticate, messagesController.getVideoCallHistory);

// ============================================
// Statistics
// ============================================

// Get messaging statistics
router.get('/statistics', authenticate, messagesController.getStatistics);

module.exports = router;

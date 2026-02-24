// ============================================
// CONVERSATION ROUTES
// REST API endpoints for conversation management
// ============================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const conversationController = require('../controllers/conversation.controller');
const { validateConversation } = require('../middleware/validation.middleware');

/**
 * @route GET /api/conversations
 * @desc Get all conversations for authenticated user (with pagination)
 * @access Private
 */
router.get('/', authenticate, conversationController.getConversations);

/**
 * @route GET /api/conversations/:id
 * @desc Get single conversation by ID
 * @access Private
 */
router.get('/:id', authenticate, conversationController.getConversationById);

/**
 * @route POST /api/conversations
 * @desc Create new conversation
 * @access Private
 */
router.post('/', authenticate, validateConversation, conversationController.createConversation);

/**
 * @route DELETE /api/conversations/:id
 * @desc Delete conversation
 * @access Private (Driver or Attorney only)
 */
router.delete('/:id', authenticate, conversationController.deleteConversation);

/**
 * @route POST /api/conversations/:id/video-link
 * @desc Generate video call link for conversation
 * @access Private (Attorney only)
 */
router.post('/:id/video-link', authenticate, conversationController.generateVideoLink);

/**
 * @route GET /api/conversations/:id/messages
 * @desc Get all messages for a conversation
 * @access Private
 */
router.get('/:id/messages', authenticate, conversationController.getConversationMessages);

module.exports = router;

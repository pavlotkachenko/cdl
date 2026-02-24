// ============================================
// MESSAGE ROUTES
// REST API endpoints for message management
// ============================================

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const messageController = require('../controllers/message.controller');
const { validateMessage } = require('../middleware/validation.middleware');
const { upload } = require('../middleware/upload.middleware');

/**
 * @route POST /api/messages
 * @desc Send a new message
 * @access Private
 */
router.post('/', authenticate, validateMessage, messageController.sendMessage);

/**
 * @route POST /api/messages/file
 * @desc Send a message with file attachment
 * @access Private
 */
router.post('/file', authenticate, upload.single('file'), messageController.sendMessageWithFile);

/**
 * @route POST /api/messages/:id/read
 * @desc Mark message as read
 * @access Private
 */
router.post('/:id/read', authenticate, messageController.markMessageAsRead);

/**
 * @route DELETE /api/messages/:id
 * @desc Delete message
 * @access Private (Sender only)
 */
router.delete('/:id', authenticate, messageController.deleteMessage);

/**
 * @route GET /api/messages/:id
 * @desc Get single message by ID
 * @access Private
 */
router.get('/:id', authenticate, messageController.getMessageById);

module.exports = router;

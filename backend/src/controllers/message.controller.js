// ============================================
// MESSAGE CONTROLLER
// Business logic for message management
// ============================================

const messageService = require('../services/message.service');
const { AppError } = require('../utils/errors');

/**
 * @desc Send a new message
 * @route POST /api/messages
 * @access Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { conversationId, recipientId, content, messageType, priority } = req.body;

    const message = await messageService.createMessage({
      conversationId,
      senderId,
      recipientId,
      content,
      messageType: messageType || 'text',
      priority: priority || 'normal'
    });

    // Emit socket event for real-time delivery
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('new-message', message);
      io.to(`user:${recipientId}`).emit('new-message', message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Send message with file attachment
 * @route POST /api/messages/file
 * @access Private
 */
const sendMessageWithFile = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { conversationId, recipientId, content } = req.body;
    const file = req.file;

    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      throw new AppError('File size exceeds 10MB limit', 400);
    }

    const message = await messageService.createMessageWithFile({
      conversationId,
      senderId,
      recipientId,
      content: content || 'Sent a file',
      file
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('new-message', message);
      io.to(`user:${recipientId}`).emit('new-message', message);
    }

    res.status(201).json({
      success: true,
      message: 'Message with file sent successfully',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Mark message as read
 * @route POST /api/messages/:id/read
 * @access Private
 */
const markMessageAsRead = async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = await messageService.markAsRead(messageId, userId);

    // Emit socket event to notify sender
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${message.sender_id}`).emit('message-read', {
        messageId: message.id,
        conversationId: message.conversation_id,
        readAt: message.read_at
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      data: message
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete message
 * @route DELETE /api/messages/:id
 * @access Private
 */
const deleteMessage = async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    await messageService.deleteMessage(messageId, userId);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      // Get conversation ID before deletion
      const message = await messageService.getMessageById(messageId, userId);
      if (message) {
        io.to(`conversation:${message.conversation_id}`).emit('message-deleted', {
          messageId
        });
      }
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get message by ID
 * @route GET /api/messages/:id
 * @access Private
 */
const getMessageById = async (req, res, next) => {
  try {
    const messageId = req.params.id;
    const userId = req.user.id;

    const message = await messageService.getMessageById(messageId, userId);

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  sendMessageWithFile,
  markMessageAsRead,
  deleteMessage,
  getMessageById
};

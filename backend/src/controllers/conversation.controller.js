// ============================================
// CONVERSATION CONTROLLER
// Business logic for conversation management
// ============================================

const conversationService = require('../services/conversation.service');
const { AppError } = require('../utils/errors');

/**
 * @desc Get all conversations for authenticated user
 * @route GET /api/conversations
 * @access Private
 */
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await conversationService.getUserConversations(userId, limit, offset);

    res.json({
      success: true,
      data: result.conversations,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get single conversation by ID
 * @route GET /api/conversations/:id
 * @access Private
 */
const getConversationById = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    const conversation = await conversationService.getConversationById(conversationId, userId);

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Create new conversation
 * @route POST /api/conversations
 * @access Private
 */
const createConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { caseId, attorneyId } = req.body;

    // Validate user can create conversation for this case
    const conversation = await conversationService.createConversation({
      caseId,
      driverId: userId,
      attorneyId
    });

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete conversation
 * @route DELETE /api/conversations/:id
 * @access Private
 */
const deleteConversation = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;

    await conversationService.deleteConversation(conversationId, userId);

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Generate video call link
 * @route POST /api/conversations/:id/video-link
 * @access Private (Attorney only)
 */
const generateVideoLink = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only attorneys can generate video links
    if (userRole !== 'attorney') {
      throw new AppError('Only attorneys can generate video links', 403);
    }

    const videoLink = await conversationService.generateVideoLink(conversationId, userId);

    // Emit socket event for video link
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('video-link-generated', {
        conversationId,
        videoLink
      });
    }

    res.json({
      success: true,
      message: 'Video link generated successfully',
      data: videoLink
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Get all messages for a conversation
 * @route GET /api/conversations/:id/messages
 * @access Private
 */
const getConversationMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await conversationService.getConversationMessages(
      conversationId,
      userId,
      limit,
      offset
    );

    res.json({
      success: true,
      data: result.messages,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  generateVideoLink,
  getConversationMessages
};

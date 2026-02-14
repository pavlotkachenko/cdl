// ============================================
// Messages Controller
// Location: backend/src/controllers/messages.controller.js
// ============================================

const { Message, Conversation, MessageAttachment, User } = require('../models');
const { sendEmail } = require('../services/email.service');
const { getIO } = require('../socket');

// ============================================
// Get Conversations
// ============================================
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [
          { driver_id: userId },
          { attorney_id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: User,
          as: 'attorney',
          attributes: ['id', 'name', 'email', 'avatar']
        },
        {
          model: Message,
          as: 'lastMessage',
          limit: 1,
          order: [['created_at', 'DESC']]
        }
      ],
      order: [['last_message_at', 'DESC']]
    });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.count({
          where: {
            conversation_id: conv.id,
            recipient_id: userId,
            is_read: false
          }
        });

        return {
          ...conv.toJSON(),
          unreadCount
        };
      })
    );

    res.json({
      success: true,
      conversations: conversationsWithUnread
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversations'
    });
  }
};

// ============================================
// Get Specific Conversation
// ============================================
exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { driver_id: userId },
          { attorney_id: userId }
        ]
      },
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'avatar', 'role']
        },
        {
          model: User,
          as: 'attorney',
          attributes: ['id', 'name', 'email', 'avatar', 'role']
        },
        {
          model: Case,
          as: 'case',
          attributes: ['id', 'caseNumber', 'type', 'status']
        }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation'
    });
  }
};

// ============================================
// Create Conversation
// ============================================
exports.createConversation = async (req, res) => {
  try {
    const { caseId, attorneyId } = req.body;
    const driverId = req.user.id;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      where: {
        case_id: caseId,
        driver_id: driverId,
        attorney_id: attorneyId
      }
    });

    if (conversation) {
      return res.json({
        success: true,
        conversation,
        message: 'Conversation already exists'
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      case_id: caseId,
      driver_id: driverId,
      attorney_id: attorneyId,
      last_message_at: new Date()
    });

    // Load related data
    await conversation.reload({
      include: [
        { model: User, as: 'driver' },
        { model: User, as: 'attorney' },
        { model: Case, as: 'case' }
      ]
    });

    res.status(201).json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }
};

// ============================================
// Get Messages
// ============================================
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [
          { driver_id: userId },
          { attorney_id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const offset = (page - 1) * limit;

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { conversation_id: conversationId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'avatar', 'role']
        },
        {
          model: MessageAttachment,
          as: 'attachments'
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages'
    });
  }
};

// ============================================
// Send Message
// ============================================
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const senderId = req.user.id;

    // Get conversation
    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        { model: User, as: 'driver' },
        { model: User, as: 'attorney' }
      ]
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Determine recipient
    const recipientId = conversation.driver_id === senderId
      ? conversation.attorney_id
      : conversation.driver_id;

    // Create message
    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId,
      content,
      message_type: messageType,
      is_read: false
    });

    // Load sender info
    await message.reload({
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'avatar', 'role']
        }
      ]
    });

    // Update conversation last_message_at
    await conversation.update({
      last_message_at: new Date()
    });

    // Emit real-time event
    const io = getIO();
    io.to(`conversation_${conversationId}`).emit('new_message', {
      message: message.toJSON()
    });

    // Send email notification
    const recipient = conversation.driver_id === senderId
      ? conversation.attorney
      : conversation.driver;

    await sendEmail({
      to: recipient.email,
      subject: 'New message from ' + req.user.name,
      template: 'new-message',
      data: {
        recipientName: recipient.name,
        senderName: req.user.name,
        message: content,
        conversationUrl: `${process.env.FRONTEND_URL}/messages/${conversationId}`
      }
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// ============================================
// Send Message with File
// ============================================
exports.sendMessageWithFile = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Get conversation and determine recipient
    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const recipientId = conversation.driver_id === senderId
      ? conversation.attorney_id
      : conversation.driver_id;

    // Create message
    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId,
      content: content || 'Sent a file',
      message_type: 'file',
      is_read: false
    });

    // Create attachment record
    const attachment = await MessageAttachment.create({
      message_id: message.id,
      file_name: file.originalname,
      file_size: file.size,
      file_type: file.mimetype,
      file_url: file.path
    });

    // Load full message data
    await message.reload({
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
        { model: MessageAttachment, as: 'attachments' }
      ]
    });

    // Update conversation
    await conversation.update({ last_message_at: new Date() });

    // Emit real-time event
    const io = getIO();
    io.to(`conversation_${conversationId}`).emit('new_message', {
      message: message.toJSON()
    });

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error sending message with file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// ============================================
// Mark as Read
// ============================================
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Mark all unread messages in this conversation as read
    const [updatedCount] = await Message.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          conversation_id: conversationId,
          recipient_id: userId,
          is_read: false
        }
      }
    );

    // Emit read receipt
    const io = getIO();
    io.to(`conversation_${conversationId}`).emit('messages_read', {
      conversationId,
      userId,
      readAt: new Date()
    });

    res.json({
      success: true,
      markedCount: updatedCount
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

// ============================================
// Search Messages
// ============================================
exports.searchMessages = async (req, res) => {
  try {
    const { q, conversationId } = req.query;
    const userId = req.user.id;

    const where = {
      content: { [Op.iLike]: `%${q}%` }
    };

    if (conversationId) {
      where.conversation_id = conversationId;
    }

    const messages = await Message.findAll({
      where,
      include: [
        {
          model: Conversation,
          as: 'conversation',
          where: {
            [Op.or]: [
              { driver_id: userId },
              { attorney_id: userId }
            ]
          }
        },
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
};

// ============================================
// Get Quick Questions
// ============================================
exports.getQuickQuestions = async (req, res) => {
  try {
    const quickQuestions = [
      { id: 1, text: "What's the status of my case?", category: 'status' },
      { id: 2, text: 'When is my court date?', category: 'schedule' },
      { id: 3, text: 'What documents do I need?', category: 'documents' },
      { id: 4, text: 'Can I get an update?', category: 'update' },
      { id: 5, text: 'I have new evidence', category: 'evidence' },
      { id: 6, text: 'What are the potential fines?', category: 'fines' },
      { id: 7, text: 'How long will this take?', category: 'timeline' }
    ];

    res.json({
      success: true,
      quickQuestions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get quick questions'
    });
  }
};

// ============================================
// Generate Video Link
// ============================================
exports.generateVideoLink = async (req, res) => {
  try {
    const { conversationId, platform = 'zoom' } = req.body;

    // In production, integrate with Zoom/Google Meet API
    // For now, return a mock link
    const meetingId = Date.now().toString();
    const link = platform === 'zoom'
      ? `https://zoom.us/j/${meetingId}`
      : `https://meet.google.com/${meetingId}`;

    res.json({
      success: true,
      videoLink: {
        platform,
        link,
        meetingId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate video link'
    });
  }
};

// ============================================
// Get Statistics
// ============================================
exports.getStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = {
      totalConversations: await Conversation.count({
        where: {
          [Op.or]: [{ driver_id: userId }, { attorney_id: userId }]
        }
      }),
      totalMessages: await Message.count({
        where: {
          [Op.or]: [{ sender_id: userId }, { recipient_id: userId }]
        }
      }),
      unreadMessages: await Message.count({
        where: {
          recipient_id: userId,
          is_read: false
        }
      })
    };

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
};

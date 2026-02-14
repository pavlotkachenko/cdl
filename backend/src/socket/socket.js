// ============================================
// Socket.io Server Setup
// Location: backend/src/socket/index.js
// ============================================

const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

let io;

// ============================================
// Initialize Socket.io
// ============================================
const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:4200',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      socket.userName = user.name;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userName})`);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Broadcast online status
    io.emit('user_online', {
      userId: socket.userId,
      userName: socket.userName
    });

    // ============================================
    // Join Conversation
    // ============================================
    socket.on('join_conversation', (data) => {
      const { conversationId } = data;
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);

      // Notify others in conversation
      socket.to(`conversation_${conversationId}`).emit('user_joined', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    // ============================================
    // Leave Conversation
    // ============================================
    socket.on('leave_conversation', (data) => {
      const { conversationId } = data;
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);

      // Notify others
      socket.to(`conversation_${conversationId}`).emit('user_left', {
        userId: socket.userId
      });
    });

    // ============================================
    // Typing Indicators
    // ============================================
    socket.on('typing_start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        conversationId
      });
    });

    socket.on('typing_stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        conversationId
      });
    });

    // ============================================
    // Message Delivered (client acknowledges receipt)
    // ============================================
    socket.on('message_delivered', (data) => {
      const { messageId, conversationId } = data;
      socket.to(`conversation_${conversationId}`).emit('message_delivered', {
        messageId,
        deliveredAt: new Date(),
        deliveredBy: socket.userId
      });
    });

    // ============================================
    // Direct Message to User
    // ============================================
    socket.on('send_direct_message', (data) => {
      const { recipientId, message } = data;
      io.to(`user_${recipientId}`).emit('new_direct_message', {
        from: socket.userId,
        fromName: socket.userName,
        message,
        timestamp: new Date()
      });
    });

    // ============================================
    // Disconnect
    // ============================================
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      
      // Broadcast offline status
      io.emit('user_offline', {
        userId: socket.userId,
        userName: socket.userName
      });
    });

    // ============================================
    // Error Handling
    // ============================================
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

// ============================================
// Get IO Instance
// ============================================
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// ============================================
// Helper Functions
// ============================================

// Send notification to specific user
const sendNotificationToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

// Send notification to conversation
const sendNotificationToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(`conversation_${conversationId}`).emit(event, data);
  }
};

// Broadcast to all connected users
const broadcastToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

// Get online users count
const getOnlineUsersCount = () => {
  if (io) {
    return io.engine.clientsCount;
  }
  return 0;
};

module.exports = {
  initSocket,
  getIO,
  sendNotificationToUser,
  sendNotificationToConversation,
  broadcastToAll,
  getOnlineUsersCount
};

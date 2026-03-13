// ============================================
// SOCKET.IO SERVER
// Real-time messaging with WebSocket
// ============================================

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

// Store active users
const activeUsers = new Map();

// Store io instance for use by emitTo* helpers
let ioInstance = null;

/**
 * Initialize Socket.io server
 */
const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:4200',
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id || decoded.sub;
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId} (${socket.userEmail})`);

    // Add user to active users
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      email: socket.userEmail,
      role: socket.userRole,
      connectedAt: new Date()
    });

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-based room for broadcasts (e.g. all operators)
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
    }

    // Broadcast user online status
    io.emit('user-online', {
      userId: socket.userId,
      timestamp: new Date()
    });

    // ============================================
    // JOIN CONVERSATION
    // ============================================
    socket.on('join-conversation', async (data) => {
      try {
        const { conversationId } = data;
        
        if (!conversationId) {
          socket.emit('error', { message: 'Conversation ID required' });
          return;
        }

        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);

        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('user-joined-conversation', {
          userId: socket.userId,
          conversationId,
          timestamp: new Date()
        });

        socket.emit('conversation-joined', { conversationId });
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // ============================================
    // LEAVE CONVERSATION
    // ============================================
    socket.on('leave-conversation', async (data) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          return;
        }

        socket.leave(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} left conversation ${conversationId}`);

        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('user-left-conversation', {
          userId: socket.userId,
          conversationId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error leaving conversation:', error);
      }
    });

    // ============================================
    // TYPING INDICATORS
    // ============================================
    socket.on('typing-start', (data) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          return;
        }

        socket.to(`conversation:${conversationId}`).emit('user-typing', {
          userId: socket.userId,
          conversationId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error in typing-start:', error);
      }
    });

    socket.on('typing-stop', (data) => {
      try {
        const { conversationId } = data;

        if (!conversationId) {
          return;
        }

        socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
          userId: socket.userId,
          conversationId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error in typing-stop:', error);
      }
    });

    // ============================================
    // MESSAGE EVENTS (triggered from controllers)
    // ============================================
    // These are emitted from the API controllers:
    // - new-message: When a message is sent
    // - message-read: When a message is marked as read
    // - message-deleted: When a message is deleted
    // - video-link-generated: When video link is created

    // ============================================
    // JOIN / LEAVE CASE ROOM
    // ============================================
    socket.on('join-case', ({ caseId }) => {
      if (caseId) {
        socket.join(`case:${caseId}`);
        console.log(`User ${socket.userId} joined case room ${caseId}`);
      }
    });

    socket.on('leave-case', ({ caseId }) => {
      if (caseId) {
        socket.leave(`case:${caseId}`);
      }
    });

    // ============================================
    // GET ONLINE USERS
    // ============================================
    socket.on('get-online-users', () => {
      try {
        const onlineUserIds = Array.from(activeUsers.keys());
        socket.emit('online-users', {
          users: onlineUserIds,
          count: onlineUserIds.length
        });
      } catch (error) {
        console.error('Error getting online users:', error);
      }
    });

    // ============================================
    // DISCONNECT
    // ============================================
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId} (${socket.userEmail})`);

      // Remove from active users
      activeUsers.delete(socket.userId);

      // Broadcast user offline status
      io.emit('user-offline', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });

    // ============================================
    // ERROR HANDLER
    // ============================================
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  ioInstance = io;
  return io;
};

/**
 * Get active users count
 */
const getActiveUsersCount = () => {
  return activeUsers.size;
};

/**
 * Get active user by ID
 */
const getActiveUser = (userId) => {
  return activeUsers.get(userId);
};

/**
 * Check if user is online
 */
const isUserOnline = (userId) => {
  return activeUsers.has(userId);
};

/**
 * Emit an event to a specific user's room.
 */
const emitToUser = (userId, event, data) => {
  if (ioInstance) ioInstance.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit an event to all users with a given role.
 */
const emitToRole = (role, event, data) => {
  if (ioInstance) ioInstance.to(`role:${role}`).emit(event, data);
};

/**
 * Emit an event to a case room.
 */
const emitToCase = (caseId, event, data) => {
  if (ioInstance) ioInstance.to(`case:${caseId}`).emit(event, data);
};

module.exports = {
  initializeSocket,
  getActiveUsersCount,
  getActiveUser,
  isUserOnline,
  emitToUser,
  emitToRole,
  emitToCase,
};

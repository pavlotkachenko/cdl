// ============================================
// CDL DRIVER-ATTORNEY MESSAGING SYSTEM
// Main Server Entry Point
// ============================================

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import Socket.io setup
const { initializeSocket } = require('./socket/socket');

// Import routes
const authRoutes = require('./routes/auth.routes');
const messagesRoutes = require('./routes/messages.routes');
const conversationRoutes = require('./routes/conversation.routes');
const quickQuestionsRoutes = require('./routes/quick-questions.routes');
const caseRoutes = require('./routes/case.routes');
const userRoutes = require('./routes/user.routes');
const fileRoutes = require('./routes/file.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const ocrRoutes = require('./routes/ocr.routes');
const paymentRoutes = require('./routes/payment.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const operatorRoutes = require('./routes/operator.routes');

// Import error handler
const { errorHandler } = require('./middleware/error.middleware');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Make io accessible to routes
app.set('io', io);

// ============================================
// MIDDLEWARE
// ============================================

// Security
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:4200',
    'http://host.docker.internal:4200',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request ID middleware
app.use((req, res, next) => {
  req.id = require('uuid').v4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CDL Ticket Management API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CDL Ticket Management API',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// API ROUTES
// ============================================

// Authentication
app.use('/api/auth', authRoutes);

// Messaging
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/quick-questions', quickQuestionsRoutes);

// Case Management
app.use('/api/cases', caseRoutes);

// User Management
app.use('/api/users', userRoutes);

// File Management
app.use('/api/files', fileRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Admin
app.use('/api/admin', adminRoutes);

// OCR
app.use('/api/ocr', ocrRoutes);

// Payments
app.use('/api/payments', paymentRoutes);

// Assignment
app.use('/api/assignment', assignmentRoutes);

// Operator
app.use('/api/operator', operatorRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   CDL DRIVER-ATTORNEY MESSAGING SYSTEM API            ║
║                                                        ║
║   🚀 Server running on: http://localhost:${PORT}        ║
║   🌍 Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   📡 Socket.io: Enabled                                ║
║   🗄️  Database: Supabase                               ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);

  // Verify environment variables
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ];

  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingEnvVars.length > 0) {
    console.warn('\n⚠️  WARNING: Missing environment variables:');
    missingEnvVars.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('   Please configure these in your .env file\n');
  } else {
    console.log('✅ All required environment variables configured\n');
  }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close Socket.io connections
    io.close(() => {
      console.log('Socket.io server closed');
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, server, io };

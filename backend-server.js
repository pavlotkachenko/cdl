// ============================================
// Main Server File
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { initSocket } = require('./socket');
require('dotenv').config();

// 1. Create the Express App (The office building)
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Create the HTTP Server (Needed for Socket.io to "hitch a ride")
const server = http.createServer(app);

// 3. Import Routes
const authRoutes = require('./routes/auth.routes');
const caseRoutes = require('./routes/case.routes');
const userRoutes = require('./routes/user.routes');
const fileRoutes = require('./routes/file.routes');
const notificationRoutes = require('./routes/notification.routes');
const messagesRoutes = require('./routes/messages.routes');

// ============================================
// MIDDLEWARE (Security and Helpers)
// ============================================

// Security protection
app.use(helmet());

// Allow requests from your Angular app
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

// Parse JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================
// SOCKET.IO INITIALIZATION
// ============================================

// Initialize Socket.io with the HTTP server
initSocket(server);

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CDL Ticket Management API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messagesRoutes); // Merged from second file

// ============================================
// ERROR HANDLING
// ============================================

// 404 - Route not found
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

// IMPORTANT: We use server.listen, NOT app.listen
// This allows both Express and Socket.io to run on the same port
server.listen(PORT, () => {
  console.log(`
  ╔═════════════════════════════════════════════════════════╗
  ║  CDL Ticket Management API Server                       ║
  ║  Running on http://localhost:${PORT}                    ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}  ║
  ╚═════════════════════════════════════════════════════════╝
  `);
  
  // Check Supabase connection
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️  WARNING: Supabase credentials not configured in .env!');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

module.exports = app;
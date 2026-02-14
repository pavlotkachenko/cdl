// ============================================
// Main Server File
// ============================================
// This is like the front desk of your office - 
// it welcomes requests and directs them to the right place

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes (different sections of your office)
const authRoutes = require('./routes/auth.routes');
const caseRoutes = require('./routes/case.routes');
const userRoutes = require('./routes/user.routes');
const fileRoutes = require('./routes/file.routes');
const notificationRoutes = require('./routes/notification.routes');

// Create the app (your office building)
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE (Security guards and helpers)
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

// Log all requests (like a visitor log book)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================
// ROUTES (Different departments in your office)
// ============================================

// Health check (is the server running?)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CDL Ticket Management API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.use('/api/auth', authRoutes);           // Login, register
app.use('/api/cases', caseRoutes);          // Case management
app.use('/api/users', userRoutes);          // User management
app.use('/api/files', fileRoutes);          // File uploads
app.use('/api/notifications', notificationRoutes); // Notifications

// ============================================
// ERROR HANDLING (When something goes wrong)
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

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║  CDL Ticket Management API Server     ║
  ║  Running on http://localhost:${PORT}     ║
  ║  Environment: ${process.env.NODE_ENV}           ║
  ╚════════════════════════════════════════╝
  `);
  
  // Check Supabase connection
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('⚠️  WARNING: Supabase credentials not configured!');
    console.warn('   Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

module.exports = app;

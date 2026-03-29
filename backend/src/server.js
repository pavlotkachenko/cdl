// ============================================
// CDL DRIVER-ATTORNEY MESSAGING SYSTEM
// Main Server Entry Point
// ============================================

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const Sentry = require('@sentry/node');

// Initialize Sentry (no-op if DSN is not configured)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    sendDefaultPii: false,
  });
}

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
const carrierRoutes = require('./routes/carrier.routes');
const driverRoutes  = require('./routes/driver.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const ratingRoutes = require('./routes/rating.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const webhookRoutes = require('./routes/webhook.routes');
const webauthnRoutes = require('./routes/webauthn.routes');
const revenueRoutes = require('./routes/revenue.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const violationTypeRoutes = require('./routes/violation-type.routes');

// Import error handler
const { errorHandler } = require('./middleware/error.middleware');

// Import cron jobs
const { startPaymentRemindersJob } = require('./jobs/payment-reminders.job');

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
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4200',
  'http://localhost:9000',
  'http://host.docker.internal:4200',
  'http://host.docker.internal:9000',
];
if (process.env.PRODUCTION_URL) allowedOrigins.push(process.env.PRODUCTION_URL);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});

const publicSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many submissions, please try again later.' } },
});

// Body parsing — skip JSON for Stripe webhook (needs raw body for signature verification)
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') return next();
  express.json({ limit: '10mb' })(req, res, next);
});
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
app.use('/api/auth', authLimiter, authRoutes);

// Messaging
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/quick-questions', quickQuestionsRoutes);

// Case Management — public-submit has its own tighter limiter
app.use('/api/cases/public-submit', publicSubmitLimiter);
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

// Carrier fleet management
app.use('/api/carriers', carrierRoutes);
app.use('/api/drivers',  driverRoutes);

// Subscriptions
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth/webauthn', webauthnRoutes);

// Revenue analytics (admin)
app.use('/api/revenue', revenueRoutes);

// Dashboard (operator + admin dashboard service)
app.use('/api/dashboard', dashboardRoutes);

// Violation type metadata (public, no auth)
app.use('/api/violation-types', violationTypeRoutes);

// ============================================
// PRODUCTION STATIC FILE SERVING
// ============================================

if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const frontendPath = path.join(__dirname, '..', 'public');

  app.use(express.static(frontendPath, {
    maxAge: '1y',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html') || filePath.includes('ngsw')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // Angular client-side routing fallback
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler (API routes only in production, all routes in development)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Sentry error handler (must be before custom error handler)
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

// Start scheduled jobs
startPaymentRemindersJob();

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
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  // Flush Sentry events before shutdown
  await Sentry.close(2000).catch(() => {});

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
  Sentry.captureException(err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  Sentry.captureException(reason);
});

module.exports = { app, server, io };

// ============================================
// Case Routes
// ============================================
// These are like different service windows
// Each handles a specific type of request

const express = require('express');
const router = express.Router();
const { authenticate, authorize, canAccessCase, optionalAuth } = require('../middleware/auth');
const caseController = require('../controllers/case.controller');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');

const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf', 'image/heic'];
    cb(allowed.includes(file.mimetype) ? null : new Error('Invalid file type'), allowed.includes(file.mimetype));
  }
}).single('file');

// ============================================
// VALIDATION RULES
// ============================================
// Check that incoming data is correct

const createCaseValidation = [
  body('customer_name').notEmpty().withMessage('Customer name is required'),
  body('driver_phone').optional().isMobilePhone(),
  body('customer_type').isIn([
    'subscriber_driver',
    'subscriber_carrier',
    'one_time_driver',
    'one_time_carrier'
  ]),
  body('state').optional().isLength({ min: 2, max: 2 }).withMessage('State must be 2 letters'),
  body('violation_date').optional().isISO8601().withMessage('Valid date required'),
  body('violation_type').optional().isIn([
    'speeding',
    'parking',
    'traffic_signal',
    'reckless_driving',
    'dui',
    'hos_logbook',
    'dot_inspection',
    'suspension',
    'csa_score',
    'dqf',
    'other'
  ]),
  body('citation_number').optional().isString().isLength({ max: 50 }).withMessage('Citation number must be 50 characters or less'),
  body('fine_amount').optional().isFloat({ min: 0 }).withMessage('Fine amount must be a non-negative number'),
  body('alleged_speed').optional().isInt({ min: 1, max: 300 }).withMessage('Alleged speed must be between 1 and 300'),
];

const publicSubmitValidation = [
  body('customer_name').notEmpty().withMessage('Customer name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('driver_phone').notEmpty().withMessage('Phone is required'),
  body('violation_details').notEmpty().withMessage('Description is required')
];

const updateCaseValidation = [
  body('status').optional().isString(),
  body('court_date').optional().isISO8601(),
  body('attorney_price').optional().isFloat({ min: 0 }),
  body('court_fee').optional().isFloat({ min: 0 }),
  body('violation_type').optional().isString(),
  body('violation_date').optional().isISO8601(),
  body('violation_details').optional().isString().isLength({ max: 2000 }),
  body('state').optional().isLength({ min: 2, max: 2 }),
  body('county').optional().isString().isLength({ max: 100 }),
  body('town').optional().isString().isLength({ max: 100 }),
  body('carrier').optional().isString().isLength({ max: 255 }),
  body('next_action_date').optional().isISO8601(),
  body('citation_number').optional().isString().isLength({ max: 50 }),
  body('fine_amount').optional().isFloat({ min: 0 }),
  body('alleged_speed').optional().isInt({ min: 1, max: 300 }),
];

// ============================================
// ROUTES
// ============================================

/**
 * POST /api/cases/public-submit
 * Submit a request from the landing page (no login required)
 */
router.post(
  '/public-submit',
  publicSubmitValidation,
  caseController.publicSubmit
);

/**
 * POST /api/cases
 * Submit a new ticket (violation)
 * Access: All authenticated users
 */
router.post(
  '/',
  authenticate,
  createCaseValidation,
  caseController.createCase
);

/**
 * GET /api/cases
 * Get list of cases with filters
 * Access: Based on role
 * Query params: status, state, customer_type, page, limit
 */
router.get(
  '/',
  authenticate,
  caseController.getCases
);

/**
 * GET /api/cases/my-cases
 * Get cases for current user
 * Drivers: their cases
 * Operators: assigned cases
 * Attorneys: assigned cases
 */
router.get(
  '/my-cases',
  authenticate,
  caseController.getMyCases
);

/**
 * GET /api/cases/new-cases
 * Get cases in "New Cases" pool
 * Access: Operators, Admins
 */
router.get(
  '/new-cases',
  authenticate,
  authorize(['operator', 'admin']),
  caseController.getNewCases
);

/**
 * GET /api/cases/stats
 * Get statistics dashboard data
 * Access: Operators, Admins
 */
router.get(
  '/stats',
  authenticate,
  authorize(['operator', 'admin']),
  caseController.getCaseStats
);

/**
 * GET /api/cases/:id
 * Get single case details
 * Access: Owner or assigned users
 */
router.get(
  '/:id',
  authenticate,
  canAccessCase,
  caseController.getCaseById
);

/**
 * PATCH /api/cases/:id
 * Update case details
 * Access: Drivers (description + location only), Operators, Attorneys, Admins
 */
router.patch(
  '/:id',
  authenticate,
  canAccessCase,
  authorize(['driver', 'operator', 'attorney', 'admin']),
  updateCaseValidation,
  caseController.updateCase
);

/**
 * POST /api/cases/:id/assign-operator
 * Assign case to operator (manual override)
 * Access: Admins
 */
router.post(
  '/:id/assign-operator',
  authenticate,
  authorize(['admin']),
  body('operator_id').isUUID(),
  caseController.assignToOperator
);

/**
 * POST /api/cases/:id/assign-attorney
 * Assign case to attorney
 * Access: Operators, Admins
 */
router.post(
  '/:id/assign-attorney',
  authenticate,
  authorize(['operator', 'admin']),
  body('attorney_id').isUUID(),
  body('attorney_price').isFloat({ min: 0 }),
  caseController.assignToAttorney
);

/**
 * POST /api/cases/:id/status
 * Change case status
 * Access: Operators, Attorneys, Admins
 */
router.post(
  '/:id/status',
  authenticate,
  canAccessCase,
  authorize(['operator', 'attorney', 'admin']),
  body('status').notEmpty(),
  body('comment').optional().isString(),
  caseController.changeStatus
);

/**
 * GET /api/cases/:id/next-statuses
 * Get allowed status transitions for the case's current status
 * Access: Anyone who can access the case
 */
router.get(
  '/:id/next-statuses',
  authenticate,
  canAccessCase,
  caseController.getNextStatuses
);

/**
 * GET /api/cases/:id/activity
 * Get activity log for case
 * Access: Anyone who can access the case
 */
router.get(
  '/:id/activity',
  authenticate,
  canAccessCase,
  caseController.getCaseActivity
);

/**
 * GET /api/cases/:id/documents
 * List uploaded documents for a case
 * Access: Case owner and assigned users
 */
router.get(
  '/:id/documents',
  authenticate,
  canAccessCase,
  caseController.listDocuments
);

/**
 * POST /api/cases/:id/documents
 * Upload a document to a case (max 10MB)
 * Access: Driver (own case), Operator (assigned case), Admin (any case)
 */
router.post(
  '/:id/documents',
  authenticate,
  authorize(['driver', 'operator', 'admin']),
  (req, res, next) => documentUpload(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  }),
  caseController.uploadDocument
);

/**
 * DELETE /api/cases/:id/documents/:documentId
 * Delete a document (uploader or admin)
 * Access: Driver (own case), Operator (own uploads), Admin (any)
 */
router.delete(
  '/:id/documents/:documentId',
  authenticate,
  authorize(['driver', 'operator', 'admin']),
  caseController.deleteDocument
);

/**
 * GET /api/cases/:id/attorneys
 * Get top 3 recommended attorneys for a case (driver-accessible)
 * Access: Case owner (driver) or assigned users
 */
router.get(
  '/:id/attorneys',
  authenticate,
  canAccessCase,
  caseController.getRecommendedAttorneys
);

/**
 * POST /api/cases/:id/select-attorney
 * Driver selects an attorney from recommendations
 * Access: Driver who owns the case
 */
router.post(
  '/:id/select-attorney',
  authenticate,
  authorize(['driver']),
  body('attorney_id').isUUID(),
  caseController.selectAttorney
);

/**
 * POST /api/cases/:id/payments
 * Driver creates a payment intent for the attorney fee
 * Access: Driver who owns the case
 */
router.post(
  '/:id/payments',
  authenticate,
  authorize('driver'),
  caseController.createCasePayment
);

/**
 * POST /api/cases/:id/accept
 * Attorney accepts assigned case
 * Access: Attorneys only
 */
router.post(
  '/:id/accept',
  authenticate,
  authorize(['attorney']),
  caseController.acceptCase
);

/**
 * POST /api/cases/:id/decline
 * Attorney declines assigned case - returns to queue
 * Access: Attorneys only
 */
router.post(
  '/:id/decline',
  authenticate,
  authorize(['attorney']),
  body('reason').optional().isString(),
  caseController.declineCase
);

// ============================================
// Case messaging (driver + attorney + operator)
// ============================================

/**
 * GET /api/cases/:id/conversation
 * Get or create conversation for a case
 * Access: Anyone who can access the case
 */
router.get(
  '/:id/conversation',
  authenticate,
  canAccessCase,
  caseController.getCaseConversation
);

/**
 * GET /api/cases/:id/messages
 * Get messages for a case conversation
 * Access: Anyone who can access the case
 */
router.get(
  '/:id/messages',
  authenticate,
  canAccessCase,
  caseController.getCaseMessages
);

/**
 * POST /api/cases/:id/messages
 * Send a message in a case conversation
 * Access: Anyone who can access the case
 */
router.post(
  '/:id/messages',
  authenticate,
  canAccessCase,
  caseController.sendCaseMessage
);

/**
 * DELETE /api/cases/:id
 * Delete case (soft delete)
 * Access: Admins only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  caseController.deleteCase
);

module.exports = router;

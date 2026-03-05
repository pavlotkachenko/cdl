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
    'other'
  ])
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
  body('attorney_price').optional().isFloat({ min: 0 })
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
 * Access: Operators, Attorneys, Admins
 */
router.patch(
  '/:id',
  authenticate,
  canAccessCase,
  authorize(['operator', 'attorney', 'admin']),
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

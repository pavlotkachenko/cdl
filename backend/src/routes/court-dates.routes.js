// ============================================
// COURT DATES ROUTES
// Court date management API routes
// ============================================

const express = require('express');
const router = express.Router();
const courtDatesController = require('../controllers/court-dates.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { body, query } = require('express-validator');

// ============================================
// VALIDATION RULES
// ============================================

const createCourtDateValidation = [
  body('case_id').isUUID().withMessage('Invalid case ID'),
  body('date').isISO8601().withMessage('Invalid date format'),
  body('time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format (HH:MM)'),
  body('location').notEmpty().withMessage('Location is required'),
  body('court_name').notEmpty().withMessage('Court name is required'),
  body('type').isIn(['hearing', 'trial', 'consultation', 'other']).withMessage('Invalid court date type'),
  body('notes').optional().isString()
];

const updateCourtDateValidation = [
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format (HH:MM)'),
  body('location').optional().notEmpty().withMessage('Location cannot be empty'),
  body('court_name').optional().notEmpty().withMessage('Court name cannot be empty'),
  body('type').optional().isIn(['hearing', 'trial', 'consultation', 'other']).withMessage('Invalid court date type'),
  body('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'rescheduled']).withMessage('Invalid status'),
  body('notes').optional().isString()
];

// ============================================
// ROUTES
// ============================================

/**
 * @route   POST /api/court-dates
 * @desc    Create new court date
 * @access  Private (Attorney, Admin)
 */
router.post(
  '/',
  authenticate,
  createCourtDateValidation,
  validate,
  courtDatesController.createCourtDate
);

/**
 * @route   GET /api/court-dates
 * @desc    Get all court dates with filters
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  query('case_id').optional().isUUID(),
  query('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'rescheduled']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  validate,
  courtDatesController.getCourtDates
);

/**
 * @route   GET /api/court-dates/upcoming
 * @desc    Get upcoming court dates for current user
 * @access  Private
 */
router.get(
  '/upcoming',
  authenticate,
  query('days').optional().isInt({ min: 1, max: 365 }),
  validate,
  courtDatesController.getUpcomingCourtDates
);

/**
 * @route   GET /api/court-dates/:id
 * @desc    Get court date by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  courtDatesController.getCourtDateById
);

/**
 * @route   PUT /api/court-dates/:id
 * @desc    Update court date
 * @access  Private (Attorney, Admin)
 */
router.put(
  '/:id',
  authenticate,
  updateCourtDateValidation,
  validate,
  courtDatesController.updateCourtDate
);

/**
 * @route   DELETE /api/court-dates/:id
 * @desc    Delete court date
 * @access  Private (Attorney, Admin)
 */
router.delete(
  '/:id',
  authenticate,
  courtDatesController.deleteCourtDate
);

/**
 * @route   POST /api/court-dates/:id/cancel
 * @desc    Cancel court date
 * @access  Private (Attorney, Admin)
 */
router.post(
  '/:id/cancel',
  authenticate,
  body('reason').optional().isString(),
  validate,
  courtDatesController.cancelCourtDate
);

/**
 * @route   POST /api/court-dates/:id/reschedule
 * @desc    Reschedule court date
 * @access  Private (Attorney, Admin)
 */
router.post(
  '/:id/reschedule',
  authenticate,
  body('new_date').isISO8601().withMessage('Invalid date format'),
  body('new_time').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Invalid time format (HH:MM)'),
  body('reason').optional().isString(),
  validate,
  courtDatesController.rescheduleCourtDate
);

/**
 * @route   GET /api/court-dates/case/:caseId
 * @desc    Get all court dates for a specific case
 * @access  Private
 */
router.get(
  '/case/:caseId',
  authenticate,
  courtDatesController.getCourtDatesByCase
);

module.exports = router;

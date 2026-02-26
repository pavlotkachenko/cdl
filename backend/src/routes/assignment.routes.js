/**
 * Assignment Routes - Smart attorney assignment routes
 * Location: backend/src/routes/assignment.routes.js
 */

const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/assignment/cases/:caseId/attorneys
 * @desc    Get ranked attorneys for a case
 * @access  Private (Operator, Admin)
 */
router.get(
  '/cases/:caseId/attorneys',
  authenticate,
  authorize(['operator', 'admin']),
  assignmentController.getRankedAttorneys
);

/**
 * @route   POST /api/assignment/cases/:caseId/auto-assign
 * @desc    Auto-assign case to best attorney
 * @access  Private (Operator, Admin)
 */
router.post(
  '/cases/:caseId/auto-assign',
  authenticate,
  authorize(['operator', 'admin']),
  assignmentController.autoAssignCase
);

/**
 * @route   POST /api/assignment/cases/:caseId/manual-assign
 * @desc    Manually assign case to specific attorney
 * @access  Private (Operator, Admin)
 */
router.post(
  '/cases/:caseId/manual-assign',
  authenticate,
  authorize(['operator', 'admin']),
  assignmentController.manualAssignCase
);

/**
 * @route   GET /api/assignment/cases/:caseId/attorneys/:attorneyId/score
 * @desc    Calculate score for specific attorney and case
 * @access  Private (Operator, Admin)
 */
router.get(
  '/cases/:caseId/attorneys/:attorneyId/score',
  authenticate,
  authorize(['operator', 'admin']),
  assignmentController.calculateAttorneyScore
);

module.exports = router;

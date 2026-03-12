/**
 * Operator Routes - Case queue management
 */

const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operator.controller');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * GET /api/operator/cases
 * Get cases queue (default status=new)
 * Access: Operators, Admins
 */
router.get(
  '/cases',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.getOperatorCases
);

/**
 * GET /api/operator/unassigned
 * Get unassigned cases for the queue
 * Access: Operators, Admins
 */
router.get(
  '/unassigned',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.getUnassignedCases
);

/**
 * POST /api/operator/cases/:caseId/request-assignment
 * Operator requests assignment to an unassigned case
 * Access: Operators
 */
router.post(
  '/cases/:caseId/request-assignment',
  authenticate,
  authorize(['operator']),
  operatorController.requestAssignment
);

/**
 * GET /api/operator/attorneys
 * Get available attorneys for manual assignment
 * Access: Operators, Admins
 */
router.get(
  '/attorneys',
  authenticate,
  authorize(['operator', 'admin']),
  operatorController.getAvailableAttorneys
);

module.exports = router;

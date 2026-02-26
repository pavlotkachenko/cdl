/**
 * Dashboard Routes - Role-specific dashboard routes
 * Location: backend/src/routes/dashboard.routes.js
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/dashboard/operator
 * @desc    Get operator dashboard data
 * @access  Private (Operator, Admin)
 */
router.get(
  '/operator',
  authenticate,
  authorize(['operator', 'admin']),
  dashboardController.getOperatorDashboard
);

/**
 * @route   GET /api/dashboard/attorney
 * @desc    Get attorney dashboard data
 * @access  Private (Attorney)
 */
router.get(
  '/attorney',
  authenticate,
  authorize(['attorney']),
  dashboardController.getAttorneyDashboard
);

/**
 * @route   GET /api/dashboard/driver
 * @desc    Get driver dashboard data
 * @access  Private (Driver)
 */
router.get(
  '/driver',
  authenticate,
  authorize(['driver']),
  dashboardController.getDriverDashboard
);

/**
 * @route   GET /api/dashboard/metrics
 * @desc    Get dashboard metrics summary
 * @access  Private (All authenticated users)
 */
router.get(
  '/metrics',
  authenticate,
  dashboardController.getDashboardMetrics
);

module.exports = router;

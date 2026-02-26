/**
 * Analytics Routes - Analytics and reporting routes
 * Location: backend/src/routes/analytics.routes.js
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

/**
 * @route   GET /api/analytics/cases
 * @desc    Get case analytics with filters
 * @access  Private (Operator, Admin)
 */
router.get(
  '/cases',
  authenticate,
  authorize(['operator', 'admin']),
  analyticsController.getCaseAnalytics
);

/**
 * @route   GET /api/analytics/attorneys/:attorneyId
 * @desc    Get attorney analytics
 * @access  Private (Attorney, Operator, Admin)
 */
router.get(
  '/attorneys/:attorneyId',
  authenticate,
  authorize(['attorney', 'operator', 'admin']),
  analyticsController.getAttorneyAnalytics
);

/**
 * @route   GET /api/analytics/operators/:operatorId
 * @desc    Get operator analytics
 * @access  Private (Operator, Admin)
 */
router.get(
  '/operators/:operatorId',
  authenticate,
  authorize(['operator', 'admin']),
  analyticsController.getOperatorAnalytics
);

/**
 * @route   GET /api/analytics/revenue
 * @desc    Get revenue analytics
 * @access  Private (Admin)
 */
router.get(
  '/revenue',
  authenticate,
  authorize(['admin']),
  analyticsController.getRevenueAnalytics
);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard metrics
 * @access  Private (All authenticated users)
 */
router.get(
  '/dashboard',
  authenticate,
  analyticsController.getDashboardMetrics
);

module.exports = router;

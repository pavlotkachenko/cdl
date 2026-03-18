// ============================================
// REVENUE ROUTES
// API endpoints for revenue analytics (admin only)
// ============================================

const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenue.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All revenue routes require authentication + admin role
router.use(authenticate);
router.use(authorize(['admin']));

/**
 * @route   GET /api/revenue/metrics
 * @desc    Get aggregate revenue metrics
 * @access  Private (Admin)
 */
router.get('/metrics', revenueController.getRevenueMetrics);

/**
 * @route   GET /api/revenue/daily
 * @desc    Get daily revenue breakdown
 * @access  Private (Admin)
 */
router.get('/daily', revenueController.getDailyRevenue);

/**
 * @route   GET /api/revenue/by-method
 * @desc    Get revenue grouped by payment method
 * @access  Private (Admin)
 */
router.get('/by-method', revenueController.getRevenueByMethod);

/**
 * @route   GET /api/revenue/by-attorney
 * @desc    Get revenue grouped by attorney
 * @access  Private (Admin)
 */
router.get('/by-attorney', revenueController.getRevenueByAttorney);

/**
 * @route   GET /api/revenue/transactions
 * @desc    Get last 20 transactions
 * @access  Private (Admin)
 */
router.get('/transactions', revenueController.getRecentTransactions);

/**
 * @route   GET /api/revenue/growth/monthly
 * @desc    Get monthly growth metrics
 * @access  Private (Admin)
 */
router.get('/growth/monthly', revenueController.getMonthlyGrowth);

/**
 * @route   GET /api/revenue/export
 * @desc    Export revenue data as CSV
 * @access  Private (Admin)
 */
router.get('/export', revenueController.exportToCsv);

module.exports = router;

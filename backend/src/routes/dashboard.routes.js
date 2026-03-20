const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const operatorDashboardController = require('../controllers/operatorDashboard.controller');
const auth = require('../middleware/auth');

/**
 * Driver Dashboard Routes
 * GET /api/drivers/:id/dashboard - Get driver dashboard with color-coded status
 */
router.get('/drivers/:id/dashboard', auth.authenticate, dashboardController.getDriverDashboard);

/**
 * Operator/Admin Dashboard Routes
 * Used by DashboardService on the frontend
 */
router.get('/workload', auth.authenticate, operatorDashboardController.getWorkloadStats);
router.get('/queue', auth.authenticate, operatorDashboardController.getCaseQueue);
router.get('/status-distribution', auth.authenticate, operatorDashboardController.getStatusDistribution);
router.get('/violation-distribution', auth.authenticate, operatorDashboardController.getViolationDistribution);
router.get('/attorney-workload', auth.authenticate, operatorDashboardController.getAttorneyWorkload);

module.exports = router;

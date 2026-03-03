const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middleware/auth');

/**
 * Driver Dashboard Routes
 * GET /api/drivers/:id/dashboard - Get driver dashboard with color-coded status
 */
router.get('/drivers/:id/dashboard', auth.authenticateDriver, dashboardController.getDriverDashboard);

module.exports = router;

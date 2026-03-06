'use strict';

const express = require('express');
const router  = express.Router();
const { authenticate } = require('../middleware/auth');
const driverController = require('../controllers/driver.controller');

// GET /api/drivers/me/analytics
router.get('/me/analytics', authenticate, driverController.getDriverAnalytics);

module.exports = router;

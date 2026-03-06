const express = require('express');
const router = express.Router();
const carrierController = require('../controllers/carrier.controller');
const { authenticate } = require('../middleware/auth');

// Public
router.post('/register', carrierController.register);

// Protected — carrier profile & fleet management
router.get('/me', authenticate, carrierController.getProfile);
router.put('/me', authenticate, carrierController.updateProfile);
router.get('/me/stats', authenticate, carrierController.getStats);
router.get('/me/drivers', authenticate, carrierController.getDrivers);
router.post('/me/drivers', authenticate, carrierController.addDriver);
router.delete('/me/drivers/:driverId', authenticate, carrierController.removeDriver);
router.get('/me/cases', authenticate, carrierController.getCases);
router.get('/me/analytics', authenticate, carrierController.getAnalytics);
router.get('/me/export', authenticate, carrierController.exportCases);
router.post('/me/bulk-import', authenticate, carrierController.bulkImport);
router.post('/me/cases/bulk-archive', authenticate, carrierController.bulkArchive);
router.get('/me/compliance-report', authenticate, carrierController.getComplianceReport);

module.exports = router;

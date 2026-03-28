/**
 * Violation Type Routes
 * Sprint 074 / Story VT-4
 *
 * Public endpoint for violation type metadata.
 */

const express = require('express');
const router = express.Router();
const violationTypeController = require('../controllers/violation-type.controller');

/**
 * GET /api/violation-types
 * Get active violation types with metadata (public, no auth)
 */
router.get('/', violationTypeController.getViolationTypes);

module.exports = router;

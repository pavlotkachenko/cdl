/**
 * WebAuthn Routes — mounted at /api/auth/webauthn
 * Sprint 037 BIO-1
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const webauthnController = require('../controllers/webauthn.controller');

// Registration (requires existing JWT — user is already logged in once)
router.post('/register/options', authenticate, webauthnController.registerOptions);
router.post('/register/verify',  authenticate, webauthnController.registerVerify);

// Authentication (no JWT yet — email-based lookup)
router.post('/auth/options', webauthnController.authOptions);
router.post('/auth/verify',  webauthnController.authVerify);

module.exports = router;

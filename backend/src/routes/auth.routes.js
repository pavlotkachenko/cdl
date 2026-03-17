const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Unified sign-in endpoint
router.post('/signin', authController.signIn);

// Registration endpoint (drivers and carriers)
router.post('/register', authController.register);

// Forgot password
router.post('/forgot-password', authController.forgotPassword);

// Reset password (with Supabase recovery token)
router.post('/reset-password', authController.resetPassword);

// Refresh token
router.post('/refresh', authController.refresh);

// OAuth callback (exchange Supabase OAuth token for app JWT)
router.post('/oauth/callback', authController.oauthCallback);

module.exports = router;

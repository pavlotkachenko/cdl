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

// Temporary auth diagnostic endpoint — DELETE after debugging
router.get('/debug', async (req, res) => {
  const { supabase, supabaseAnon, supabaseAdmin } = require('../config/supabase');
  const diagnostics = {
    supabaseUrl: process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL.substring(0, 30)}...` : 'NOT SET',
    anonKeySet: !!process.env.SUPABASE_ANON_KEY,
    anonKeyLength: process.env.SUPABASE_ANON_KEY?.length || 0,
    serviceRoleKeySet: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseAdminAvailable: !!supabaseAdmin,
  };

  // Test 1: List auth users via admin (proves admin key works)
  try {
    const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 5 });
    diagnostics.adminListUsers = listErr ? `ERROR: ${listErr.message}` : `OK (${listData?.users?.length || 0} users shown)`;
    if (listData?.users) {
      diagnostics.authUsers = listData.users.map(u => ({ email: u.email, confirmed: u.email_confirmed_at ? 'yes' : 'no', id: u.id.substring(0, 8) }));
    }
  } catch (e) {
    diagnostics.adminListUsers = `EXCEPTION: ${e.message}`;
  }

  // Test 2: Try signInWithPassword via anon client with a known-bad password
  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email: 'nonexistent@test.com', password: 'wrong' });
    diagnostics.anonSignInTest = error ? `Expected error: ${error.message} (status: ${error.status})` : 'Unexpected success';
  } catch (e) {
    diagnostics.anonSignInTest = `EXCEPTION: ${e.message}`;
  }

  // Test 3: Try signInWithPassword for the registered test user
  try {
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email: 'testdriver@example.com', password: 'TestPass123' });
    diagnostics.testUserSignIn = error ? `ERROR: ${error.message} (status: ${error.status})` : `OK (user: ${data?.user?.id?.substring(0, 8)})`;
  } catch (e) {
    diagnostics.testUserSignIn = `EXCEPTION: ${e.message}`;
  }

  res.json(diagnostics);
});

module.exports = router;

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

// Temporary seed endpoint — DELETE after use
router.post('/seed-users', async (req, res) => {
  const { supabase } = require('../config/supabase');
  const results = [];
  const users = [
    { email: 'driver@test.com',   name: 'Test Driver',   role: 'driver' },
    { email: 'admin@test.com',    name: 'Test Admin',    role: 'admin' },
    { email: 'attorney@test.com', name: 'Test Attorney', role: 'attorney' },
    { email: 'carrier@test.com',  name: 'Test Carrier',  role: 'carrier' },
    { email: 'operator@test.com', name: 'Test Operator', role: 'operator' },
  ];

  for (const u of users) {
    try {
      // 1. Create auth user (or find existing)
      let authId;
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: 'Test1234!',
        email_confirm: true,
        user_metadata: { full_name: u.name, role: u.role },
      });

      if (authErr) {
        // User might already exist in auth — try to find them
        const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = (list?.users || []).find(x => x.email === u.email);
        if (found) {
          authId = found.id;
          // Reset password to Test1234!
          await supabase.auth.admin.updateUserById(found.id, { password: 'Test1234!' });
        } else {
          results.push({ email: u.email, status: 'FAILED', error: authErr.message });
          continue;
        }
      } else {
        authId = authData.user.id;
      }

      // 2. Create or update public.users row
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', u.email)
        .maybeSingle();

      if (existing) {
        await supabase.from('users').update({
          auth_user_id: authId, full_name: u.name, role: u.role,
        }).eq('id', existing.id);
        results.push({ email: u.email, status: 'UPDATED', authId: authId.substring(0, 8), pubId: existing.id.substring(0, 8) });
      } else {
        const { data: newRow, error: insertErr } = await supabase.from('users').insert({
          email: u.email, full_name: u.name, role: u.role,
          auth_user_id: authId, email_verified: true,
        }).select('id').single();

        if (insertErr) {
          results.push({ email: u.email, status: 'AUTH_OK_DB_FAILED', error: insertErr.message });
        } else {
          results.push({ email: u.email, status: 'CREATED', authId: authId.substring(0, 8), pubId: newRow.id.substring(0, 8) });
        }
      }
    } catch (e) {
      results.push({ email: u.email, status: 'ERROR', error: e.message });
    }
  }

  res.json({ password: 'Test1234!', users: results });
});

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

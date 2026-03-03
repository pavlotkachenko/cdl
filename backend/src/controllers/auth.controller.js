const jwt = require('jsonwebtoken');
const { supabase, supabaseAnon } = require('../config/supabase');

// Use supabaseAnon for signInWithPassword so it doesn't pollute the admin
// client's auth state (which would cause RLS to kick in on subsequent DB queries).
const authClient = supabaseAnon;

// Valid DB enum values for user_role
const VALID_DB_ROLES = ['driver', 'attorney', 'admin', 'operator'];

// Map a requested role to a valid DB role; keep the original in user_metadata
function dbRole(role) {
  if (VALID_DB_ROLES.includes(role)) return role;
  // carrier → driver in the DB (they share the same dashboard)
  if (role === 'carrier') return 'driver';
  // paralegal → operator in the DB
  if (role === 'paralegal') return 'operator';
  return 'driver';
}

// POST /api/auth/signin
exports.signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const emailLower = email.toLowerCase();

    // 1. Authenticate via Supabase Auth (use separate client to avoid polluting admin session)
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: emailLower,
      password: password,
    });

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2. Fetch profile from users table (use db to bypass RLS)
    let userProfile = null;
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('email', emailLower)
      .maybeSingle();
    userProfile = profile;

    if (!userProfile) {
      const { data: profileById } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();
      userProfile = profileById;
    }

    // The real role comes from user_metadata (carrier, paralegal etc.) or the DB
    const role = authData.user.user_metadata?.role || userProfile?.role || 'driver';

    // 3. Generate JWT
    const token = jwt.sign(
      {
        userId: userProfile?.id || authData.user.id,
        email: emailLower,
        role: role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: userProfile?.id || authData.user.id,
      email: emailLower,
      role: role,
      name: userProfile?.full_name || authData.user.user_metadata?.full_name || '',
      phone: userProfile?.phone || '',
    };

    res.json({ token, user: userResponse });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, phone, cdlNumber, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const emailLower = email.toLowerCase();
    const requestedRole = role === 'carrier' ? 'carrier' : 'driver';
    const profileRole = dbRole(requestedRole); // safe for the DB enum

    // 1. Check if email already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', emailLower)
      .maybeSingle();
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // 2. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emailLower,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: requestedRole, // keep the real role (carrier, driver, etc.)
      },
    });

    if (authError) {
      if (authError.message?.includes('already been registered') || authError.status === 422) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      console.error('Supabase Auth error:', authError);
      return res.status(500).json({ error: 'Registration failed' });
    }

    // 3. Create profile row (use db to bypass RLS)
    const { data: newProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        email: emailLower,
        full_name: name,
        phone: phone || null,
        role: profileRole,
        auth_user_id: authData.user.id,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Registration failed' });
    }

    // 4. Generate JWT — use the *requested* role, not the DB role
    const token = jwt.sign(
      { userId: newProfile.id, email: emailLower, role: requestedRole },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newProfile.id,
        email: emailLower,
        role: requestedRole,
        name: newProfile.full_name,
        phone: newProfile.phone || '',
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password`,
    });

    res.json({ message: 'If an account exists with that email, password reset instructions have been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', data.user.id)
      .maybeSingle();

    const role = data.user.user_metadata?.role || profile?.role || 'driver';

    const accessToken = jwt.sign(
      { userId: profile?.id || data.user.id, email: data.user.email, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

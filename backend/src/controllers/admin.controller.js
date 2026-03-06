/**
 * Admin Controller — Platform user management
 * All handlers require authenticate + authorize('admin') middleware.
 */

const { supabase } = require('../config/supabase');

// ─────────────────────────────────────────────
// GET /api/admin/users
// Query params: role, status (active | suspended | pending)
// ─────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const { role, status } = req.query;

    let query = supabase
      .from('users')
      .select('id, full_name, email, role, is_active, created_at, last_login')
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (status === 'active') query = query.eq('is_active', true);
    if (status === 'suspended') query = query.eq('is_active', false);

    const { data, error } = await query;
    if (error) throw error;

    const users = (data || []).map(u => ({
      id: u.id,
      name: u.full_name,
      email: u.email,
      role: u.role,
      status: u.is_active ? 'active' : 'suspended',
      createdAt: u.created_at,
      lastLogin: u.last_login || null,
    }));

    res.json({ users });
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch users' } });
  }
};

// ─────────────────────────────────────────────
// POST /api/admin/users/invite
// Body: { email, role }
// ─────────────────────────────────────────────
exports.inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email and role are required' },
      });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        error: { code: 'DUPLICATE_EMAIL', message: 'A user with this email already exists' },
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .insert({ email, role, full_name: email, is_active: false })
      .select('id, email, role')
      .single();

    if (error) throw error;

    res.status(201).json({ user: { id: user.id, email: user.email, role: user.role, status: 'pending' } });
  } catch (error) {
    console.error('inviteUser error:', error);
    res.status(500).json({ error: { code: 'INVITE_FAILED', message: 'Failed to invite user' } });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/admin/users/:id/role
// Body: { role }
// ─────────────────────────────────────────────
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Role is required' },
      });
    }

    // Fetch current role to enforce last-admin guard
    const { data: target, error: fetchErr } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (fetchErr || !target) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    if (target.role === 'admin' && role !== 'admin') {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('is_active', true);

      if (count <= 1) {
        return res.status(400).json({
          error: { code: 'LAST_ADMIN', message: 'Cannot change the role of the last admin' },
        });
      }
    }

    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select('id, role')
      .single();

    if (error) throw error;

    res.json({ user: { id: data.id, role: data.role } });
  } catch (error) {
    console.error('changeUserRole error:', error);
    res.status(500).json({ error: { code: 'UPDATE_FAILED', message: 'Failed to change user role' } });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/admin/users/:id/suspend
// ─────────────────────────────────────────────
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select('id, is_active')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });

    res.json({ user: { id: data.id, status: 'suspended' } });
  } catch (error) {
    console.error('suspendUser error:', error);
    res.status(500).json({ error: { code: 'UPDATE_FAILED', message: 'Failed to suspend user' } });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/admin/users/:id/unsuspend
// ─────────────────────────────────────────────
exports.unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', id)
      .select('id, is_active')
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });

    res.json({ user: { id: data.id, status: 'active' } });
  } catch (error) {
    console.error('unsuspendUser error:', error);
    res.status(500).json({ error: { code: 'UPDATE_FAILED', message: 'Failed to unsuspend user' } });
  }
};

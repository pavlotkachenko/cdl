/**
 * Admin Controller — Platform user management + assignment request approval
 * All handlers require authenticate + authorize('admin') middleware.
 */

const { supabase } = require('../config/supabase');
const { emitToUser } = require('../socket/socket');

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

// ─────────────────────────────────────────────
// GET /api/admin/assignment-requests
// Returns pending operator assignment requests with joins
// ─────────────────────────────────────────────
exports.getAssignmentRequests = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assignment_requests')
      .select('id, status, created_at, operator_id, case_id, operator:users!operator_id(id, full_name), case:cases!case_id(id, case_number, violation_type, state)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    const requests = (data || []).map(r => ({
      id: r.id,
      operator: r.operator ? { id: r.operator.id, full_name: r.operator.full_name } : null,
      case: r.case ? { id: r.case.id, case_number: r.case.case_number, violation_type: r.case.violation_type, state: r.case.state } : null,
      status: r.status,
      created_at: r.created_at,
    }));

    res.json({ requests });
  } catch (error) {
    console.error('getAssignmentRequests error:', error);
    res.status(500).json({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch assignment requests' } });
  }
};

// ─────────────────────────────────────────────
// POST /api/admin/assignment-requests/:requestId/approve
// ─────────────────────────────────────────────
exports.approveAssignmentRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Fetch the request
    const { data: request, error: fetchErr } = await supabase
      .from('assignment_requests')
      .select('id, status, operator_id, case_id')
      .eq('id', requestId)
      .single();

    if (fetchErr || !request) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Assignment request not found' } });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: { code: 'ALREADY_PROCESSED', message: 'Request has already been processed' } });
    }

    // Check if case already has an operator assigned
    const { data: caseData, error: caseErr } = await supabase
      .from('cases')
      .select('id, case_number, assigned_operator_id')
      .eq('id', request.case_id)
      .single();

    if (caseErr || !caseData) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }

    if (caseData.assigned_operator_id && caseData.assigned_operator_id !== request.operator_id) {
      return res.status(409).json({ error: { code: 'ALREADY_ASSIGNED', message: 'Case has already been assigned to an operator' } });
    }

    // Approve: update request status
    await supabase
      .from('assignment_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    // Assign operator to case
    await supabase
      .from('cases')
      .update({ assigned_operator_id: request.operator_id, updated_at: new Date().toISOString() })
      .eq('id', request.case_id);

    // Create notification for the operator
    await supabase.from('notifications').insert({
      user_id: request.operator_id,
      case_id: request.case_id,
      title: 'Assignment Request Approved',
      message: `Your request to handle case ${caseData.case_number} has been approved`,
      type: 'assignment_approved',
    }).catch(() => {});

    // Activity log
    await supabase.from('activity_log').insert({
      case_id: request.case_id,
      user_id: req.user.id,
      action: 'assignment_approved',
      details: { operator_id: request.operator_id, request_id: requestId },
    }).catch(() => {});

    // Real-time notification
    emitToUser(request.operator_id, 'assignment:approved', {
      requestId, caseId: request.case_id, caseNumber: caseData.case_number,
    });

    res.json({ success: true, message: 'Assignment request approved' });
  } catch (error) {
    console.error('approveAssignmentRequest error:', error);
    res.status(500).json({ error: { code: 'APPROVE_FAILED', message: 'Failed to approve assignment request' } });
  }
};

// ─────────────────────────────────────────────
// POST /api/admin/assignment-requests/:requestId/reject
// Body (optional): { reason: string }
// ─────────────────────────────────────────────
exports.rejectAssignmentRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body || {};

    // Fetch the request
    const { data: request, error: fetchErr } = await supabase
      .from('assignment_requests')
      .select('id, status, operator_id, case_id')
      .eq('id', requestId)
      .single();

    if (fetchErr || !request) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Assignment request not found' } });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: { code: 'ALREADY_PROCESSED', message: 'Request has already been processed' } });
    }

    // Get case number for notification message
    const { data: caseData } = await supabase
      .from('cases')
      .select('case_number')
      .eq('id', request.case_id)
      .single();

    const caseNumber = caseData?.case_number || request.case_id;

    // Reject: update request status
    await supabase
      .from('assignment_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    // Create notification
    const message = reason
      ? `Your request for case ${caseNumber} was declined. Reason: ${reason}`
      : `Your request for case ${caseNumber} was declined`;

    await supabase.from('notifications').insert({
      user_id: request.operator_id,
      case_id: request.case_id,
      title: 'Assignment Request Rejected',
      message,
      type: 'assignment_rejected',
    }).catch(() => {});

    // Real-time notification
    emitToUser(request.operator_id, 'assignment:rejected', {
      requestId, caseId: request.case_id, caseNumber, reason: reason || null,
    });

    res.json({ success: true, message: 'Assignment request rejected' });
  } catch (error) {
    console.error('rejectAssignmentRequest error:', error);
    res.status(500).json({ error: { code: 'REJECT_FAILED', message: 'Failed to reject assignment request' } });
  }
};

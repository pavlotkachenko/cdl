/**
 * Operator Controller - Case queue management for operators
 */

const { supabase } = require('../config/supabase');

/**
 * GET /api/operator/cases
 * Operator's own assigned cases
 * Query params: status (optional filter)
 */
exports.getOperatorCases = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { status } = req.query;

    let query = supabase
      .from('cases')
      .select(`
        id, case_number, status, state, violation_type, created_at,
        customer_name, attorney_price,
        driver:driver_id(id, full_name, phone)
      `)
      .eq('assigned_operator_id', operatorId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const now = Date.now();
    const cases = (data || []).map(c => ({
      ...c,
      ageHours: Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60))
    }));

    const inProgress = cases.filter(c =>
      ['reviewed', 'assigned_to_attorney', 'send_info_to_attorney', 'waiting_for_driver', 'call_court'].includes(c.status)
    ).length;

    const resolvedToday = cases.filter(c =>
      (c.status === 'resolved' || c.status === 'closed')
    ).length;

    // Count pending assignment requests
    const { count: pendingRequests } = await supabase
      .from('assignment_requests')
      .select('id', { count: 'exact', head: true })
      .eq('operator_id', operatorId)
      .eq('status', 'pending');

    res.json({
      cases,
      summary: {
        assignedToMe: cases.length,
        inProgress,
        resolvedToday,
        pendingApproval: pendingRequests || 0
      }
    });
  } catch (error) {
    console.error('Get operator cases error:', error);
    res.status(500).json({ error: { code: 'FETCH_ERROR', message: 'Failed to fetch cases' } });
  }
};

/**
 * GET /api/operator/unassigned
 * Unassigned cases (no operator assigned) for the queue
 */
exports.getUnassignedCases = async (req, res) => {
  try {
    const operatorId = req.user.id;

    const { data, error } = await supabase
      .from('cases')
      .select(`
        id, case_number, status, state, violation_type, created_at,
        customer_name, attorney_price,
        driver:driver_id(id, full_name, phone)
      `)
      .is('assigned_operator_id', null)
      .in('status', ['new', 'submitted'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Check which cases the operator has already requested
    const { data: requests } = await supabase
      .from('assignment_requests')
      .select('case_id, status')
      .eq('operator_id', operatorId)
      .eq('status', 'pending');

    const requestedCaseIds = new Set((requests || []).map(r => r.case_id));

    const now = Date.now();
    const cases = (data || []).map(c => ({
      ...c,
      ageHours: Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60)),
      requested: requestedCaseIds.has(c.id)
    }));

    res.json({ cases });
  } catch (error) {
    console.error('Get unassigned cases error:', error);
    res.status(500).json({ error: { code: 'FETCH_ERROR', message: 'Failed to fetch unassigned cases' } });
  }
};

/**
 * POST /api/operator/cases/:caseId/request-assignment
 * Operator requests to be assigned to an unassigned case
 */
exports.requestAssignment = async (req, res) => {
  try {
    const { caseId } = req.params;
    const operatorId = req.user.id;

    // Verify case exists and is unassigned
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, case_number, assigned_operator_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }

    if (caseData.assigned_operator_id) {
      return res.status(400).json({ error: { code: 'ALREADY_ASSIGNED', message: 'Case is already assigned to an operator' } });
    }

    // Check for existing pending request
    const { data: existing } = await supabase
      .from('assignment_requests')
      .select('id')
      .eq('case_id', caseId)
      .eq('operator_id', operatorId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: { code: 'DUPLICATE_REQUEST', message: 'You already have a pending request for this case' } });
    }

    // Create the request
    const { data: request, error: insertError } = await supabase
      .from('assignment_requests')
      .insert({
        case_id: caseId,
        operator_id: operatorId,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Notify admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    const operatorName = req.user.full_name || req.user.name || 'An operator';
    for (const admin of (admins || [])) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        case_id: caseId,
        title: 'Assignment Request',
        message: `${operatorName} has requested assignment to case ${caseData.case_number}`,
        type: 'assignment'
      }).catch(() => {});
    }

    res.status(201).json({ request });
  } catch (error) {
    console.error('Request assignment error:', error);
    res.status(500).json({ error: { code: 'REQUEST_ERROR', message: 'Failed to request assignment' } });
  }
};

/**
 * GET /api/operator/attorneys
 * Available attorneys for manual assignment with workload info
 */
exports.getAvailableAttorneys = async (req, res) => {
  try {
    const { data: attorneys, error } = await supabase
      .from('users')
      .select('id, full_name, email, specializations, jurisdictions')
      .eq('role', 'attorney');

    if (error) throw error;

    // Get active case counts per attorney
    const { data: caseCounts } = await supabase
      .from('cases')
      .select('assigned_attorney_id')
      .in('status', ['assigned_to_attorney', 'send_info_to_attorney', 'waiting_for_driver', 'call_court']);

    const countMap = (caseCounts || []).reduce((map, c) => {
      if (c.assigned_attorney_id) {
        map[c.assigned_attorney_id] = (map[c.assigned_attorney_id] || 0) + 1;
      }
      return map;
    }, {});

    const result = (attorneys || []).map(a => ({
      id: a.id,
      fullName: a.full_name,
      email: a.email,
      specializations: a.specializations || [],
      jurisdictions: a.jurisdictions || [],
      activeCount: countMap[a.id] || 0
    }));

    res.json({ attorneys: result });
  } catch (error) {
    console.error('Get available attorneys error:', error);
    res.status(500).json({ error: 'Failed to fetch attorneys' });
  }
};

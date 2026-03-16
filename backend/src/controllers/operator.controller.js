/**
 * Operator Controller - Case queue management for operators
 */

const { supabase } = require('../config/supabase');

/**
 * Calculate priority level based on court date proximity and case age.
 * @param {object} caseData — must have created_at, assigned_attorney_id
 * @param {string|null} courtDate — ISO timestamp of next upcoming court date
 * @returns {'critical'|'high'|'medium'|'low'}
 */
function calculatePriority(caseData, courtDate) {
  const now = Date.now();
  const ageHours = (now - new Date(caseData.created_at).getTime()) / (1000 * 60 * 60);
  const daysUntilCourt = courtDate
    ? (new Date(courtDate).getTime() - now) / (1000 * 60 * 60 * 24)
    : Infinity;
  const hasAttorney = !!caseData.assigned_attorney_id;

  if (daysUntilCourt <= 3 || (ageHours > 96 && !hasAttorney)) return 'critical';
  if (daysUntilCourt <= 7 || ageHours > 48) return 'high';
  if (daysUntilCourt <= 14 || ageHours > 24) return 'medium';
  return 'low';
}

/**
 * Pick the next upcoming scheduled court date from an array of court_dates rows.
 * Prefers the closest future date; falls back to the most recent past date.
 * @param {Array} courtDates — rows from PostgREST embedded court_dates
 * @returns {{ date: string, court_name: string } | null}
 */
function pickNextCourtDate(courtDates) {
  if (!courtDates || courtDates.length === 0) return null;

  const scheduled = courtDates.filter(cd => cd.status === 'scheduled');
  if (scheduled.length === 0) return null;

  const now = Date.now();
  const future = scheduled
    .filter(cd => new Date(cd.date).getTime() >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (future.length > 0) return future[0];

  // All past — return most recent
  const past = scheduled.sort((a, b) => new Date(b.date) - new Date(a.date));
  return past[0];
}

// Export for testing
exports._calculatePriority = calculatePriority;
exports._pickNextCourtDate = pickNextCourtDate;

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
        customer_name, attorney_price, assigned_attorney_id,
        driver:driver_id(id, full_name, phone),
        court_dates(id, date, court_name, location, status)
      `)
      .eq('assigned_operator_id', operatorId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    const now = Date.now();
    const cases = (data || []).map(c => {
      const nextCourt = pickNextCourtDate(c.court_dates);
      const courtDate = nextCourt ? nextCourt.date : null;
      return {
        ...c,
        court_dates: undefined,
        fine_amount: c.attorney_price ?? null,
        court_date: courtDate,
        courthouse: nextCourt ? (nextCourt.court_name || nextCourt.location || null) : null,
        priority: calculatePriority(c, courtDate),
        ageHours: Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60)),
      };
    });

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
        customer_name, attorney_price, assigned_attorney_id,
        driver:driver_id(id, full_name, phone),
        court_dates(id, date, court_name, location, status)
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
    const cases = (data || []).map(c => {
      const nextCourt = pickNextCourtDate(c.court_dates);
      const courtDate = nextCourt ? nextCourt.date : null;
      return {
        ...c,
        court_dates: undefined,
        fine_amount: c.attorney_price ?? null,
        court_date: courtDate,
        courthouse: nextCourt ? (nextCourt.court_name || nextCourt.location || null) : null,
        priority: calculatePriority(c, courtDate),
        ageHours: Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60)),
        requested: requestedCaseIds.has(c.id),
      };
    });

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
 * Valid case_status enum values for status updates.
 */
const VALID_STATUSES = [
  'new', 'reviewed', 'assigned_to_attorney', 'waiting_for_driver',
  'send_info_to_attorney', 'attorney_paid', 'call_court',
  'check_with_manager', 'pay_attorney', 'resolved', 'closed',
];

/**
 * Statuses that are visible to the driver and should trigger a notification.
 */
const DRIVER_VISIBLE_STATUSES = [
  'reviewed', 'assigned_to_attorney', 'waiting_for_driver', 'closed',
];

/**
 * GET /api/operator/cases/:caseId
 * Full case detail for a single case, including driver, attorney, court dates, activity log.
 */
exports.getCaseDetail = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        id, case_number, status, state, violation_type, violation_date, created_at, updated_at,
        customer_name, county, attorney_price, assigned_operator_id, assigned_attorney_id,
        driver:driver_id(id, full_name, phone, email, cdl_number),
        attorney:assigned_attorney_id(id, full_name, email, specializations),
        court_dates(id, date, court_name, location, status)
      `)
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }

    // Access check: operator must be assigned, or user must be admin
    if (userRole !== 'admin' && caseData.assigned_operator_id !== userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to view this case' } });
    }

    // Fetch activity log
    const { data: activityData } = await supabase
      .from('activity_log')
      .select('id, action, details, created_at, user_id')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Fetch pending assignment request for this operator
    const { data: assignmentReq } = await supabase
      .from('assignment_requests')
      .select('id, status, created_at')
      .eq('case_id', caseId)
      .eq('status', 'pending')
      .limit(1);

    const nextCourt = pickNextCourtDate(caseData.court_dates);
    const courtDate = nextCourt ? nextCourt.date : null;

    const enrichedCase = {
      ...caseData,
      fine_amount: caseData.attorney_price ?? null,
      court_date: courtDate,
      courthouse: nextCourt ? (nextCourt.court_name || nextCourt.location || null) : null,
      priority: calculatePriority(caseData, courtDate),
      ageHours: Math.floor((Date.now() - new Date(caseData.created_at).getTime()) / (1000 * 60 * 60)),
      assignment_request: (assignmentReq && assignmentReq.length > 0) ? assignmentReq[0] : null,
    };

    res.json({
      case: enrichedCase,
      activity: activityData || [],
    });
  } catch (error) {
    console.error('Get case detail error:', error);
    res.status(500).json({ error: { code: 'FETCH_ERROR', message: 'Failed to fetch case detail' } });
  }
};

/**
 * PATCH /api/operator/cases/:caseId/status
 * Update case status with optional note, creating an activity log entry.
 */
exports.updateCaseStatus = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, note } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: { code: 'INVALID_STATUS', message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` } });
    }

    // Fetch case to verify access
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, case_number, status, assigned_operator_id, driver_id')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }

    if (userRole !== 'admin' && caseData.assigned_operator_id !== userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to update this case' } });
    }

    const oldStatus = caseData.status;

    // Update status
    const { data: updated, error: updateError } = await supabase
      .from('cases')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', caseId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Insert activity log entry
    await supabase.from('activity_log').insert({
      case_id: caseId,
      user_id: userId,
      action: 'status_change',
      details: { from: oldStatus, to: status, note: note || null },
    }).catch(() => {});

    // Notify driver if status is customer-visible
    if (DRIVER_VISIBLE_STATUSES.includes(status) && caseData.driver_id) {
      await supabase.from('notifications').insert({
        user_id: caseData.driver_id,
        case_id: caseId,
        title: 'Case Status Update',
        message: `Your case ${caseData.case_number} status has been updated to ${status}`,
        type: 'case_update',
      }).catch(() => {});
    }

    res.json({ case: updated });
  } catch (error) {
    console.error('Update case status error:', error);
    res.status(500).json({ error: { code: 'UPDATE_ERROR', message: 'Failed to update case status' } });
  }
};

// Export for testing
exports._VALID_STATUSES = VALID_STATUSES;

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
    res.status(500).json({ error: { code: 'FETCH_ERROR', message: 'Failed to fetch attorneys' } });
  }
};

// ─────────────────────────────────────────────────────────────────
// OC-4: Operator Messaging — conversation & message endpoints
// ─────────────────────────────────────────────────────────────────

/**
 * GET /api/operator/cases/:caseId/conversation
 * Get (or create) the operator–driver conversation for a case.
 */
exports.getCaseConversation = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const userRole = req.user?.role;

    // Verify case exists and operator has access
    const { data: caseData, error: caseErr } = await supabase
      .from('cases')
      .select('case_id, case_number, driver_id, assigned_operator_id')
      .eq('case_id', caseId)
      .single();

    if (caseErr || !caseData) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }
    if (userRole !== 'admin' && caseData.assigned_operator_id !== userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not assigned to this case' } });
    }

    // Look for an existing conversation for this case
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (existing && existing.length > 0) {
      return res.json({ success: true, data: existing[0] });
    }

    // No conversation yet — create one (operator stored in attorney_id slot)
    const driverId = caseData.driver_id;
    if (!driverId) {
      return res.status(400).json({ error: { code: 'NO_DRIVER', message: 'Case has no linked driver' } });
    }

    const { data: created, error: createErr } = await supabase
      .from('conversations')
      .insert([{
        case_id: caseId,
        driver_id: driverId,
        attorney_id: userId,
        accessed_by: [userId],
      }])
      .select('*')
      .single();

    if (createErr) {
      return res.status(500).json({ error: { code: 'CREATE_FAILED', message: createErr.message } });
    }

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('getCaseConversation error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get conversation' } });
  }
};

/**
 * GET /api/operator/cases/:caseId/messages
 * Get messages for the case conversation.
 */
exports.getCaseMessages = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const userRole = req.user?.role;

    // Verify access
    const { data: caseData } = await supabase
      .from('cases')
      .select('case_id, assigned_operator_id')
      .eq('case_id', caseId)
      .single();

    if (!caseData) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }
    if (userRole !== 'admin' && caseData.assigned_operator_id !== userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not assigned to this case' } });
    }

    // Find conversation
    const { data: convos } = await supabase
      .from('conversations')
      .select('id')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!convos || convos.length === 0) {
      return res.json({ success: true, data: { messages: [], total: 0 } });
    }

    const conversationId = convos[0].id;

    // Fetch messages
    const { data: messages, error: msgErr, count } = await supabase
      .from('messages')
      .select('*, sender:users!sender_id(user_id, full_name, role)', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (msgErr) {
      return res.status(500).json({ error: { code: 'QUERY_FAILED', message: msgErr.message } });
    }

    res.json({ success: true, data: { messages: messages || [], total: count || 0, conversationId } });
  } catch (error) {
    console.error('getCaseMessages error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to get messages' } });
  }
};

/**
 * POST /api/operator/cases/:caseId/messages
 * Send a message in the case conversation. Creates conversation if needed.
 */
exports.sendCaseMessage = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId || req.user?.id;
    const userRole = req.user?.role;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Message content is required' } });
    }

    // Verify access
    const { data: caseData } = await supabase
      .from('cases')
      .select('case_id, driver_id, assigned_operator_id')
      .eq('case_id', caseId)
      .single();

    if (!caseData) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Case not found' } });
    }
    if (userRole !== 'admin' && caseData.assigned_operator_id !== userId) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not assigned to this case' } });
    }

    // Find or create conversation
    let conversationId;
    const { data: convos } = await supabase
      .from('conversations')
      .select('id')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (convos && convos.length > 0) {
      conversationId = convos[0].id;
    } else {
      const { data: created, error: createErr } = await supabase
        .from('conversations')
        .insert([{
          case_id: caseId,
          driver_id: caseData.driver_id,
          attorney_id: userId,
          accessed_by: [userId],
        }])
        .select('id')
        .single();
      if (createErr) {
        return res.status(500).json({ error: { code: 'CREATE_FAILED', message: createErr.message } });
      }
      conversationId = created.id;
    }

    // Insert message
    const { data: message, error: msgErr } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversationId,
        sender_id: userId,
        recipient_id: caseData.driver_id,
        content: content.trim(),
        message_type: 'text',
        priority: 'normal',
      }])
      .select('*')
      .single();

    if (msgErr) {
      return res.status(500).json({ error: { code: 'SEND_FAILED', message: msgErr.message } });
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)
      .catch(() => {});

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('sendCaseMessage error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to send message' } });
  }
};

// ─────────────────────────────────────────────────────────────────
// OC-5: Batch OCR — sequential multi-file processing
// ─────────────────────────────────────────────────────────────────

/**
 * POST /api/operator/batch-ocr
 * Process multiple ticket images through OCR sequentially.
 * Returns per-file results with filenames and a summary.
 */
exports.batchOcr = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: { code: 'NO_FILES', message: 'No files uploaded' } });
    }

    const ocrService = require('../services/ocr.service');
    const results = [];

    // Process sequentially to avoid overloading OCR service
    for (const file of req.files) {
      try {
        const data = await ocrService.extractTicketData(file.buffer);
        results.push({
          filename: file.originalname,
          success: true,
          data: {
            violation_type: data.extractedData?.violationType || null,
            violation_date: data.extractedData?.violationDate || null,
            state: data.extractedData?.state || null,
            county: data.extractedData?.location || null,
            fine_amount: data.extractedData?.fineAmount || null,
            court_date: data.extractedData?.courtDate || null,
            citation_number: data.extractedData?.citationNumber || null,
            confidence: data.validation?.overallConfidence ?? data.confidence ?? 0,
          },
        });
      } catch (fileErr) {
        results.push({
          filename: file.originalname,
          success: false,
          error: fileErr.message || 'Could not extract text from image',
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    res.json({
      success: true,
      data: {
        results,
        summary: { total: results.length, successful, failed },
      },
    });
  } catch (error) {
    console.error('batchOcr error:', error);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Batch OCR processing failed' } });
  }
};

/**
 * GET /api/operator/team-cases
 * All non-closed cases across all operators (read-only team view)
 */
exports.getTeamCases = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select(`
        id, case_number, status, state, violation_type, created_at, updated_at,
        customer_name, assigned_operator_id,
        operator:assigned_operator_id(id, full_name)
      `)
      .not('status', 'in', '("closed","resolved")')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const now = Date.now();
    const cases = (data || []).map(c => ({
      ...c,
      ageHours: Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60)),
      operator_name: c.operator?.full_name || null,
      operator: undefined,
    }));

    res.json({ cases });
  } catch (error) {
    console.error('Get team cases error:', error);
    res.status(500).json({ error: { code: 'FETCH_ERROR', message: 'Failed to fetch team cases' } });
  }
};

/**
 * GET /api/operator/closed-cases
 * Operator's own resolved/closed cases (archive)
 */
exports.getClosedCases = async (req, res) => {
  try {
    const operatorId = req.user.id;

    const { data, error } = await supabase
      .from('cases')
      .select(`
        id, case_number, status, state, violation_type, created_at, updated_at,
        customer_name
      `)
      .eq('assigned_operator_id', operatorId)
      .in('status', ['closed', 'resolved'])
      .order('updated_at', { ascending: false });

    if (error) throw error;

    res.json({ cases: data || [] });
  } catch (error) {
    console.error('Get closed cases error:', error);
    res.status(500).json({ error: { code: 'FETCH_ERROR', message: 'Failed to fetch closed cases' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/operator/all-cases
// Full case table with 19 fields, operator-scoped visibility,
// server-side sorting, filtering, search, and pagination.
// ─────────────────────────────────────────────
const SORTABLE_COLUMNS = new Set([
  'case_number', 'customer_name', 'status', 'state', 'violation_type',
  'violation_date', 'court_date', 'next_action_date', 'attorney_price',
  'price_cdl', 'court_fee', 'carrier', 'created_at', 'updated_at',
]);

exports.getAllCasesTable = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const {
      status, state, carrier,
      search, sort_by, sort_dir, limit = '50', offset = '0',
    } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 50, 500);
    const off = parseInt(offset, 10) || 0;

    const sortBy = SORTABLE_COLUMNS.has(sort_by) ? sort_by : 'created_at';
    const sortAsc = sort_dir === 'asc';

    let query = supabase
      .from('cases')
      .select(`
        id, case_number, status, state, violation_type, violation_date,
        customer_name, customer_email, driver_phone, customer_type,
        court_date, next_action_date,
        assigned_operator_id, assigned_attorney_id,
        attorney_price, price_cdl, subscriber_paid, court_fee, court_fee_paid_by,
        carrier, who_sent,
        created_at, updated_at,
        operator:assigned_operator_id(id, full_name),
        attorney:assigned_attorney_id(id, full_name)
      `, { count: 'exact' })
      // Operator sees: own assigned cases + all non-closed team cases
      .or(`assigned_operator_id.eq.${operatorId},and(status.neq.closed,status.neq.resolved)`)
      .order(sortBy, { ascending: sortAsc })
      .range(off, off + lim - 1);

    // Filters
    if (status) {
      const statuses = status.split(',').filter(Boolean);
      if (statuses.length === 1) query = query.eq('status', statuses[0]);
      else if (statuses.length > 1) query = query.in('status', statuses);
    }
    if (state) {
      const states = state.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      if (states.length === 1) query = query.eq('state', states[0]);
      else if (states.length > 1) query = query.in('state', states);
    }
    if (carrier) query = query.ilike('carrier', `%${carrier}%`);
    if (search) {
      query = query.or(
        `case_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,carrier.ilike.%${search}%`
      );
    }

    const { data, count: total, error } = await query;
    if (error) throw error;

    // Batch file counts
    const caseIds = (data || []).map(c => c.id);
    let fileCounts = {};
    if (caseIds.length > 0) {
      const { data: fileData } = await supabase
        .from('case_files')
        .select('case_id')
        .in('case_id', caseIds);
      fileCounts = (fileData || []).reduce((acc, f) => {
        acc[f.case_id] = (acc[f.case_id] || 0) + 1;
        return acc;
      }, {});
    }

    const now = Date.now();
    const cases = (data || []).map(c => ({
      id: c.id,
      case_number: c.case_number,
      status: c.status,
      state: c.state,
      violation_type: c.violation_type,
      violation_date: c.violation_date,
      customer_name: c.customer_name,
      customer_email: c.customer_email,
      driver_phone: c.driver_phone || null,
      customer_type: c.customer_type || null,
      court_date: c.court_date || null,
      next_action_date: c.next_action_date || null,
      assigned_operator_id: c.assigned_operator_id,
      operator_name: c.operator?.full_name || null,
      assigned_attorney_id: c.assigned_attorney_id,
      attorney_name: c.attorney?.full_name || null,
      attorney_price: c.attorney_price != null ? Number(c.attorney_price) : null,
      price_cdl: c.price_cdl != null ? Number(c.price_cdl) : null,
      subscriber_paid: c.subscriber_paid ?? null,
      court_fee: c.court_fee != null ? Number(c.court_fee) : null,
      court_fee_paid_by: c.court_fee_paid_by || null,
      carrier: c.carrier || null,
      who_sent: c.who_sent || null,
      file_count: fileCounts[c.id] || 0,
      created_at: c.created_at,
      updated_at: c.updated_at,
      ageHours: Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60)),
    }));

    res.json({ cases, total: total || 0 });
  } catch (error) {
    console.error('getAllCasesTable error:', error);
    res.status(500).json({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch cases' } });
  }
};

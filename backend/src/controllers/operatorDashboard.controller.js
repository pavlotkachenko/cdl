/**
 * Operator Dashboard Controller
 * Serves endpoints for the DashboardService (/api/dashboard/*)
 */

const { supabase } = require('../config/supabase');

// ─────────────────────────────────────────────
// GET /api/dashboard/workload
// Query params: operatorId (optional)
// Returns: WorkloadStats shape matching frontend interface
// ─────────────────────────────────────────────
exports.getWorkloadStats = async (req, res) => {
  try {
    const { operatorId } = req.query;

    // Total cases
    const { count: totalCases } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true });

    // New cases
    const { count: newCases } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new');

    // Assigned cases (assigned_to_attorney)
    let assignedQuery = supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'assigned_to_attorney');
    if (operatorId) assignedQuery = assignedQuery.eq('assigned_operator_id', operatorId);
    const { count: assignedCases } = await assignedQuery;

    // In-progress (reviewed, waiting_for_driver, send_info_to_attorney)
    const { count: inProgressCases } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .in('status', ['reviewed', 'waiting_for_driver', 'send_info_to_attorney']);

    // Resolved/closed
    const { count: resolvedCases } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'closed');

    // Cases created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { count: todaysCases } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    // Avg resolution time (from closed cases)
    const { data: closedCases } = await supabase
      .from('cases')
      .select('created_at, closed_at')
      .eq('status', 'closed')
      .not('closed_at', 'is', null)
      .limit(100);

    let averageResolutionTime = 0;
    if (closedCases && closedCases.length > 0) {
      const totalDays = closedCases.reduce((sum, c) => {
        return sum + (new Date(c.closed_at) - new Date(c.created_at)) / (1000 * 60 * 60 * 24);
      }, 0);
      averageResolutionTime = Math.round((totalDays / closedCases.length) * 10) / 10;
    }

    res.json({
      totalCases: totalCases || 0,
      newCases: newCases || 0,
      assignedCases: assignedCases || 0,
      inProgressCases: inProgressCases || 0,
      resolvedCases: resolvedCases || 0,
      averageResolutionTime,
      todaysCases: todaysCases || 0,
    });
  } catch (error) {
    console.error('getWorkloadStats error:', error);
    res.status(500).json({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch workload stats' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/queue
// Query params: status, priority, violationType, state, search, page, limit
// Returns: { cases: CaseQueueItem[], total: number }
// ─────────────────────────────────────────────
exports.getCaseQueue = async (req, res) => {
  try {
    const { status, violationType, state, search, limit = '50' } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 50, 200);

    let query = supabase
      .from('cases')
      .select('id, case_number, customer_name, violation_type, violation_date, state, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(lim);

    if (status) query = query.eq('status', status);
    if (violationType) query = query.eq('violation_type', violationType);
    if (state) query = query.eq('state', state);
    if (search) {
      query = query.or(`case_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const now = Date.now();
    const cases = (data || []).map(c => {
      const ageHours = Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60));
      return {
        caseId: c.id,
        driverName: c.customer_name || 'Unknown',
        violationType: c.violation_type || 'other',
        violationDate: c.violation_date || null,
        violationState: c.state || '',
        priority: ageHours > 72 ? 'high' : ageHours > 24 ? 'medium' : 'low',
        status: c.status,
        createdAt: c.created_at,
      };
    });

    res.json({ cases, total: count || 0 });
  } catch (error) {
    console.error('getCaseQueue error:', error);
    res.status(500).json({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch case queue' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/status-distribution
// Proxy to admin chart logic
// ─────────────────────────────────────────────
exports.getStatusDistribution = async (req, res) => {
  try {
    const { data, error } = await supabase.from('cases').select('status');
    if (error) throw error;

    const counts = {};
    (data || []).forEach(c => {
      const s = c.status || 'unknown';
      counts[s] = (counts[s] || 0) + 1;
    });

    res.json({ labels: Object.keys(counts), values: Object.values(counts) });
  } catch (error) {
    console.error('getStatusDistribution error:', error);
    res.status(500).json({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch status distribution' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/violation-distribution
// ─────────────────────────────────────────────
exports.getViolationDistribution = async (req, res) => {
  try {
    const { data, error } = await supabase.from('cases').select('violation_type');
    if (error) throw error;

    const counts = {};
    (data || []).forEach(c => {
      const vt = c.violation_type || 'Unknown';
      counts[vt] = (counts[vt] || 0) + 1;
    });

    res.json({ labels: Object.keys(counts), values: Object.values(counts) });
  } catch (error) {
    console.error('getViolationDistribution error:', error);
    res.status(500).json({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch violation distribution' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/attorney-workload
// ─────────────────────────────────────────────
exports.getAttorneyWorkload = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cases')
      .select('attorney:assigned_attorney_id(full_name)')
      .not('assigned_attorney_id', 'is', null)
      .not('status', 'in', '("closed")');
    if (error) throw error;

    const counts = {};
    (data || []).forEach(c => {
      const name = c.attorney?.full_name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });

    res.json(
      Object.entries(counts).map(([name, cases]) => ({ name, activeCases: cases }))
    );
  } catch (error) {
    console.error('getAttorneyWorkload error:', error);
    res.status(500).json({ error: { code: 'FETCH_FAILED', message: 'Failed to fetch attorney workload' } });
  }
};

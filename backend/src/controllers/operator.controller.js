/**
 * Operator Controller - Case queue management for operators
 */

const { supabase } = require('../config/supabase');

/**
 * GET /api/operator/cases
 * Unassigned or filtered cases for operator queue
 * Query params: status (default: 'new')
 */
exports.getOperatorCases = async (req, res) => {
  try {
    const { status = 'new' } = req.query;

    const { data, error } = await supabase
      .from('cases')
      .select(`
        id, case_number, status, state, violation_type, created_at,
        customer_name, attorney_price,
        driver:driver_id(id, full_name, phone)
      `)
      .eq('status', status)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const now = Date.now();
    const cases = (data || []).map(c => ({
      ...c,
      ageHours: Math.floor((now - new Date(c.created_at).getTime()) / (1000 * 60 * 60))
    }));

    // Summary metrics
    const totalAge = cases.reduce((sum, c) => sum + c.ageHours, 0);
    const avgAge = cases.length ? Math.round(totalAge / cases.length) : 0;

    // Assigned today count
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: assignedToday } = await supabase
      .from('cases')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'assigned_to_attorney')
      .gte('updated_at', startOfDay.toISOString());

    res.json({
      cases,
      summary: {
        newCount: cases.length,
        avgAgeHours: avgAge,
        assignedToday: assignedToday || 0
      }
    });
  } catch (error) {
    console.error('Get operator cases error:', error);
    res.status(500).json({ error: 'Failed to fetch cases' });
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

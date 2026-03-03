const { supabase } = require('../config/supabase');

/**
 * Calculate days between today and target date
 */
const calculateDays = (targetDate) => {
  if (!targetDate) return null;
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * GET /api/drivers/:id/dashboard
 * Driver dashboard - shows all tickets with real-time status
 * Persona: Miguel Rodriguez (owner-operator driver)
 * Pain: "I don't know if my attorney is working on my ticket"
 * Solution: Color-coded dashboard with plain English status
 */
exports.getDriverDashboard = async (req, res) => {
  try {
    const driverId = req.params.id;

    // Get all tickets for driver with related attorney and violations
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        attorney:attorneys(id, first_name, last_name, phone, email),
        violations(id, violation_type, description, points)
      `)
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate status color (green/amber/red) for each ticket
    const ticketsWithStatus = (tickets || []).map(ticket => {
      const daysUntilCourt = calculateDays(ticket.court_date);
      let statusColor = 'green';
      let statusText = 'All good';

      if (ticket.status === 'resolved') {
        statusColor = 'green';
        statusText = 'Resolved';
      } else if (daysUntilCourt !== null && daysUntilCourt <= 7) {
        statusColor = 'red';
        statusText = `Court in ${daysUntilCourt} days - Urgent!`;
      } else if (daysUntilCourt !== null && daysUntilCourt <= 14) {
        statusColor = 'amber';
        statusText = `Court date coming up`;
      } else {
        statusColor = 'green';
        statusText = ticket.attorney ? 'Attorney working on it' : 'Pending assignment';
      }

      return {
        ...ticket,
        statusColor,
        statusText,
        daysUntilCourt
      };
    });

    // Separate active vs resolved tickets
    const activeTickets = ticketsWithStatus.filter(t => t.status !== 'resolved');
    const resolvedTickets = ticketsWithStatus.filter(t => t.status === 'resolved');

    // Upcoming court dates (sorted by date)
    const upcomingCourts = activeTickets
      .filter(t => t.court_date)
      .sort((a, b) => new Date(a.court_date) - new Date(b.court_date));

    // Response payload
    res.json({
      summary: {
        active: activeTickets.length,
        resolved: resolvedTickets.length,
        upcomingCourts: upcomingCourts.length
      },
      activeTickets,
      resolvedTickets: resolvedTickets.slice(0, 5), // Last 5 resolved
      upcomingCourts
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard',
      message: error.message
    });
  }
};

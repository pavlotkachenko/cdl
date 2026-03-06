'use strict';

const pool = require('../config/database');

const OPEN_STATUSES = `('active','assigned','in_progress','pending_court','pending_client')`;
const RESOLVED_STATUSES = `('resolved','closed','won')`;

/**
 * GET /api/drivers/me/analytics
 * Returns personal analytics for the authenticated driver.
 */
const getDriverAnalytics = async (req, res) => {
  const driverId = req.user?.id;
  if (!driverId) {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
  }

  try {
    const [monthlyResult, violationResult, statsResult] = await Promise.all([
      pool.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
                COUNT(*) AS count
         FROM cases
         WHERE driver_id = $1
           AND created_at > NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at)`,
        [driverId],
      ),
      pool.query(
        `SELECT violation_type AS type, COUNT(*) AS count
         FROM cases
         WHERE driver_id = $1
         GROUP BY violation_type
         ORDER BY count DESC
         LIMIT 5`,
        [driverId],
      ),
      pool.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status IN ${OPEN_STATUSES})    AS open_cases,
           COUNT(*) FILTER (WHERE status IN ${RESOLVED_STATUSES}) AS resolved_cases
         FROM cases
         WHERE driver_id = $1`,
        [driverId],
      ),
    ]);

    const stats       = statsResult.rows[0] || {};
    const total       = parseInt(stats.total)          || 0;
    const openCases   = parseInt(stats.open_cases)     || 0;
    const resolvedCases = parseInt(stats.resolved_cases) || 0;
    const successRate = total > 0 ? Math.round((resolvedCases / total) * 100) : 0;

    const totalViolations = violationResult.rows.reduce((s, r) => s + parseInt(r.count), 0);
    const violationBreakdown = violationResult.rows.map(r => ({
      type:  r.type || 'Unknown',
      count: parseInt(r.count),
      pct:   totalViolations > 0 ? Math.round((parseInt(r.count) / totalViolations) * 100) : 0,
    }));

    res.json({
      totalCases: total,
      openCases,
      resolvedCases,
      successRate,
      casesByMonth:       monthlyResult.rows.map(r => ({ month: r.month, count: parseInt(r.count) })),
      violationBreakdown,
    });
  } catch {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to load analytics' } });
  }
};

module.exports = { getDriverAnalytics };

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { sendRegistrationEmail } = require('../services/email.service');

const validateCarrierRegistration = (data) => {
  const errors = [];

  // company_name validation
  if (!data.company_name || data.company_name.trim().length < 2) {
    errors.push('Company name must be at least 2 characters');
  }

  // phone_number validation
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  if (!data.phone_number || !phoneRegex.test(data.phone_number)) {
    errors.push('Valid phone number is required');
  }

  // usdot_number validation
  const usdotRegex = /^\d{6,8}$/;
  if (!data.usdot_number || !usdotRegex.test(data.usdot_number)) {
    errors.push('USDOT number must be 6-8 digits');
  }

  // carrier_size validation
  const validSizes = ['small', 'medium', 'large'];
  if (!data.carrier_size || !validSizes.includes(data.carrier_size)) {
    errors.push('Carrier size must be one of: small, medium, large');
  }

  // email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push('Valid email is required');
  }

  // password validation
  if (!data.password || data.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  return errors;
};

const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const { company_name, phone_number, usdot_number, carrier_size, email, password } = req.body;

    // Validate input
    const validationErrors = validateCarrierRegistration(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }

    // Check if email already exists
    const emailCheck = await client.query(
      'SELECT id FROM carriers WHERE email = $1',
      [email.toLowerCase()]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ errors: ['Email already registered'] });
    }

    // Check if USDOT already exists
    const usdotCheck = await client.query(
      'SELECT id FROM carriers WHERE usdot_number = $1',
      [usdot_number]
    );

    if (usdotCheck.rows.length > 0) {
      return res.status(400).json({ errors: ['USDOT number already registered'] });
    }

    // Start transaction
    await client.query('BEGIN');

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user in users table.
    // DB enum user_role uses 'driver' for carrier accounts; real role is
    // returned in the API response as 'carrier' (matches user_metadata).
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, role`,
      [email.toLowerCase(), password_hash, 'driver']
    );

    const user = userResult.rows[0];

    // Create carrier in carriers table
    const carrierResult = await client.query(
      `INSERT INTO carriers (company_name, phone_number, usdot_number, carrier_size, email, password_hash, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id`,
      [company_name, phone_number, usdot_number, carrier_size, email.toLowerCase(), password_hash, user.id]
    );

    // Commit transaction
    await client.query('COMMIT');

    // Generate JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        carrierId: carrierResult.rows[0].id
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Send welcome email (non-blocking)
    sendRegistrationEmail({ name: company_name, email: email.toLowerCase(), role: 'carrier' });

    // Return response — expose 'carrier' as the role (not the DB-mapped 'driver')
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: 'carrier'
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Carrier registration error:', error);
    res.status(500).json({ errors: ['Registration failed. Please try again.'] });
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────
// GET /api/carriers/me
// ─────────────────────────────────────────────
const getProfile = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Carrier ID missing from token' } });

  try {
    const result = await pool.query(
      'SELECT company_name, usdot_number, email, phone_number, notify_on_new_ticket FROM carriers WHERE id = $1',
      [carrierId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Carrier not found' } });
    res.json({ carrier: result.rows[0] });
  } catch (err) {
    console.error('getProfile error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch profile' } });
  }
};

// ─────────────────────────────────────────────
// PUT /api/carriers/me
// ─────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Carrier ID missing from token' } });

  const { company_name, phone_number, notify_on_new_ticket } = req.body;
  if (!company_name || company_name.trim().length < 2) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Company name is required' } });
  }

  try {
    const result = await pool.query(
      `UPDATE carriers SET company_name = $1, phone_number = $2, notify_on_new_ticket = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING company_name, usdot_number, email, phone_number, notify_on_new_ticket`,
      [company_name.trim(), phone_number ?? '', notify_on_new_ticket ?? false, carrierId]
    );
    res.json({ carrier: result.rows[0] });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update profile' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/carriers/me/stats
// ─────────────────────────────────────────────
const getStats = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Carrier ID missing from token' } });

  const ACTIVE = "('assigned_to_attorney','send_info_to_attorney','call_court','check_with_manager')";
  const PENDING = "('new','reviewed','waiting_for_driver','pay_attorney')";

  try {
    const [driversResult, casesResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM drivers WHERE carrier_id = $1', [carrierId]),
      pool.query(
        `SELECT
           SUM(CASE WHEN status IN ${ACTIVE} THEN 1 ELSE 0 END) AS active_cases,
           SUM(CASE WHEN status IN ${PENDING} THEN 1 ELSE 0 END) AS pending_cases,
           SUM(CASE WHEN status IN ('closed','resolved') THEN 1 ELSE 0 END) AS resolved_cases
         FROM cases WHERE carrier_id = $1`,
        [carrierId]
      ),
    ]);

    const row = casesResult.rows[0];
    res.json({
      totalDrivers: parseInt(driversResult.rows[0].count, 10),
      activeCases: parseInt(row.active_cases ?? 0, 10),
      pendingCases: parseInt(row.pending_cases ?? 0, 10),
      resolvedCases: parseInt(row.resolved_cases ?? 0, 10),
    });
  } catch (err) {
    console.error('getStats error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch stats' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/carriers/me/drivers
// ─────────────────────────────────────────────
const getDrivers = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Carrier ID missing from token' } });

  const OPEN_STATUSES = "('new','reviewed','waiting_for_driver','pay_attorney','assigned_to_attorney','send_info_to_attorney','call_court','check_with_manager')";

  try {
    const result = await pool.query(
      `SELECT d.id, d.full_name, d.cdl_number,
              COUNT(c.id) FILTER (WHERE c.status IN ${OPEN_STATUSES}) AS "openCases"
       FROM drivers d
       LEFT JOIN cases c ON c.driver_id = d.id
       WHERE d.carrier_id = $1
       GROUP BY d.id
       ORDER BY d.full_name`,
      [carrierId]
    );
    const drivers = result.rows.map(r => ({ ...r, openCases: parseInt(r.openCases, 10) }));
    res.json({ drivers });
  } catch (err) {
    console.error('getDrivers error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch drivers' } });
  }
};

// ─────────────────────────────────────────────
// POST /api/carriers/me/drivers
// ─────────────────────────────────────────────
const addDriver = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Carrier ID missing from token' } });

  const { full_name, cdl_number } = req.body;
  if (!full_name || !cdl_number) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'full_name and cdl_number are required' } });
  }

  try {
    const result = await pool.query(
      `INSERT INTO drivers (full_name, cdl_number, carrier_id, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, full_name, cdl_number`,
      [full_name.trim(), cdl_number.trim(), carrierId]
    );
    res.status(201).json({ driver: { ...result.rows[0], openCases: 0 } });
  } catch (err) {
    console.error('addDriver error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: { code: 'DUPLICATE', message: 'CDL number already registered' } });
    }
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to add driver' } });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/carriers/me/drivers/:driverId
// ─────────────────────────────────────────────
const removeDriver = async (req, res) => {
  const carrierId = req.user?.carrierId;
  const { driverId } = req.params;
  if (!carrierId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Carrier ID missing from token' } });

  try {
    const result = await pool.query(
      'DELETE FROM drivers WHERE id = $1 AND carrier_id = $2 RETURNING id',
      [driverId, carrierId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Driver not found' } });
    }
    res.json({ message: 'Driver removed' });
  } catch (err) {
    console.error('removeDriver error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to remove driver' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/carriers/me/cases
// ─────────────────────────────────────────────
const getCases = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Carrier ID missing from token' } });

  const { status } = req.query;
  const params = [carrierId];
  let statusClause = '';
  if (status && status !== 'all') {
    params.push(status);
    statusClause = 'AND c.status = $2';
  }

  try {
    const result = await pool.query(
      `SELECT c.id, c.case_number, c.violation_type, c.state, c.status,
              d.full_name AS driver_name,
              COALESCE(u.name, '') AS attorney_name
       FROM cases c
       JOIN drivers d ON d.id = c.driver_id
       LEFT JOIN attorneys a ON a.id = c.attorney_id
       LEFT JOIN users u ON u.id = a.user_id
       WHERE c.carrier_id = $1 ${statusClause}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json({ cases: result.rows });
  } catch (err) {
    console.error('getCases error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch cases' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/carriers/me/analytics
// ─────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Carrier ID missing from token' } });

  const OPEN_STATUSES = "('new','reviewed','waiting_for_driver','pay_attorney','assigned_to_attorney','send_info_to_attorney','call_court','check_with_manager')";
  const RESOLVED_STATUSES = "('closed','resolved')";

  try {
    const [monthlyResult, violationResult, resolutionResult, atRiskResult] = await Promise.all([
      pool.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
                DATE_TRUNC('month', created_at) AS month_date,
                COUNT(*) AS count
         FROM cases WHERE carrier_id = $1
           AND created_at >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY DATE_TRUNC('month', created_at)`,
        [carrierId]
      ),
      pool.query(
        `SELECT COALESCE(violation_type, 'Other') AS type, COUNT(*) AS count
         FROM cases WHERE carrier_id = $1
         GROUP BY violation_type
         ORDER BY count DESC
         LIMIT 6`,
        [carrierId]
      ),
      pool.query(
        `SELECT COUNT(*) AS total_resolved,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) AS won,
                COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400), 0) AS avg_days
         FROM cases WHERE carrier_id = $1 AND status IN ${RESOLVED_STATUSES}`,
        [carrierId]
      ),
      pool.query(
        `SELECT d.id, d.full_name AS name, COUNT(c.id) AS open_cases
         FROM drivers d
         JOIN cases c ON c.driver_id = d.id
         WHERE d.carrier_id = $1 AND c.status IN ${OPEN_STATUSES}
         GROUP BY d.id, d.full_name
         ORDER BY open_cases DESC
         LIMIT 3`,
        [carrierId]
      ),
    ]);

    const totalResolved = parseInt(resolutionResult.rows[0]?.total_resolved ?? 0, 10);
    const won = parseInt(resolutionResult.rows[0]?.won ?? 0, 10);
    const avgDays = parseFloat(resolutionResult.rows[0]?.avg_days ?? 0);

    const violations = violationResult.rows.map(r => ({ type: r.type, count: parseInt(r.count, 10) }));
    const totalViolations = violations.reduce((sum, v) => sum + v.count, 0);
    const violationBreakdown = violations.map(v => ({
      type: v.type,
      count: v.count,
      pct: totalViolations > 0 ? Math.round((v.count / totalViolations) * 100) : 0,
    }));

    const atRiskDrivers = atRiskResult.rows.map(r => {
      const openCases = parseInt(r.open_cases, 10);
      return {
        id: r.id,
        name: r.name,
        openCases,
        riskLevel: openCases >= 5 ? 'red' : openCases >= 2 ? 'yellow' : 'green',
      };
    });

    res.json({
      casesByMonth: monthlyResult.rows.map(r => ({ month: r.month, count: parseInt(r.count, 10) })),
      violationBreakdown,
      successRate: totalResolved > 0 ? Math.round((won / totalResolved) * 100) : 0,
      avgResolutionDays: Math.round(avgDays),
      atRiskDrivers,
      estimatedSavings: totalResolved * 300,
      totalCases: totalViolations,
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch analytics' } });
  }
};

// ─────────────────────────────────────────────
// GET /api/carriers/me/export
// ─────────────────────────────────────────────
const exportCases = async (req, res) => {
  const carrierId = req.user?.carrierId;
  if (!carrierId) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Carrier ID missing from token' } });

  try {
    const result = await pool.query(
      `SELECT c.case_number, d.full_name AS driver_name, c.violation_type, c.state, c.status,
              TO_CHAR(c.created_at, 'YYYY-MM-DD') AS date
       FROM cases c
       JOIN drivers d ON d.id = c.driver_id
       WHERE c.carrier_id = $1
       ORDER BY c.created_at DESC`,
      [carrierId]
    );

    const headers = 'Case #,Driver,Violation,State,Status,Date\n';
    const rows = result.rows.map(r =>
      [r.case_number, r.driver_name, r.violation_type ?? '', r.state ?? '', r.status, r.date]
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fleet-report.csv"');
    res.send(headers + rows);
  } catch (err) {
    console.error('exportCases error:', err);
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to export cases' } });
  }
};

module.exports = {
  register,
  getProfile,
  updateProfile,
  getStats,
  getDrivers,
  addDriver,
  removeDriver,
  getCases,
  getAnalytics,
  exportCases,
};

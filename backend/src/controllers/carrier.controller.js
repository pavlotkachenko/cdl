const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

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

    // Create user in users table
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, role`,
      [email.toLowerCase(), password_hash, 'carrier']
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

    // Return response
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
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

module.exports = {
  register
};

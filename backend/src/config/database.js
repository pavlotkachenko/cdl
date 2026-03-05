/**
 * Database Configuration
 * Location: backend/src/config/database.js
 *
 * Exports:
 *   - default (pool): node-postgres Pool for raw SQL queries
 *   - supabase: Supabase admin client (re-export from supabase.js)
 */

const { Pool } = require('pg');
const { supabase, supabaseAnon, supabaseAdmin } = require('./supabase');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected pg pool error:', err.message);
});

module.exports = pool;
module.exports.supabase = supabase;
module.exports.supabaseAnon = supabaseAnon;
module.exports.supabaseAdmin = supabaseAdmin;

// ============================================
// Supabase Client Configuration
// ============================================
// This connects your backend to Supabase database
// Think of it as your phone line to the database

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if credentials exist
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials! Check your .env file');
}

// Create client for regular operations (limited permissions)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client for admin operations (full permissions)
// Use this carefully! It bypasses Row Level Security
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Helper function to handle Supabase errors
 * Makes error messages easier to understand
 */
function handleSupabaseError(error) {
  console.error('Supabase Error:', error);
  
  // Common error messages in plain English
  const errorMessages = {
    '23505': 'This record already exists (duplicate)',
    '23503': 'Cannot delete - other records depend on this',
    '42501': 'Permission denied',
    'PGRST116': 'Record not found',
  };
  
  const message = errorMessages[error.code] || error.message || 'Database error';
  
  return {
    message,
    code: error.code,
    details: error.details
  };
}

/**
 * Execute a query with automatic error handling
 */
async function executeQuery(queryBuilder) {
  const { data, error } = await queryBuilder;
  
  if (error) {
    throw handleSupabaseError(error);
  }
  
  return data;
}

module.exports = {
  supabase,
  supabaseAdmin,
  handleSupabaseError,
  executeQuery
};

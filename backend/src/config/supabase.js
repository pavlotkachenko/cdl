// ============================================
// SUPABASE CLIENT CONFIGURATION
// Initialize Supabase client for database operations
// ============================================

const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error('Missing environment variable: SUPABASE_URL');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: SUPABASE_ANON_KEY');
}

// Create anon client (subject to RLS — use for user-scoped operations)
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'cdl-ticket-management-backend'
      }
    }
  }
);

// Create admin client (bypasses RLS — use for backend operations)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = serviceRoleKey
  ? createClient(process.env.SUPABASE_URL, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'cdl-ticket-management-backend'
        }
      }
    })
  : null;

// Default client: prefer service role for backend, fall back to anon
const supabase = supabaseAdmin || supabaseAnon;

// Helper to execute a query with error handling
const executeQuery = async (queryFn) => {
  const { data, error } = await queryFn();
  if (error) throw error;
  return data;
};

// Test connection using service role client to avoid RLS issues
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connected successfully');
    if (!supabaseAdmin) {
      console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not set — using anon key (RLS enforced)');
    }
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

// Run connection test on startup
if (process.env.NODE_ENV !== 'test') {
  testConnection();
}

module.exports = {
  supabase,
  supabaseAnon,
  supabaseAdmin,
  executeQuery,
  testConnection
};

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

// Create Supabase client
const supabase = createClient(
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

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
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
  testConnection
};

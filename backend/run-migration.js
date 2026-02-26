const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  );

  const migrationFile = path.join(__dirname, 'src/migrations/011_payments.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('Running payment migration...');

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('Attempting direct migration execution...');
      
      // Split by statement and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        const { error: stmtError } = await supabase.rpc('exec', { query: statement });
        if (stmtError) {
          console.error('Migration statement error:', stmtError);
        }
      }
      
      console.log('✅ Migration completed (check for errors above)');
    } else {
      console.log('✅ Migration completed successfully');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n⚠️  You may need to run the migration manually via Supabase Dashboard');
    console.log('Migration file location:', migrationFile);
    process.exit(1);
  }
}

runMigration();

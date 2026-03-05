# Skill: Database Migration

Safe database schema change workflow. This replaces the CrewAI Database Engineer agent's migration task.

## Trigger

Use when:
- Adding new tables to the database
- Modifying existing table columns
- Adding or changing RLS policies
- Creating new indexes
- Modifying enums (adding new values)

## Pipeline Steps

### Step 1: Impact Analysis

Before making any database changes:

1. Read the current schema: `supabase_schema.sql`
2. Read all existing migrations: `backend/src/migrations/`
3. Identify what tables, columns, indexes, and policies are affected
4. Check if any existing data would be impacted (data loss risk)

**Decision point:** If the migration could cause data loss, STOP and get human approval (Gate 4).

### Step 2: Write Migration

Create a new migration file:

```javascript
// backend/src/migrations/YYYYMMDDHHMMSS-description.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Forward migration — apply changes
    await queryInterface.sequelize.query(`
      -- SQL to apply the change
      CREATE TABLE IF NOT EXISTS new_table (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        -- ... columns
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Always enable RLS
      ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

      -- Always add policies
      CREATE POLICY "policy_name" ON new_table
        FOR SELECT USING (/* condition */);

      -- Always add indexes on foreign keys
      CREATE INDEX idx_new_table_foreign_key ON new_table(foreign_key_column);
    `);
  },

  async down(queryInterface, Sequelize) {
    // Reverse migration — undo changes
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS new_table CASCADE;
    `);
  }
};
```

### Step 3: Supabase Migration (if applicable)

If using Supabase CLI:

```bash
# Create migration file
npx supabase migration new description-of-change

# This creates: supabase/migrations/YYYYMMDDHHMMSS_description-of-change.sql
# Edit the SQL file with the schema changes
```

### Step 4: Verify Migration

```bash
# Run the migration
cd backend && node run-migration.js

# Verify the schema
npx supabase db diff

# Check RLS is enabled
# Query: SELECT tablename FROM pg_tables WHERE schemaname = 'public';
# For each table, verify RLS: SELECT relrowsecurity FROM pg_class WHERE relname = 'table_name';
```

### Step 5: Update Schema Reference

After migration succeeds, update `supabase_schema.sql` at the project root to reflect the new state. This file is the canonical schema reference.

### Step 6: Write RLS Tests

Add tests in `backend/src/__tests__/` that verify:
- The new table's RLS policies work correctly
- Drivers can only access their own rows
- Admins can access all rows
- Cross-role access is properly blocked

## Rules

- NEVER modify an existing migration file — always create a new one
- ALWAYS include both `up()` and `down()` functions
- ALWAYS enable RLS on new tables
- ALWAYS add policies before the migration is considered complete
- ALWAYS add indexes on foreign key columns
- ALWAYS use `IF NOT EXISTS` / `IF EXISTS` guards for idempotency
- NEVER use `DROP TABLE` or `ALTER TABLE DROP COLUMN` without human approval
- Use snake_case for all database identifiers
- Timestamps MUST be `TIMESTAMP WITH TIME ZONE`
- Primary keys MUST be `UUID DEFAULT gen_random_uuid()`

## Destructive Change Protocol

If the migration involves any of these, **STOP and get human approval**:
- `DROP TABLE`
- `DROP COLUMN`
- `ALTER TYPE` (enum changes can break existing data)
- `DELETE FROM` (data removal)
- `TRUNCATE`
- Modifying existing RLS policies (could open security holes)

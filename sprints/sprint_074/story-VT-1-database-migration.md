# Story: VT-1 — Database Migration 028: Violation Type Expansion

**Sprint:** sprint_074
**Priority:** P0
**Status:** TODO

## User Story

As a platform developer,
I want the database schema expanded with new violation types, a JSONB column for type-specific data, and severity/regulation columns,
So that the system can capture and store detailed violation information for all CDL ticket types.

## Scope

### Files to Create
- `backend/src/migrations/028_violation_type_expansion.sql`

### Files to Modify
- `supabase_schema.sql` (reference update — add new columns/types to documentation)

### Database Changes

#### New Enum Values (violation_type)
```sql
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'overweight_oversize';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'equipment_defect';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'hazmat';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'railroad_crossing';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'seatbelt_cell_phone';
```

#### New Columns (cases table)
```sql
ALTER TABLE cases ADD COLUMN IF NOT EXISTS type_specific_data JSONB DEFAULT '{}';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS violation_regulation_code VARCHAR(50);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS violation_severity VARCHAR(20)
  CHECK (violation_severity IN ('critical', 'serious', 'standard', 'minor'));
```

#### Index
```sql
CREATE INDEX IF NOT EXISTS idx_cases_violation_severity ON cases(violation_severity);
CREATE INDEX IF NOT EXISTS idx_cases_type_specific_data ON cases USING GIN(type_specific_data);
```

## Acceptance Criteria

- [ ] Migration file `028_violation_type_expansion.sql` created in `backend/src/migrations/`
- [ ] 5 new enum values added via `ALTER TYPE ... ADD VALUE IF NOT EXISTS`
- [ ] `type_specific_data` JSONB column added with default `'{}'`
- [ ] `violation_regulation_code` VARCHAR(50) column added (nullable)
- [ ] `violation_severity` VARCHAR(20) column added with CHECK constraint for 4 valid values
- [ ] GIN index on `type_specific_data` for JSONB queries
- [ ] B-tree index on `violation_severity` for filtering
- [ ] `supabase_schema.sql` updated to reflect new columns and enum values
- [ ] Migration is idempotent (safe to run multiple times via `IF NOT EXISTS`)
- [ ] Existing rows unaffected (all new columns nullable or have defaults)
- [ ] No RLS policy changes needed (new columns inherit existing row policies)

## Test Coverage Matrix

| Source File | Test File | Status |
|-------------|-----------|--------|
| `028_violation_type_expansion.sql` | `backend/src/__tests__/violation-types.test.js` | VT-8 |

## Dependencies

- Depends on: None
- Blocked by: None
- Blocks: VT-2, VT-3, VT-4

## Notes

- PostgreSQL enum values cannot be removed, only added — legacy types (`parking`, `traffic_signal`) remain in DB but hidden at UI layer
- The `alleged_speed` column remains as a dedicated column for backward compatibility; speeding violations store speed data in BOTH `alleged_speed` and `type_specific_data.alleged_speed`
- JSONB GIN index enables efficient queries like `WHERE type_specific_data @> '{"hazmat_class": "3"}'`
- No data backfill needed — existing cases simply have empty `type_specific_data`

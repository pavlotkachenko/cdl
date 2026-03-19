# Story ST-1: DB Migration — Violation Type Enum + New Case Columns

## Status: DONE

## Description
Extend the `violation_type` enum with CDL-specific values and add new columns to the `cases` table to support the redesigned submit ticket form.

## Schema Changes

### Migration: `025_submit_ticket_redesign.sql`

```sql
-- 1. Add new CDL-specific violation types to enum
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'hos_logbook';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'dot_inspection';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'suspension';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'csa_score';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'dqf';

-- 2. Add new columns to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS citation_number VARCHAR(50);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS fine_amount DECIMAL(10,2);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS alleged_speed INTEGER;

-- 3. Index on citation_number for lookup
CREATE INDEX IF NOT EXISTS idx_cases_citation_number ON cases(citation_number);
```

### Updated Violation Type Enum Values
| Value | UI Label | Notes |
|-------|----------|-------|
| `speeding` | Speeding | Existing — kept |
| `hos_logbook` | HOS / Logbook | NEW |
| `dot_inspection` | DOT Inspection | NEW |
| `suspension` | Suspension | NEW |
| `csa_score` | CSA Score | NEW |
| `dqf` | DQF | NEW |
| `other` | Other | Existing — kept |
| `parking` | (hidden) | Existing — kept for backward compat |
| `traffic_signal` | (hidden) | Existing — kept for backward compat |
| `reckless_driving` | (hidden) | Existing — kept for backward compat |
| `dui` | (hidden) | Existing — kept for backward compat |

### New Columns
| Column | Type | Nullable | Purpose |
|--------|------|----------|---------|
| `citation_number` | VARCHAR(50) | YES | Ticket citation number from form |
| `fine_amount` | DECIMAL(10,2) | YES | Fine amount listed on ticket |
| `alleged_speed` | INTEGER | YES | Alleged speed (speeding violations) |

## Acceptance Criteria
- [ ] Migration file created at `backend/src/migrations/025_submit_ticket_redesign.sql`
- [ ] New enum values added without breaking existing rows
- [ ] Existing cases with old violation types still query correctly
- [ ] New columns are nullable (no existing row breakage)
- [ ] Index on citation_number created

## Files to Create
- `backend/src/migrations/025_submit_ticket_redesign.sql`

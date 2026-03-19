-- Migration 025: Submit Ticket Redesign
-- Sprint 060 / Story ST-1
-- Adds CDL-specific violation types and new case columns for redesigned submit form

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

-- 3. Add check constraint for fine_amount (must be non-negative)
ALTER TABLE cases ADD CONSTRAINT chk_fine_amount_non_negative CHECK (fine_amount IS NULL OR fine_amount >= 0);

-- 4. Add check constraint for alleged_speed (reasonable range)
ALTER TABLE cases ADD CONSTRAINT chk_alleged_speed_range CHECK (alleged_speed IS NULL OR (alleged_speed >= 1 AND alleged_speed <= 300));

-- 5. Index on citation_number for lookup
CREATE INDEX IF NOT EXISTS idx_cases_citation_number ON cases(citation_number);

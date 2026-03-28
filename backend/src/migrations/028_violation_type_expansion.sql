-- Migration 028: Violation Type Expansion
-- Sprint 074 / Story VT-1
-- Adds new CDL-specific violation types, JSONB column for type-specific data,
-- violation severity classification, and regulation code reference.

-- 1. Add new violation types to enum
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'overweight_oversize';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'equipment_defect';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'hazmat';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'railroad_crossing';
ALTER TYPE violation_type ADD VALUE IF NOT EXISTS 'seatbelt_cell_phone';

-- 2. Add JSONB column for type-specific violation data
-- Each violation type stores its conditional fields here (e.g., BAC level for DUI,
-- inspection level for DOT, weight data for overweight). Validated at application layer.
ALTER TABLE cases ADD COLUMN IF NOT EXISTS type_specific_data JSONB DEFAULT '{}';

-- 3. Add regulation code reference (e.g., "395.3(a)(1)" for HOS violations)
ALTER TABLE cases ADD COLUMN IF NOT EXISTS violation_regulation_code VARCHAR(50);

-- 4. Add severity classification
ALTER TABLE cases ADD COLUMN IF NOT EXISTS violation_severity VARCHAR(20);

-- Add CHECK constraint for severity values (separate statement for IF NOT EXISTS compat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_violation_severity'
  ) THEN
    ALTER TABLE cases ADD CONSTRAINT chk_violation_severity
      CHECK (violation_severity IS NULL OR violation_severity IN ('critical', 'serious', 'standard', 'minor'));
  END IF;
END $$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_cases_violation_severity ON cases(violation_severity);
CREATE INDEX IF NOT EXISTS idx_cases_type_specific_data ON cases USING GIN(type_specific_data);

-- Migration 008: Attorney Profile Enhancements
-- Adds specializations, state licenses, success rate, and availability status to users table

-- Add attorney profile fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS state_licenses TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS success_rate DECIMAL(5,4) DEFAULT 0.0000,
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS current_cases_count INTEGER DEFAULT 0;

-- Add check constraint for availability_status
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_availability_status_check;

ALTER TABLE users
ADD CONSTRAINT users_availability_status_check 
CHECK (availability_status IN ('available', 'limited', 'busy', 'unavailable'));

-- Add check constraint for success_rate (0.0 to 1.0)
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_success_rate_check;

ALTER TABLE users
ADD CONSTRAINT users_success_rate_check 
CHECK (success_rate >= 0.0 AND success_rate <= 1.0);

-- Create case_assignments table for tracking assignment history
CREATE TABLE IF NOT EXISTS case_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    attorney_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    assignment_method VARCHAR(20) NOT NULL DEFAULT 'manual',
    assignment_score DECIMAL(5,2),
    score_breakdown JSONB,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP WITH TIME ZONE,
    unassignment_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for case_assignments
CREATE INDEX IF NOT EXISTS idx_case_assignments_case_id ON case_assignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_attorney_id ON case_assignments(attorney_id);
CREATE INDEX IF NOT EXISTS idx_case_assignments_assigned_at ON case_assignments(assigned_at DESC);

-- Add check constraint for assignment_method
ALTER TABLE case_assignments
DROP CONSTRAINT IF EXISTS case_assignments_method_check;

ALTER TABLE case_assignments
ADD CONSTRAINT case_assignments_method_check 
CHECK (assignment_method IN ('auto', 'manual', 'reassignment'));

-- Create function to increment attorney case count
CREATE OR REPLACE FUNCTION increment_attorney_cases(attorney_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET current_cases_count = COALESCE(current_cases_count, 0) + 1
    WHERE user_id = attorney_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to decrement attorney case count
CREATE OR REPLACE FUNCTION decrement_attorney_cases(attorney_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users
    SET current_cases_count = GREATEST(COALESCE(current_cases_count, 0) - 1, 0)
    WHERE user_id = attorney_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update attorney case count on case status change
CREATE OR REPLACE FUNCTION update_attorney_case_count()
RETURNS TRIGGER AS $$
BEGIN
    -- When case is closed, decrement count
    IF NEW.status IN ('closed', 'withdrawn', 'dismissed') AND 
       OLD.status NOT IN ('closed', 'withdrawn', 'dismissed') AND
       NEW.assigned_attorney_id IS NOT NULL THEN
        PERFORM decrement_attorney_cases(NEW.assigned_attorney_id);
    END IF;
    
    -- When attorney is assigned, increment count
    IF NEW.assigned_attorney_id IS NOT NULL AND 
       (OLD.assigned_attorney_id IS NULL OR OLD.assigned_attorney_id != NEW.assigned_attorney_id) AND
       NEW.status NOT IN ('closed', 'withdrawn', 'dismissed') THEN
        PERFORM increment_attorney_cases(NEW.assigned_attorney_id);
        
        -- Decrement for old attorney if reassignment
        IF OLD.assigned_attorney_id IS NOT NULL AND OLD.assigned_attorney_id != NEW.assigned_attorney_id THEN
            PERFORM decrement_attorney_cases(OLD.assigned_attorney_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_attorney_case_count ON cases;

CREATE TRIGGER trigger_update_attorney_case_count
AFTER UPDATE ON cases
FOR EACH ROW
WHEN (OLD.assigned_attorney_id IS DISTINCT FROM NEW.assigned_attorney_id OR OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_attorney_case_count();

-- Add comments
COMMENT ON COLUMN users.specializations IS 'Array of specialization areas (e.g., ["CDL Violations", "Traffic", "DUI"])';
COMMENT ON COLUMN users.state_licenses IS 'Array of state bar licenses (e.g., ["CA", "NY", "TX"])';
COMMENT ON COLUMN users.success_rate IS 'Success rate as decimal (0.0 to 1.0)';
COMMENT ON COLUMN users.availability_status IS 'Attorney availability status';
COMMENT ON COLUMN users.current_cases_count IS 'Current number of active cases assigned to attorney';

COMMENT ON TABLE case_assignments IS 'Tracks case assignment history with scoring data';

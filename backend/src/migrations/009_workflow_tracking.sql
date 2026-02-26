-- Migration 009: Workflow and SLA Tracking
-- Adds case status history and SLA tracking tables

-- Create case_status_history table
CREATE TABLE IF NOT EXISTS case_status_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    previous_status VARCHAR(50),
    changed_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for case_status_history
CREATE INDEX IF NOT EXISTS idx_case_status_history_case_id ON case_status_history(case_id);
CREATE INDEX IF NOT EXISTS idx_case_status_history_changed_at ON case_status_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_status_history_status ON case_status_history(status);

-- Create case_sla_tracking table
CREATE TABLE IF NOT EXISTS case_sla_tracking (
    sla_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(case_id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    status_changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sla_threshold_hours INTEGER NOT NULL,
    hours_in_status DECIMAL(10,2),
    remaining_hours DECIMAL(10,2),
    is_breached BOOLEAN DEFAULT false,
    is_at_risk BOOLEAN DEFAULT false,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(case_id, status)
);

-- Add indexes for case_sla_tracking
CREATE INDEX IF NOT EXISTS idx_case_sla_tracking_case_id ON case_sla_tracking(case_id);
CREATE INDEX IF NOT EXISTS idx_case_sla_tracking_is_breached ON case_sla_tracking(is_breached);
CREATE INDEX IF NOT EXISTS idx_case_sla_tracking_is_at_risk ON case_sla_tracking(is_at_risk);
CREATE INDEX IF NOT EXISTS idx_case_sla_tracking_status ON case_sla_tracking(status);

-- Add escalation fields to cases table
ALTER TABLE cases
ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE;

-- Create trigger to log status changes
CREATE OR REPLACE FUNCTION log_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO case_status_history (case_id, status, previous_status, changed_at)
        VALUES (NEW.case_id, NEW.status, OLD.status, CURRENT_TIMESTAMP);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_case_status_change ON cases;

CREATE TRIGGER trigger_log_case_status_change
AFTER UPDATE ON cases
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_case_status_change();

-- Create function to check SLA and send alerts
CREATE OR REPLACE FUNCTION check_case_sla(p_case_id UUID, p_status VARCHAR)
RETURNS TABLE (
    is_breached BOOLEAN,
    is_at_risk BOOLEAN,
    hours_in_status DECIMAL,
    remaining_hours DECIMAL
) AS $$
DECLARE
    v_status_changed_at TIMESTAMP WITH TIME ZONE;
    v_sla_threshold INTEGER;
    v_hours_in_status DECIMAL;
    v_remaining_hours DECIMAL;
    v_is_breached BOOLEAN;
    v_is_at_risk BOOLEAN;
BEGIN
    -- Get when status changed
    SELECT changed_at INTO v_status_changed_at
    FROM case_status_history
    WHERE case_id = p_case_id AND status = p_status
    ORDER BY changed_at DESC
    LIMIT 1;
    
    -- Default to current time if no history found
    v_status_changed_at := COALESCE(v_status_changed_at, CURRENT_TIMESTAMP);
    
    -- Get SLA threshold for status (hardcoded, could be in config table)
    v_sla_threshold := CASE p_status
        WHEN 'new' THEN 24
        WHEN 'pending_documents' THEN 72
        WHEN 'under_review' THEN 48
        WHEN 'assigned' THEN 24
        WHEN 'in_progress' THEN 168
        WHEN 'pending_court' THEN 336
        WHEN 'pending_client' THEN 48
        WHEN 'resolved' THEN 24
        ELSE 24
    END;
    
    -- Calculate hours in status
    v_hours_in_status := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_status_changed_at)) / 3600;
    v_remaining_hours := v_sla_threshold - v_hours_in_status;
    v_is_breached := v_remaining_hours < 0;
    v_is_at_risk := v_remaining_hours > 0 AND v_remaining_hours < (v_sla_threshold * 0.2);
    
    RETURN QUERY SELECT v_is_breached, v_is_at_risk, v_hours_in_status, v_remaining_hours;
END;
$$ LANGUAGE plpgsql;

-- Create view for cases with SLA status
CREATE OR REPLACE VIEW cases_with_sla AS
SELECT 
    c.*,
    sla.is_breached AS sla_breached,
    sla.is_at_risk AS sla_at_risk,
    sla.hours_in_status,
    sla.remaining_hours,
    sla.sla_threshold_hours
FROM cases c
LEFT JOIN case_sla_tracking sla ON c.case_id = sla.case_id AND c.status = sla.status
WHERE c.status NOT IN ('closed', 'withdrawn', 'dismissed');

-- Create view for escalated cases
CREATE OR REPLACE VIEW escalated_cases AS
SELECT 
    c.*,
    u_driver.first_name AS driver_first_name,
    u_driver.last_name AS driver_last_name,
    u_attorney.first_name AS attorney_first_name,
    u_attorney.last_name AS attorney_last_name,
    u_operator.first_name AS operator_first_name,
    u_operator.last_name AS operator_last_name
FROM cases c
LEFT JOIN users u_driver ON c.driver_id = u_driver.user_id
LEFT JOIN users u_attorney ON c.assigned_attorney_id = u_attorney.user_id
LEFT JOIN users u_operator ON c.assigned_operator_id = u_operator.user_id
WHERE c.is_escalated = true
ORDER BY c.escalated_at DESC;

-- Add comments
COMMENT ON TABLE case_status_history IS 'Tracks all status changes for cases';
COMMENT ON TABLE case_sla_tracking IS 'Tracks SLA compliance for each case status';
COMMENT ON COLUMN cases.is_escalated IS 'Flag indicating if case has been escalated';
COMMENT ON COLUMN cases.escalated_at IS 'Timestamp when case was escalated';
COMMENT ON COLUMN cases.escalation_reason IS 'Reason for case escalation';
COMMENT ON COLUMN cases.assigned_at IS 'Timestamp when case was assigned to attorney';

-- Migration 020: Assignment Requests
-- Operators can request assignment to unassigned cases; admin must approve

CREATE TABLE IF NOT EXISTS assignment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(case_id, operator_id, status)
);

CREATE INDEX idx_assignment_requests_case ON assignment_requests(case_id);
CREATE INDEX idx_assignment_requests_operator ON assignment_requests(operator_id);
CREATE INDEX idx_assignment_requests_status ON assignment_requests(status);

-- RLS
ALTER TABLE assignment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators can view own requests"
  ON assignment_requests FOR SELECT
  USING (operator_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Operators can create requests"
  ON assignment_requests FOR INSERT
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "Admins can update requests"
  ON assignment_requests FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

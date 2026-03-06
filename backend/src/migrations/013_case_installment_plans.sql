-- Migration 013: Case Installment Plans
-- Weekly installment payment plans for driver case fees (2, 4, or 8 weeks)
-- Distinct from payment_plans (012) which handles monthly attorney subscriptions.

CREATE TABLE IF NOT EXISTS case_installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    weeks INTEGER NOT NULL,              -- 2, 4, or 8
    weekly_amount DECIMAL(10, 2) NOT NULL,
    payments_completed INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'failed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_weeks CHECK (weeks IN (2, 4, 8))
);

CREATE TABLE IF NOT EXISTS case_installment_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES case_installment_plans(id) ON DELETE CASCADE,
    installment_num INTEGER NOT NULL,   -- 1, 2, ... weeks
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed'
    stripe_payment_intent_id VARCHAR(255),
    reminder_sent BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cip_case_id ON case_installment_plans(case_id);
CREATE INDEX IF NOT EXISTS idx_cip_user_id ON case_installment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_cip_status ON case_installment_plans(status);
CREATE INDEX IF NOT EXISTS idx_cis_plan_id ON case_installment_schedule(plan_id);
CREATE INDEX IF NOT EXISTS idx_cis_due_date ON case_installment_schedule(due_date);
CREATE INDEX IF NOT EXISTS idx_cis_status ON case_installment_schedule(status);
CREATE INDEX IF NOT EXISTS idx_cis_reminder_sent ON case_installment_schedule(reminder_sent);

ALTER TABLE case_installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_installment_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cip_select ON case_installment_plans;
CREATE POLICY cip_select ON case_installment_plans FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS cis_select ON case_installment_schedule;
CREATE POLICY cis_select ON case_installment_schedule FOR SELECT USING (
    plan_id IN (SELECT id FROM case_installment_plans WHERE user_id = auth.uid())
);

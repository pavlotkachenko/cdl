-- Migration 012: Payment Plans and Installments
-- Stripe Subscriptions for recurring payments (3, 6, 12 month plans)

-- Create payment plans table
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    total_amount DECIMAL(10, 2) NOT NULL,
    installments INTEGER NOT NULL, -- 3, 6, or 12
    monthly_amount DECIMAL(10, 2) NOT NULL,
    first_payment_amount DECIMAL(10, 2), -- May be different if prorated
    payments_completed INTEGER DEFAULT 0,
    payments_remaining INTEGER,
    next_payment_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled', 'failed'
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_installments CHECK (installments IN (3, 6, 12))
);

-- Create payment plan history table to track each installment
CREATE TABLE IF NOT EXISTS payment_plan_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'skipped'
    stripe_invoice_id VARCHAR(255),
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create payment plan notifications table for reminder scheduling
CREATE TABLE IF NOT EXISTS payment_plan_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'upcoming_payment', 'payment_failed', 'payment_success'
    scheduled_for TIMESTAMP NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_plans_case_id ON payment_plans(case_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_user_id ON payment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_stripe_subscription_id ON payment_plans(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_next_payment_date ON payment_plans(next_payment_date);

CREATE INDEX IF NOT EXISTS idx_payment_plan_history_plan_id ON payment_plan_history(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_plan_history_status ON payment_plan_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_plan_history_due_date ON payment_plan_history(due_date);

CREATE INDEX IF NOT EXISTS idx_payment_plan_notifications_plan_id ON payment_plan_notifications(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_plan_notifications_scheduled_for ON payment_plan_notifications(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_payment_plan_notifications_sent ON payment_plan_notifications(sent);

-- RLS Policies
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment plans
DROP POLICY IF EXISTS payment_plans_select_policy ON payment_plans;
CREATE POLICY payment_plans_select_policy ON payment_plans
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can view their own payment plan history
DROP POLICY IF EXISTS payment_plan_history_select_policy ON payment_plan_history;
CREATE POLICY payment_plan_history_select_policy ON payment_plan_history
    FOR SELECT
    USING (
        payment_plan_id IN (
            SELECT id FROM payment_plans WHERE user_id = auth.uid()
        )
    );

-- Users can view their own notifications
DROP POLICY IF EXISTS payment_plan_notifications_select_policy ON payment_plan_notifications;
CREATE POLICY payment_plan_notifications_select_policy ON payment_plan_notifications
    FOR SELECT
    USING (
        payment_plan_id IN (
            SELECT id FROM payment_plans WHERE user_id = auth.uid()
        )
    );

-- Function to calculate payment schedule
CREATE OR REPLACE FUNCTION calculate_payment_schedule(
    p_payment_plan_id UUID,
    p_start_date DATE,
    p_installments INTEGER,
    p_monthly_amount DECIMAL
)
RETURNS void AS $$
DECLARE
    v_installment INTEGER;
    v_due_date DATE;
BEGIN
    FOR v_installment IN 1..p_installments LOOP
        v_due_date := p_start_date + INTERVAL '1 month' * (v_installment - 1);
        
        INSERT INTO payment_plan_history (
            payment_plan_id,
            installment_number,
            amount,
            due_date,
            status
        ) VALUES (
            p_payment_plan_id,
            v_installment,
            p_monthly_amount,
            v_due_date,
            CASE WHEN v_installment = 1 THEN 'paid' ELSE 'pending' END
        );
        
        -- Schedule notification 3 days before payment
        IF v_installment > 1 THEN
            INSERT INTO payment_plan_notifications (
                payment_plan_id,
                installment_number,
                notification_type,
                scheduled_for
            ) VALUES (
                p_payment_plan_id,
                v_installment,
                'upcoming_payment',
                v_due_date - INTERVAL '3 days'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to process due payments (to be called by cron job)
CREATE OR REPLACE FUNCTION process_due_installments()
RETURNS INTEGER AS $$
DECLARE
    v_processed_count INTEGER := 0;
    v_installment RECORD;
BEGIN
    FOR v_installment IN
        SELECT pph.*, pp.stripe_subscription_id, pp.user_id
        FROM payment_plan_history pph
        JOIN payment_plans pp ON pph.payment_plan_id = pp.id
        WHERE pph.status = 'pending'
        AND pph.due_date <= CURRENT_DATE
        AND pp.status = 'active'
    LOOP
        -- Mark as processing (actual Stripe charge handled by backend)
        UPDATE payment_plan_history
        SET status = 'processing', updated_at = NOW()
        WHERE id = v_installment.id;
        
        v_processed_count := v_processed_count + 1;
    END LOOP;
    
    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment plan status after payment
CREATE OR REPLACE FUNCTION update_payment_plan_status()
RETURNS TRIGGER AS $$
DECLARE
    v_plan RECORD;
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        -- Get payment plan details
        SELECT * INTO v_plan
        FROM payment_plans
        WHERE id = NEW.payment_plan_id;
        
        -- Update payments completed
        UPDATE payment_plans
        SET 
            payments_completed = payments_completed + 1,
            payments_remaining = installments - (payments_completed + 1),
            updated_at = NOW()
        WHERE id = NEW.payment_plan_id;
        
        -- Get next payment date
        UPDATE payment_plans
        SET next_payment_date = (
            SELECT MIN(due_date)
            FROM payment_plan_history
            WHERE payment_plan_id = NEW.payment_plan_id
            AND status = 'pending'
        )
        WHERE id = NEW.payment_plan_id;
        
        -- Check if plan is completed
        UPDATE payment_plans
        SET status = 'completed', updated_at = NOW()
        WHERE id = NEW.payment_plan_id
        AND payments_completed >= installments;
        
        -- Send success notification
        INSERT INTO payment_plan_notifications (
            payment_plan_id,
            installment_number,
            notification_type,
            scheduled_for,
            sent,
            sent_at
        ) VALUES (
            NEW.payment_plan_id,
            NEW.installment_number,
            'payment_success',
            NOW(),
            TRUE,
            NOW()
        );
    ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        -- Increment retry count
        UPDATE payment_plan_history
        SET retry_count = retry_count + 1
        WHERE id = NEW.id;
        
        -- Send failure notification
        INSERT INTO payment_plan_notifications (
            payment_plan_id,
            installment_number,
            notification_type,
            scheduled_for,
            sent,
            sent_at
        ) VALUES (
            NEW.payment_plan_id,
            NEW.installment_number,
            'payment_failed',
            NOW(),
            TRUE,
            NOW()
        );
        
        -- Cancel plan if too many failures
        IF NEW.retry_count >= 3 THEN
            UPDATE payment_plans
            SET 
                status = 'failed',
                cancelled_at = NOW(),
                cancellation_reason = 'Too many failed payment attempts',
                updated_at = NOW()
            WHERE id = NEW.payment_plan_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update plan status when installment status changes
DROP TRIGGER IF EXISTS update_payment_plan_status_trigger ON payment_plan_history;
CREATE TRIGGER update_payment_plan_status_trigger
    AFTER UPDATE OF status ON payment_plan_history
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_plan_status();

-- Function to get upcoming payments for user
CREATE OR REPLACE FUNCTION get_upcoming_payments(p_user_id UUID, p_days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    payment_plan_id UUID,
    case_id UUID,
    installment_number INTEGER,
    amount DECIMAL,
    due_date DATE,
    days_until INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pph.payment_plan_id,
        pp.case_id,
        pph.installment_number,
        pph.amount,
        pph.due_date,
        (pph.due_date - CURRENT_DATE)::INTEGER as days_until
    FROM payment_plan_history pph
    JOIN payment_plans pp ON pph.payment_plan_id = pp.id
    WHERE pp.user_id = p_user_id
    AND pph.status = 'pending'
    AND pph.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day' * p_days_ahead
    ORDER BY pph.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE payment_plans IS 'Installment payment plans for cases (3, 6, or 12 months)';
COMMENT ON TABLE payment_plan_history IS 'Tracks each individual installment payment in a plan';
COMMENT ON TABLE payment_plan_notifications IS 'Scheduled notifications for upcoming payments';
COMMENT ON COLUMN payment_plans.stripe_subscription_id IS 'Stripe subscription ID for recurring billing';
COMMENT ON COLUMN payment_plans.monthly_amount IS 'Amount charged each month (total_amount / installments)';
COMMENT ON COLUMN payment_plan_history.retry_count IS 'Number of times payment was retried after failure';
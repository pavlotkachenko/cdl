-- Migration 014: Attorney and Firm Subscriptions
-- Monthly/annual subscription plans for attorneys and law firms

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    plan_type VARCHAR(50) NOT NULL, -- 'solo', 'small_firm', 'large_firm'
    billing_interval VARCHAR(20) NOT NULL, -- 'monthly', 'annual'
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    stripe_price_id VARCHAR(255) UNIQUE,
    stripe_product_id VARCHAR(255),
    max_attorneys INTEGER, -- NULL means unlimited
    max_cases_per_month INTEGER, -- NULL means unlimited
    features JSONB, -- Array of feature descriptions
    trial_period_days INTEGER DEFAULT 14,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_plan_type CHECK (plan_type IN ('solo', 'small_firm', 'large_firm')),
    CONSTRAINT valid_billing_interval CHECK (billing_interval IN ('monthly', 'annual'))
);

-- Create subscriptions table (may already exist from base schema)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP,
    cancellation_reason TEXT,
    ended_at TIMESTAMP,
    billing_cycle_anchor TIMESTAMP,
    payment_method_id VARCHAR(255),
    default_payment_method JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist if subscriptions table was created by base schema
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_start TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_end TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_cycle_anchor TIMESTAMP;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method_id VARCHAR(255);
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS default_payment_method JSONB;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create subscription usage table for tracking limits
CREATE TABLE IF NOT EXISTS subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    usage_period_start DATE NOT NULL,
    usage_period_end DATE NOT NULL,
    attorneys_count INTEGER DEFAULT 0,
    cases_count INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    storage_used_mb INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscription_id, usage_period_start)
);

-- Create subscription history table for tracking changes
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'renewed', 'canceled', 'reactivated', 'trial_ended'
    old_plan_id UUID REFERENCES subscription_plans(id),
    new_plan_id UUID REFERENCES subscription_plans(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    amount DECIMAL(10, 2), -- Amount charged/refunded for this action
    proration_amount DECIMAL(10, 2), -- Proration credit/charge
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription invoices table (Stripe invoices)
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_invoice_id VARCHAR(255) UNIQUE,
    amount_due DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(50), -- 'draft', 'open', 'paid', 'uncollectible', 'void'
    invoice_pdf_url TEXT,
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    attempt_count INTEGER DEFAULT 0,
    next_payment_attempt TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription features table for plan features
CREATE TABLE IF NOT EXISTS subscription_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_value TEXT, -- Can be boolean, number, or text
    feature_type VARCHAR(20) NOT NULL, -- 'boolean', 'number', 'text'
    is_highlighted BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(plan_id, feature_name)
);

-- Add subscription-related columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_type ON subscription_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_stripe_price_id ON subscription_plans(stripe_price_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_current_period_end ON subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_period_start ON subscription_usage(usage_period_start);

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription_id ON subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_action ON subscription_history(action);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_subscription_id ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_stripe_invoice_id ON subscription_invoices(stripe_invoice_id);

CREATE INDEX IF NOT EXISTS idx_subscription_features_plan_id ON subscription_features(plan_id);

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- Everyone can view active subscription plans
DROP POLICY IF EXISTS subscription_plans_select_policy ON subscription_plans;
CREATE POLICY subscription_plans_select_policy ON subscription_plans
    FOR SELECT
    USING (is_active = TRUE);

-- Users can view their own subscriptions
DROP POLICY IF EXISTS subscriptions_select_policy ON subscriptions;
CREATE POLICY subscriptions_select_policy ON subscriptions
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can view their own usage
DROP POLICY IF EXISTS subscription_usage_select_policy ON subscription_usage;
CREATE POLICY subscription_usage_select_policy ON subscription_usage
    FOR SELECT
    USING (
        subscription_id IN (
            SELECT id FROM subscriptions WHERE user_id = auth.uid()
        )
    );

-- Users can view their own subscription history
DROP POLICY IF EXISTS subscription_history_select_policy ON subscription_history;
CREATE POLICY subscription_history_select_policy ON subscription_history
    FOR SELECT
    USING (
        subscription_id IN (
            SELECT id FROM subscriptions WHERE user_id = auth.uid()
        )
    );

-- Users can view their own subscription invoices
DROP POLICY IF EXISTS subscription_invoices_select_policy ON subscription_invoices;
CREATE POLICY subscription_invoices_select_policy ON subscription_invoices
    FOR SELECT
    USING (
        subscription_id IN (
            SELECT id FROM subscriptions WHERE user_id = auth.uid()
        )
    );

-- Everyone can view subscription features
DROP POLICY IF EXISTS subscription_features_select_policy ON subscription_features;
CREATE POLICY subscription_features_select_policy ON subscription_features
    FOR SELECT
    USING (TRUE);

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_subscription BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM subscriptions
        WHERE user_id = p_user_id
        AND status IN ('active', 'trialing')
        AND (current_period_end IS NULL OR current_period_end > NOW())
    ) INTO v_has_subscription;
    
    RETURN v_has_subscription;
END;
$$ LANGUAGE plpgsql;

-- Function to get subscription limits
CREATE OR REPLACE FUNCTION get_subscription_limits(p_user_id UUID)
RETURNS TABLE (
    max_attorneys INTEGER,
    max_cases_per_month INTEGER,
    current_attorneys INTEGER,
    current_cases INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sp.max_attorneys,
        sp.max_cases_per_month,
        COALESCE(su.attorneys_count, 0)::INTEGER as current_attorneys,
        COALESCE(su.cases_count, 0)::INTEGER as current_cases
    FROM subscriptions s
    JOIN subscription_plans sp ON s.plan_id = sp.id
    LEFT JOIN subscription_usage su ON s.id = su.subscription_id
        AND su.usage_period_start <= CURRENT_DATE
        AND su.usage_period_end >= CURRENT_DATE
    WHERE s.user_id = p_user_id
    AND s.status IN ('active', 'trialing')
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's subscription info
    UPDATE users
    SET 
        subscription_id = NEW.id,
        subscription_status = NEW.status,
        subscription_expires_at = NEW.current_period_end,
        updated_at = NOW()
    WHERE id = NEW.user_id;
    
    -- Log history
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO subscription_history (
            subscription_id,
            action,
            old_status,
            new_status
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.status = 'canceled' THEN 'canceled'
                WHEN NEW.status = 'active' AND OLD.status = 'trialing' THEN 'trial_ended'
                WHEN NEW.status = 'active' AND OLD.status = 'canceled' THEN 'reactivated'
                ELSE 'renewed'
            END,
            OLD.status,
            NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_subscription_status_trigger ON subscriptions;
CREATE TRIGGER update_subscription_status_trigger
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_status();

-- Function to track usage
CREATE OR REPLACE FUNCTION increment_subscription_usage(
    p_subscription_id UUID,
    p_metric VARCHAR,
    p_increment INTEGER DEFAULT 1
)
RETURNS void AS $$
DECLARE
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Get current period
    SELECT 
        DATE_TRUNC('month', CURRENT_DATE)::DATE,
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
    INTO v_period_start, v_period_end;
    
    -- Insert or update usage
    INSERT INTO subscription_usage (
        subscription_id,
        usage_period_start,
        usage_period_end
    ) VALUES (
        p_subscription_id,
        v_period_start,
        v_period_end
    ) ON CONFLICT (subscription_id, usage_period_start) DO NOTHING;
    
    -- Update metric
    CASE p_metric
        WHEN 'attorneys' THEN
            UPDATE subscription_usage
            SET attorneys_count = attorneys_count + p_increment, updated_at = NOW()
            WHERE subscription_id = p_subscription_id
            AND usage_period_start = v_period_start;
        WHEN 'cases' THEN
            UPDATE subscription_usage
            SET cases_count = cases_count + p_increment, updated_at = NOW()
            WHERE subscription_id = p_subscription_id
            AND usage_period_start = v_period_start;
        WHEN 'messages' THEN
            UPDATE subscription_usage
            SET messages_sent = messages_sent + p_increment, updated_at = NOW()
            WHERE subscription_id = p_subscription_id
            AND usage_period_start = v_period_start;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to check expiring subscriptions
CREATE OR REPLACE FUNCTION get_expiring_subscriptions(p_days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
    subscription_id UUID,
    user_id UUID,
    user_email VARCHAR,
    plan_name VARCHAR,
    expires_at TIMESTAMP,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as subscription_id,
        s.user_id,
        u.email as user_email,
        sp.name as plan_name,
        s.current_period_end as expires_at,
        EXTRACT(DAY FROM s.current_period_end - NOW())::INTEGER as days_until_expiry
    FROM subscriptions s
    JOIN users u ON s.user_id = u.id
    JOIN subscription_plans sp ON s.plan_id = sp.id
    WHERE s.status = 'active'
    AND s.cancel_at_period_end = FALSE
    AND s.current_period_end BETWEEN NOW() AND NOW() + INTERVAL '1 day' * p_days_ahead
    ORDER BY s.current_period_end ASC;
END;
$$ LANGUAGE plpgsql;

-- Insert default subscription plans
INSERT INTO subscription_plans (
    name, description, plan_type, billing_interval, price, max_attorneys, max_cases_per_month, stripe_price_id, features
) VALUES 
(
    'Solo Attorney - Monthly',
    'Perfect for individual attorneys',
    'solo',
    'monthly',
    99.00,
    1,
    NULL,
    'price_solo_monthly', -- Replace with actual Stripe price ID
    '["Unlimited cases", "Client messaging", "Document storage", "Court calendar", "Email support"]'::jsonb
),
(
    'Solo Attorney - Annual',
    'Perfect for individual attorneys (Save $198/year)',
    'solo',
    'annual',
    990.00,
    1,
    NULL,
    'price_solo_annual',
    '["Unlimited cases", "Client messaging", "Document storage", "Court calendar", "Priority support", "2 months free"]'::jsonb
),
(
    'Small Firm - Monthly',
    'For firms with up to 5 attorneys',
    'small_firm',
    'monthly',
    399.00,
    5,
    NULL,
    'price_small_monthly',
    '["Up to 5 attorneys", "Unlimited cases", "Team collaboration", "Advanced reporting", "API access", "Priority support"]'::jsonb
),
(
    'Small Firm - Annual',
    'For firms with up to 5 attorneys (Save $798/year)',
    'small_firm',
    'annual',
    3990.00,
    5,
    NULL,
    'price_small_annual',
    '["Up to 5 attorneys", "Unlimited cases", "Team collaboration", "Advanced reporting", "API access", "Dedicated support", "2 months free"]'::jsonb
),
(
    'Large Firm - Monthly',
    'For firms with unlimited attorneys',
    'large_firm',
    'monthly',
    999.00,
    NULL,
    NULL,
    'price_large_monthly',
    '["Unlimited attorneys", "Unlimited cases", "Custom branding", "Advanced analytics", "API access", "Dedicated account manager", "24/7 support", "SLA guarantee"]'::jsonb
),
(
    'Large Firm - Annual',
    'For firms with unlimited attorneys (Save $1,998/year)',
    'large_firm',
    'annual',
    9990.00,
    NULL,
    NULL,
    'price_large_annual',
    '["Unlimited attorneys", "Unlimited cases", "Custom branding", "Advanced analytics", "API access", "Dedicated account manager", "24/7 priority support", "SLA guarantee", "2 months free"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE subscription_plans IS 'Available subscription plans for attorneys and firms';
COMMENT ON TABLE subscriptions IS 'Active subscriptions with Stripe integration';
COMMENT ON TABLE subscription_usage IS 'Tracks usage metrics against plan limits';
COMMENT ON TABLE subscription_history IS 'Audit log of all subscription changes';
COMMENT ON TABLE subscription_invoices IS 'Stripe invoices for subscription billing';
COMMENT ON COLUMN subscriptions.stripe_subscription_id IS 'Stripe subscription ID for billing';
COMMENT ON COLUMN subscriptions.status IS 'active, trialing, past_due, canceled, incomplete, unpaid';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at period end';
COMMENT ON COLUMN subscription_plans.trial_period_days IS 'Number of days for free trial (default 14)';
COMMENT ON COLUMN subscription_usage.usage_period_start IS 'Start of monthly usage period';
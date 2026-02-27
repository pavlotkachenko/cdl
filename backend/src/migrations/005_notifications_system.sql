-- Migration 005: Notifications System
-- Multi-channel notifications (email, SMS, in-app, push)

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'case_update', 'message_received', 'payment_received', 'court_reminder', etc.
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'in_app', 'push'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional structured data
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'read'
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    failed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    related_case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    related_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'case_update', 'message_received', etc.
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, notification_type)
);

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'case_update', 'message_received', etc.
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'in_app', 'push'
    subject VARCHAR(255), -- For email
    body_template TEXT NOT NULL, -- Template with {{variables}}
    variables JSONB, -- Array of required variables
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification queue for batch processing
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create notification logs for audit trail
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'sent', 'delivered', 'failed', 'read'
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add columns to users table for notification settings
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT FALSE;

-- Ensure columns exist if table was created in a prior partial run
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channel VARCHAR(20);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS data JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_case_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_message_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_related_case_id ON notifications(related_case_id);
CREATE INDEX IF NOT EXISTS idx_notifications_related_message_id ON notifications(related_message_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_type ON notification_preferences(notification_type);

CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);

CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_processing ON notification_queue(processing);

CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_id ON notification_logs(notification_id);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
DROP POLICY IF EXISTS notifications_select_policy ON notifications;
CREATE POLICY notifications_select_policy ON notifications
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS notifications_update_policy ON notifications;
CREATE POLICY notifications_update_policy ON notifications
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can view and update their own preferences
DROP POLICY IF EXISTS notification_preferences_select_policy ON notification_preferences;
CREATE POLICY notification_preferences_select_policy ON notification_preferences
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_update_policy ON notification_preferences;
CREATE POLICY notification_preferences_update_policy ON notification_preferences
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notification_preferences_insert_policy ON notification_preferences;
CREATE POLICY notification_preferences_insert_policy ON notification_preferences
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Everyone can view active templates (for frontend display)
DROP POLICY IF EXISTS notification_templates_select_policy ON notification_templates;
CREATE POLICY notification_templates_select_policy ON notification_templates
    FOR SELECT
    USING (is_active = TRUE);

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE user_id = p_user_id AND read = FALSE AND channel = 'in_app';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE notifications
    SET read = TRUE, read_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id AND read = FALSE AND channel = 'in_app';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old notifications (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND channel = 'in_app';
    
    DELETE FROM notification_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Function to create default notification preferences for new user
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id, notification_type, email_enabled, sms_enabled, in_app_enabled, push_enabled)
    VALUES
        (NEW.id, 'case_update', TRUE, FALSE, TRUE, TRUE),
        (NEW.id, 'message_received', TRUE, FALSE, TRUE, TRUE),
        (NEW.id, 'payment_received', TRUE, FALSE, TRUE, TRUE),
        (NEW.id, 'court_reminder', TRUE, TRUE, TRUE, TRUE),
        (NEW.id, 'document_uploaded', TRUE, FALSE, TRUE, TRUE),
        (NEW.id, 'case_assigned', TRUE, FALSE, TRUE, TRUE),
        (NEW.id, 'case_resolved', TRUE, FALSE, TRUE, TRUE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences for new users
DROP TRIGGER IF EXISTS create_notification_preferences_trigger ON users;
CREATE TRIGGER create_notification_preferences_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Insert default notification templates
INSERT INTO notification_templates (name, type, channel, subject, body_template, variables) VALUES
    ('case_update_email', 'case_update', 'email', 
     'Update on Your Case {{caseNumber}}',
     'Hi {{userName}},

There has been an update on your case {{caseNumber}}.

Status: {{status}}
Update: {{updateMessage}}

You can view your case details at: {{caseUrl}}

Best regards,
CDL Ticket Management Team',
     '["userName", "caseNumber", "status", "updateMessage", "caseUrl"]'),
    
    ('message_received_email', 'message_received', 'email',
     'New Message from {{senderName}}',
     'Hi {{recipientName}},

You have received a new message from {{senderName}} regarding case {{caseNumber}}.

Message: {{messagePreview}}

Reply at: {{messageUrl}}

Best regards,
CDL Ticket Management Team',
     '["recipientName", "senderName", "caseNumber", "messagePreview", "messageUrl"]'),
    
    ('court_reminder_sms', 'court_reminder', 'sms',
     NULL,
     'REMINDER: Your court date for case {{caseNumber}} is {{courtDate}} at {{courtTime}}. Location: {{courtLocation}}',
     '["caseNumber", "courtDate", "courtTime", "courtLocation"]'),
    
    ('payment_received_email', 'payment_received', 'email',
     'Payment Received - Receipt for Case {{caseNumber}}',
     'Hi {{userName}},

We have received your payment of ${{amount}} for case {{caseNumber}}.

Payment method: {{paymentMethod}}
Transaction ID: {{transactionId}}
Date: {{paymentDate}}

Your receipt is attached.

Thank you for your payment!

Best regards,
CDL Ticket Management Team',
     '["userName", "caseNumber", "amount", "paymentMethod", "transactionId", "paymentDate"]')
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE notifications IS 'Stores all notifications across all channels';
COMMENT ON TABLE notification_preferences IS 'User preferences for each notification type and channel';
COMMENT ON TABLE notification_templates IS 'Templates for generating notifications with variable substitution';
COMMENT ON TABLE notification_queue IS 'Queue for batch processing of notifications';
COMMENT ON TABLE notification_logs IS 'Audit log of all notification actions';
-- Migration 010: Message Enhancements
-- Adds message templates, reactions, and threading support

-- Create message_templates table
CREATE TABLE IF NOT EXISTS message_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for message_templates
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category);
CREATE INDEX IF NOT EXISTS idx_message_templates_is_active ON message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_created_by ON message_templates(created_by);

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(message_id, user_id, reaction_type)
);

-- Add indexes for message_reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Add threading support to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS thread_id UUID,
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Add index for message threading
CREATE INDEX IF NOT EXISTS idx_messages_parent_message_id ON messages(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

-- Create function to set thread_id
CREATE OR REPLACE FUNCTION set_message_thread_id()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a reply, use parent's thread_id or parent's message_id as thread_id
    IF NEW.parent_message_id IS NOT NULL THEN
        SELECT COALESCE(thread_id, id) INTO NEW.thread_id
        FROM messages
        WHERE id = NEW.parent_message_id;
    ELSE
        -- If this is a root message, use its own id as thread_id
        NEW.thread_id := NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_message_thread_id ON messages;

CREATE TRIGGER trigger_set_message_thread_id
BEFORE INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION set_message_thread_id();

-- Create view for messages with reactions count
CREATE OR REPLACE VIEW messages_with_reactions AS
SELECT 
    m.*,
    COUNT(DISTINCT mr.reaction_id) AS reaction_count,
    json_agg(
        json_build_object(
            'reaction_type', mr.reaction_type,
            'user_id', mr.user_id,
            'created_at', mr.created_at
        )
    ) FILTER (WHERE mr.reaction_id IS NOT NULL) AS reactions
FROM messages m
LEFT JOIN message_reactions mr ON m.id = mr.message_id
GROUP BY m.id;

-- Create view for message threads
CREATE OR REPLACE VIEW message_threads AS
SELECT
    m.thread_id,
    c.case_id,
    COUNT(*) AS message_count,
    MIN(m.created_at) AS thread_started_at,
    MAX(m.created_at) AS last_message_at,
    json_agg(
        json_build_object(
            'message_id', m.id,
            'sender_id', m.sender_id,
            'content', m.content,
            'parent_message_id', m.parent_message_id,
            'created_at', m.created_at
        ) ORDER BY m.created_at
    ) AS messages
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE m.thread_id IS NOT NULL
GROUP BY m.thread_id, c.case_id;

-- Add check constraint for reaction_type
ALTER TABLE message_reactions
DROP CONSTRAINT IF EXISTS message_reactions_type_check;

ALTER TABLE message_reactions
ADD CONSTRAINT message_reactions_type_check 
CHECK (reaction_type IN ('like', 'love', 'helpful', 'important', 'question', 'resolved'));

-- Insert default message templates
INSERT INTO message_templates (name, category, subject, body, variables)
VALUES
    (
        'Welcome to Driver',
        'welcome',
        'Welcome to CDL Ticket Management',
        'Hello {{driverFirstName}},\n\nWelcome to our CDL Ticket Management platform. Your case {{caseNumber}} has been created.\n\nCase Details:\n- Violation Type: {{violationType}}\n- Violation Date: {{violationDate}}\n- State: {{violationState}}\n\nWe will keep you updated on the progress of your case.\n\nBest regards,\n{{operatorName}}',
        ARRAY['driverFirstName', 'caseNumber', 'violationType', 'violationDate', 'violationState', 'operatorName']
    ),
    (
        'Attorney Assignment Notification',
        'assignment',
        'Attorney Assigned to Your Case',
        'Hello {{driverFirstName}},\n\nGood news! An attorney has been assigned to your case {{caseNumber}}.\n\nAttorney Information:\n- Name: {{attorneyName}}\n- Email: {{attorneyEmail}}\n- Phone: {{attorneyPhone}}\n\nYour attorney will contact you soon to discuss your case.\n\nBest regards,\nCDL Ticket Management Team',
        ARRAY['driverFirstName', 'caseNumber', 'attorneyName', 'attorneyEmail', 'attorneyPhone']
    ),
    (
        'Document Request',
        'documents',
        'Documents Required for Case {{caseNumber}}',
        'Hello {{driverFirstName}},\n\nWe need additional documents for your case {{caseNumber}}.\n\nPlease upload the following documents:\n- Valid CDL License\n- Ticket/Citation\n- Any supporting documentation\n\nYou can upload these documents through your dashboard.\n\nThank you,\n{{operatorName}}',
        ARRAY['driverFirstName', 'caseNumber', 'operatorName']
    ),
    (
        'Court Date Reminder',
        'reminders',
        'Upcoming Court Date for Case {{caseNumber}}',
        'Hello {{driverFirstName}},\n\nThis is a reminder about your upcoming court date.\n\nCase: {{caseNumber}}\nCourt Date: {{courtDate}}\nViolation: {{violationType}}\n\nPlease make sure you are prepared. Your attorney {{attorneyName}} will contact you with more details.\n\nBest regards,\nCDL Ticket Management Team',
        ARRAY['driverFirstName', 'caseNumber', 'courtDate', 'violationType', 'attorneyName']
    ),
    (
        'Case Status Update',
        'status',
        'Status Update for Case {{caseNumber}}',
        'Hello {{driverFirstName}},\n\nYour case {{caseNumber}} status has been updated to: {{status}}\n\nIf you have any questions, please contact your assigned attorney or operator.\n\nBest regards,\nCDL Ticket Management Team',
        ARRAY['driverFirstName', 'caseNumber', 'status']
    ),
    (
        'Case Closed',
        'status',
        'Case {{caseNumber}} Closed',
        'Hello {{driverFirstName}},\n\nYour case {{caseNumber}} has been closed.\n\nFinal Status: {{status}}\n\nThank you for using our CDL Ticket Management platform. If you have any questions about the outcome, please contact us.\n\nBest regards,\nCDL Ticket Management Team',
        ARRAY['driverFirstName', 'caseNumber', 'status']
    )
ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE message_templates IS 'Reusable message templates with variable substitution';
COMMENT ON TABLE message_reactions IS 'Reactions to messages (like, helpful, etc.)';
COMMENT ON COLUMN messages.parent_message_id IS 'Parent message ID for threaded conversations';
COMMENT ON COLUMN messages.thread_id IS 'Thread ID grouping related messages';
COMMENT ON COLUMN messages.is_edited IS 'Flag indicating if message has been edited';
COMMENT ON COLUMN messages.edited_at IS 'Timestamp when message was last edited';

-- ============================================
-- CDL MESSAGING SYSTEM - TRIGGERS AND AUDIT LOGGING
-- Migration: 003_messaging_triggers_audit.sql
-- ============================================

-- ============================================
-- AUDIT TRAIL FUNCTIONS
-- ============================================

-- Function to log message access
CREATE OR REPLACE FUNCTION log_message_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO message_audit_log (
    message_id,
    conversation_id,
    accessed_by,
    access_type,
    accessed_at
  )
  SELECT 
    NEW.id,
    NEW.conversation_id,
    u.id,
    'view',
    NOW()
  FROM users u
  WHERE u.auth_user_id = auth.uid()
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to log attachment downloads
CREATE OR REPLACE FUNCTION log_attachment_access()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO message_audit_log (
    message_id,
    conversation_id,
    accessed_by,
    access_type,
    accessed_at
  )
  SELECT 
    NEW.message_id,
    m.conversation_id,
    u.id,
    'download_attachment',
    NOW()
  FROM messages m
  CROSS JOIN users u
  WHERE m.id = NEW.message_id
  AND u.auth_user_id = auth.uid()
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enforce retention policy
CREATE OR REPLACE FUNCTION enforce_retention_policy()
RETURNS TRIGGER AS $$
BEGIN
  -- Set retention_until to 7 years from case closure
  IF NEW.closed_at IS NOT NULL AND OLD.closed_at IS NULL THEN
    NEW.retention_until = NEW.closed_at + INTERVAL '7 years';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent deletion of messages within retention period
CREATE OR REPLACE FUNCTION prevent_retention_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = OLD.conversation_id
    AND c.retention_until IS NOT NULL
    AND c.retention_until > NOW()
  ) THEN
    RAISE EXCEPTION 'Cannot delete messages within 7-year retention period';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to track conversation access
CREATE OR REPLACE FUNCTION track_conversation_access()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  SELECT id INTO current_user_id
  FROM users
  WHERE auth_user_id = auth.uid();
  
  -- Add user to accessed_by array if not already present
  IF current_user_id IS NOT NULL AND NOT (current_user_id = ANY(NEW.accessed_by)) THEN
    NEW.accessed_by = array_append(NEW.accessed_by, current_user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate message recipients
CREATE OR REPLACE FUNCTION validate_message_recipient()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure recipient is part of the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = NEW.conversation_id
    AND (c.driver_id = NEW.recipient_id OR c.attorney_id = NEW.recipient_id)
  ) THEN
    RAISE EXCEPTION 'Recipient must be a participant in the conversation';
  END IF;
  
  -- Ensure sender is part of the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = NEW.conversation_id
    AND (c.driver_id = NEW.sender_id OR c.attorney_id = NEW.sender_id)
  ) THEN
    RAISE EXCEPTION 'Sender must be a participant in the conversation';
  END IF;
  
  -- Ensure sender and recipient are different
  IF NEW.sender_id = NEW.recipient_id THEN
    RAISE EXCEPTION 'Sender and recipient must be different';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- APPLY TRIGGERS
-- ============================================

-- Trigger to update conversation last_message_at when new message is created
DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON messages;
CREATE TRIGGER update_conversation_last_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Trigger to enforce 7-year retention policy
DROP TRIGGER IF EXISTS enforce_retention_policy_trigger ON conversations;
CREATE TRIGGER enforce_retention_policy_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION enforce_retention_policy();

-- Trigger to prevent deletion of messages within retention period
DROP TRIGGER IF EXISTS prevent_retention_deletion_trigger ON messages;
CREATE TRIGGER prevent_retention_deletion_trigger
  BEFORE DELETE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION prevent_retention_deletion();

-- Trigger to track conversation access
DROP TRIGGER IF EXISTS track_conversation_access_trigger ON conversations;
CREATE TRIGGER track_conversation_access_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION track_conversation_access();

-- Trigger to validate message recipients before insert
DROP TRIGGER IF EXISTS validate_message_recipient_trigger ON messages;
CREATE TRIGGER validate_message_recipient_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION validate_message_recipient();

-- ============================================
-- COMPLIANCE AND REPORTING VIEWS
-- ============================================

-- View for unread messages per user
CREATE OR REPLACE VIEW user_unread_messages AS
SELECT 
  u.id AS user_id,
  u.email,
  u.role,
  COUNT(m.id) AS unread_count,
  MAX(m.created_at) AS latest_unread_at
FROM users u
LEFT JOIN messages m ON m.recipient_id = u.id AND m.is_read = FALSE
GROUP BY u.id, u.email, u.role;

-- View for conversation activity (compliance monitoring)
CREATE OR REPLACE VIEW conversation_activity AS
SELECT 
  c.id AS conversation_id,
  c.case_id,
  cs.case_number,
  d.email AS driver_email,
  a.email AS attorney_email,
  COUNT(m.id) AS message_count,
  MAX(m.created_at) AS last_message_at,
  c.closed_at,
  c.retention_until,
  ARRAY_LENGTH(c.accessed_by, 1) AS access_count
FROM conversations c
INNER JOIN cases cs ON cs.id = c.case_id
INNER JOIN users d ON d.id = c.driver_id
INNER JOIN users a ON a.id = c.attorney_id
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id, c.case_id, cs.case_number, d.email, a.email, c.closed_at, c.retention_until, c.accessed_by;

-- View for audit trail summary
CREATE OR REPLACE VIEW audit_trail_summary AS
SELECT 
  mal.conversation_id,
  mal.accessed_by,
  u.email AS accessed_by_email,
  u.role AS accessed_by_role,
  mal.access_type,
  COUNT(*) AS access_count,
  MIN(mal.accessed_at) AS first_access,
  MAX(mal.accessed_at) AS last_access
FROM message_audit_log mal
INNER JOIN users u ON u.id = mal.accessed_by
GROUP BY mal.conversation_id, mal.accessed_by, u.email, u.role, mal.access_type;

-- View for messages requiring retention compliance
CREATE OR REPLACE VIEW retention_compliance_messages AS
SELECT 
  c.id AS conversation_id,
  c.case_id,
  cs.case_number,
  c.closed_at,
  c.retention_until,
  COUNT(m.id) AS message_count,
  SUM(CASE WHEN ma.id IS NOT NULL THEN 1 ELSE 0 END) AS attachment_count,
  COALESCE(SUM(ma.file_size), 0) AS total_attachment_size
FROM conversations c
INNER JOIN cases cs ON cs.id = c.case_id
LEFT JOIN messages m ON m.conversation_id = c.id
LEFT JOIN message_attachments ma ON ma.message_id = m.id
WHERE c.retention_until IS NOT NULL
GROUP BY c.id, c.case_id, cs.case_number, c.closed_at, c.retention_until;

-- ============================================
-- WEBHOOK NOTIFICATION FUNCTION (FOR REALTIME)
-- ============================================

-- Function to notify on new message (can be used with Supabase Realtime)
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  payload = json_build_object(
    'message_id', NEW.id,
    'conversation_id', NEW.conversation_id,
    'sender_id', NEW.sender_id,
    'recipient_id', NEW.recipient_id,
    'message_type', NEW.message_type,
    'priority', NEW.priority,
    'created_at', NEW.created_at
  );
  
  -- Send notification to recipient
  PERFORM pg_notify('new_message', payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for realtime message notifications
DROP TRIGGER IF EXISTS notify_new_message_trigger ON messages;
CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- ============================================
-- CLEANUP FUNCTION FOR EXPIRED RETENTION
-- ============================================

-- Function to cleanup messages past retention period
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS TABLE(deleted_conversations INT, deleted_messages INT, deleted_attachments INT) AS $$
DECLARE
  conv_count INT;
  msg_count INT;
  att_count INT;
BEGIN
  -- Count attachments to be deleted
  SELECT COUNT(*) INTO att_count
  FROM message_attachments ma
  INNER JOIN messages m ON m.id = ma.message_id
  INNER JOIN conversations c ON c.id = m.conversation_id
  WHERE c.retention_until < NOW();
  
  -- Count messages to be deleted
  SELECT COUNT(*) INTO msg_count
  FROM messages m
  INNER JOIN conversations c ON c.id = m.conversation_id
  WHERE c.retention_until < NOW();
  
  -- Count conversations to be deleted
  SELECT COUNT(*) INTO conv_count
  FROM conversations
  WHERE retention_until < NOW();
  
  -- Delete attachments first (due to foreign key constraints)
  DELETE FROM message_attachments ma
  USING messages m, conversations c
  WHERE ma.message_id = m.id
  AND m.conversation_id = c.id
  AND c.retention_until < NOW();
  
  -- Delete messages
  DELETE FROM messages m
  USING conversations c
  WHERE m.conversation_id = c.id
  AND c.retention_until < NOW();
  
  -- Delete conversations
  DELETE FROM conversations
  WHERE retention_until < NOW();
  
  -- Return counts
  deleted_conversations := conv_count;
  deleted_messages := msg_count;
  deleted_attachments := att_count;
  
  RETURN QUERY SELECT deleted_conversations, deleted_messages, deleted_attachments;
END;
$$ LANGUAGE plpgsql;

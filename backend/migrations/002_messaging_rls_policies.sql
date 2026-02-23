-- ============================================
-- CDL MESSAGING SYSTEM - ROW LEVEL SECURITY POLICIES
-- Migration: 002_messaging_rls_policies.sql
-- ============================================

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CONVERSATIONS RLS POLICIES
-- ============================================

-- Policy 1: Drivers can only view conversations where they are the driver
DROP POLICY IF EXISTS drivers_view_own_conversations ON conversations;
CREATE POLICY drivers_view_own_conversations
  ON conversations
  FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'driver'
    )
    -- Additional check: conversation must be from an active case
    AND NOT EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = conversations.case_id
      AND cases.status = 'closed'
      AND conversations.closed_at IS NOT NULL
    )
  );

-- Policy 2: Attorneys can view conversations for their assigned cases
DROP POLICY IF EXISTS attorneys_view_assigned_conversations ON conversations;
CREATE POLICY attorneys_view_assigned_conversations
  ON conversations
  FOR SELECT
  USING (
    attorney_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'attorney'
    )
    -- Verify attorney is still assigned to the case
    AND EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = conversations.case_id
      AND cases.assigned_attorney_id = attorney_id
    )
  );

-- Policy 3: Administrators have read-only access for compliance
DROP POLICY IF EXISTS admins_view_all_conversations_readonly ON conversations;
CREATE POLICY admins_view_all_conversations_readonly
  ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy 4: Drivers can insert conversations only for their own cases
DROP POLICY IF EXISTS drivers_create_own_conversations ON conversations;
CREATE POLICY drivers_create_own_conversations
  ON conversations
  FOR INSERT
  WITH CHECK (
    driver_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'driver'
    )
    -- Verify the case belongs to the driver
    AND EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_id
      AND cases.driver_id = driver_id
      AND cases.assigned_attorney_id = attorney_id
      AND cases.status != 'closed'
    )
  );

-- Policy 5: Attorneys can create conversations for assigned cases
DROP POLICY IF EXISTS attorneys_create_assigned_conversations ON conversations;
CREATE POLICY attorneys_create_assigned_conversations
  ON conversations
  FOR INSERT
  WITH CHECK (
    attorney_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'attorney'
    )
    -- Verify attorney is assigned to the case
    AND EXISTS (
      SELECT 1 FROM cases
      WHERE cases.id = case_id
      AND cases.assigned_attorney_id = attorney_id
      AND cases.status != 'closed'
    )
  );

-- Policy 6: Update last_message_at for participants only
DROP POLICY IF EXISTS participants_update_conversation_timestamp ON conversations;
CREATE POLICY participants_update_conversation_timestamp
  ON conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND (
        (role = 'driver' AND id = driver_id) OR
        (role = 'attorney' AND id = attorney_id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid()
      AND (
        (role = 'driver' AND id = driver_id) OR
        (role = 'attorney' AND id = attorney_id)
      )
    )
  );

-- ============================================
-- MESSAGES RLS POLICIES (ZERO-TRUST)
-- ============================================

-- Policy 1: Drivers can only view messages in their conversations
DROP POLICY IF EXISTS drivers_view_own_messages ON messages;
CREATE POLICY drivers_view_own_messages
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON u.id = c.driver_id
      WHERE c.id = messages.conversation_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'driver'
      -- Ensure conversation is not from a closed case
      AND c.closed_at IS NULL
    )
    AND (
      -- Driver must be sender or recipient
      sender_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
      recipient_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Policy 2: Attorneys can view messages in conversations for assigned cases
DROP POLICY IF EXISTS attorneys_view_assigned_messages ON messages;
CREATE POLICY attorneys_view_assigned_messages
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN users u ON u.id = c.attorney_id
      INNER JOIN cases cs ON cs.id = c.case_id
      WHERE c.id = messages.conversation_id
      AND u.auth_user_id = auth.uid()
      AND u.role = 'attorney'
      -- Verify attorney is still assigned
      AND cs.assigned_attorney_id = u.id
    )
    AND (
      -- Attorney must be sender or recipient
      sender_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
      recipient_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- Policy 3: Admins have read-only access for compliance and auditing
DROP POLICY IF EXISTS admins_view_all_messages_readonly ON messages;
CREATE POLICY admins_view_all_messages_readonly
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy 4: Drivers can send messages only in their own conversations
DROP POLICY IF EXISTS drivers_send_messages ON messages;
CREATE POLICY drivers_send_messages
  ON messages
  FOR INSERT
  WITH CHECK (
    -- Sender must be a driver
    sender_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'driver'
    )
    -- Conversation must belong to the driver
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND c.driver_id = sender_id
      AND c.closed_at IS NULL
    )
    -- Recipient must be the assigned attorney
    AND recipient_id IN (
      SELECT attorney_id FROM conversations
      WHERE id = conversation_id
    )
  );

-- Policy 5: Attorneys can send messages in assigned conversations
DROP POLICY IF EXISTS attorneys_send_messages ON messages;
CREATE POLICY attorneys_send_messages
  ON messages
  FOR INSERT
  WITH CHECK (
    -- Sender must be an attorney
    sender_id IN (
      SELECT id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'attorney'
    )
    -- Conversation must be assigned to the attorney
    AND EXISTS (
      SELECT 1 FROM conversations c
      INNER JOIN cases cs ON cs.id = c.case_id
      WHERE c.id = conversation_id
      AND c.attorney_id = sender_id
      AND cs.assigned_attorney_id = sender_id
      AND c.closed_at IS NULL
    )
    -- Recipient must be the driver in the conversation
    AND recipient_id IN (
      SELECT driver_id FROM conversations
      WHERE id = conversation_id
    )
  );

-- Policy 6: Users can mark their received messages as read
DROP POLICY IF EXISTS recipients_mark_messages_read ON messages;
CREATE POLICY recipients_mark_messages_read
  ON messages
  FOR UPDATE
  USING (
    recipient_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    recipient_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
    -- Only allow updating read status fields
    AND (OLD.content = NEW.content)
    AND (OLD.sender_id = NEW.sender_id)
    AND (OLD.recipient_id = NEW.recipient_id)
  );

-- ============================================
-- MESSAGE ATTACHMENTS RLS POLICIES
-- ============================================

-- Policy 1: View attachments only if user can view the message
DROP POLICY IF EXISTS users_view_message_attachments ON message_attachments;
CREATE POLICY users_view_message_attachments
  ON message_attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      INNER JOIN conversations c ON c.id = m.conversation_id
      INNER JOIN users u ON u.auth_user_id = auth.uid()
      WHERE m.id = message_attachments.message_id
      AND (
        -- Driver can view attachments in their conversations
        (u.role = 'driver' AND c.driver_id = u.id) OR
        -- Attorney can view attachments in assigned conversations
        (u.role = 'attorney' AND c.attorney_id = u.id) OR
        -- Admin can view all for compliance
        (u.role = 'admin')
      )
    )
  );

-- Policy 2: Upload attachments only to messages user can send
DROP POLICY IF EXISTS users_upload_message_attachments ON message_attachments;
CREATE POLICY users_upload_message_attachments
  ON message_attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      INNER JOIN users u ON u.auth_user_id = auth.uid()
      WHERE m.id = message_attachments.message_id
      AND m.sender_id = u.id
    )
  );

-- Policy 3: Delete own attachments (within time window)
DROP POLICY IF EXISTS senders_delete_recent_attachments ON message_attachments;
CREATE POLICY senders_delete_recent_attachments
  ON message_attachments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      INNER JOIN users u ON u.auth_user_id = auth.uid()
      WHERE m.id = message_attachments.message_id
      AND m.sender_id = u.id
      -- Only within 5 minutes of upload
      AND message_attachments.uploaded_at > NOW() - INTERVAL '5 minutes'
    )
  );

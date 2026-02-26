-- ============================================
-- CDL MESSAGING SYSTEM - DATABASE SCHEMA
-- Migration: 001_messaging_schema.sql
-- ============================================

-- ============================================
-- MESSAGING TABLES FOR SUPABASE
-- ============================================

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attorney_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit fields for compliance
  accessed_by UUID[] DEFAULT '{}',  -- Track who accessed this conversation
  closed_at TIMESTAMP WITH TIME ZONE,  -- For case closure enforcement
  retention_until TIMESTAMP WITH TIME ZONE  -- 7-year retention requirement
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 10000),  -- 10k character limit
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'video_link', 'quick_question')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Security and compliance
  encrypted BOOLEAN DEFAULT TRUE,
  audit_accessed_at TIMESTAMP WITH TIME ZONE,
  audit_accessed_by UUID REFERENCES users(id)
);

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size <= 10485760),  -- 10MB limit per file
  file_type VARCHAR(100) NOT NULL,
  file_url TEXT NOT NULL,  -- Supabase storage URL
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Security
  virus_scanned BOOLEAN DEFAULT FALSE,
  scan_result VARCHAR(50)
);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS message_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  accessed_by UUID REFERENCES users(id),
  access_type VARCHAR(50),  -- 'view', 'send', 'read', 'download_attachment'
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_conversations_driver_id ON conversations(driver_id);
CREATE INDEX IF NOT EXISTS idx_conversations_attorney_id ON conversations(attorney_id);
CREATE INDEX IF NOT EXISTS idx_conversations_case_id ON conversations(case_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority) WHERE priority IN ('urgent', 'critical');

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_message_id ON message_audit_log(message_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_conversation_id ON message_audit_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_accessed_by ON message_audit_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_message_audit_log_accessed_at ON message_audit_log(accessed_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Message validation: check total attachment size per message
CREATE OR REPLACE FUNCTION check_message_attachment_total_size()
RETURNS TRIGGER AS $$
DECLARE
  total_size BIGINT;
BEGIN
  SELECT COALESCE(SUM(file_size), 0) + NEW.file_size INTO total_size
  FROM message_attachments
  WHERE message_id = NEW.message_id;
  
  IF total_size > 26214400 THEN  -- 25MB total limit
    RAISE EXCEPTION 'Total attachment size exceeds 25MB limit';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Check attachment size before insert
DROP TRIGGER IF EXISTS check_attachment_size_trigger ON message_attachments;
CREATE TRIGGER check_attachment_size_trigger
  BEFORE INSERT ON message_attachments
  FOR EACH ROW
  EXECUTE FUNCTION check_message_attachment_total_size();

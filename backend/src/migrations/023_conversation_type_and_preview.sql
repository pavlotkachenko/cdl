-- ============================================
-- Migration: 023_conversation_type_and_preview.sql
-- Sprint 058 / MSG-1: Multi-party messaging support
-- ============================================

-- Add conversation_type to distinguish attorney, operator, and support conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(20) DEFAULT 'attorney_case';

-- Add last_message to store preview text (avoids N+1 queries on conversation list)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message TEXT;

-- Add unread_count per conversation (denormalized for fast list rendering)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Make attorney_id nullable (operator/support conversations don't have an attorney)
ALTER TABLE conversations
  ALTER COLUMN attorney_id DROP NOT NULL;

-- Make case_id nullable (operator/support conversations may not have a case)
ALTER TABLE conversations
  ALTER COLUMN case_id DROP NOT NULL;

-- Add operator_id for operator conversations (FK references auth.users like driver_id/attorney_id)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES auth.users(id);

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_operator_id ON conversations(operator_id);

-- Backfill existing conversations as attorney_case (they all are)
UPDATE conversations
  SET conversation_type = 'attorney_case'
  WHERE conversation_type IS NULL;

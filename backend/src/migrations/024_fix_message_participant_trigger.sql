-- ============================================
-- Migration: 024_fix_message_participant_trigger.sql
-- Sprint 058: Update message validation trigger to support operator_id
-- ============================================

-- Update the validate_message_recipient function to include operator_id
-- (Original in 003_messaging_triggers_audit.sql only checked driver_id + attorney_id)
CREATE OR REPLACE FUNCTION validate_message_recipient()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure recipient is part of the conversation (if provided)
  IF NEW.recipient_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = NEW.conversation_id
    AND (c.driver_id = NEW.recipient_id OR c.attorney_id = NEW.recipient_id OR c.operator_id = NEW.recipient_id)
  ) THEN
    RAISE EXCEPTION 'Recipient must be a participant in the conversation';
  END IF;

  -- Ensure sender is part of the conversation
  IF NOT EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = NEW.conversation_id
    AND (c.driver_id = NEW.sender_id OR c.attorney_id = NEW.sender_id OR c.operator_id = NEW.sender_id)
  ) THEN
    RAISE EXCEPTION 'Sender must be a participant in the conversation';
  END IF;

  -- Ensure sender and recipient are different
  IF NEW.recipient_id IS NOT NULL AND NEW.sender_id = NEW.recipient_id THEN
    RAISE EXCEPTION 'Sender and recipient must be different';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

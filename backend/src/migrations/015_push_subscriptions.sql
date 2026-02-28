/**
 * Migration: Create push_subscriptions table
 * Location: backend/src/migrations/015_push_subscriptions.sql
 * 
 * This migration creates the push_subscriptions table for storing
 * web push notification subscriptions for users.
 * 
 * Each user can have multiple subscriptions (different devices/browsers).
 * Subscriptions are automatically removed when the user is deleted.
 */

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON push_subscriptions(created_at);

-- Add comments for documentation
COMMENT ON TABLE push_subscriptions IS 'Stores web push notification subscriptions for users';
COMMENT ON COLUMN push_subscriptions.id IS 'Unique identifier for the subscription';
COMMENT ON COLUMN push_subscriptions.user_id IS 'Reference to the user who owns this subscription';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Unique push service endpoint URL';
COMMENT ON COLUMN push_subscriptions.keys IS 'JSON object containing p256dh and auth keys for encryption';
COMMENT ON COLUMN push_subscriptions.created_at IS 'Timestamp when subscription was created';
COMMENT ON COLUMN push_subscriptions.updated_at IS 'Timestamp when subscription was last updated';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER trigger_update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

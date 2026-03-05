-- Add 'carrier' to user_role enum so carriers are stored with their actual role
-- instead of being mapped to 'driver'
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'carrier';

-- Update any existing carrier users that were stored as 'driver' but have
-- carrier metadata. This is a best-effort fix; only users registered through
-- the auth controller with role='carrier' in user_metadata can be identified.
-- (Manual review may be needed for users registered via carrier.controller.js)

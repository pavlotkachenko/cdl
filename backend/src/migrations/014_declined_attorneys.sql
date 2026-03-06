-- Migration 014: Track which attorneys declined each case
-- Used by auto re-offer logic to skip previously-declined attorneys.

ALTER TABLE cases ADD COLUMN IF NOT EXISTS declined_by_attorney_ids UUID[] DEFAULT '{}';

COMMENT ON COLUMN cases.declined_by_attorney_ids IS 'Array of attorney user IDs who declined this case. Used to skip them in auto re-offer.';

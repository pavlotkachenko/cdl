-- Migration 027: Add bio, cdl_number, cdl_state to users table
-- Sprint 069: Driver Profile Page Redesign

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cdl_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cdl_state VARCHAR(2);

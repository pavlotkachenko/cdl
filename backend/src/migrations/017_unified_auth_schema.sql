-- Migration 017: Unified Auth Schema for Drivers and Carriers
-- Ensures both drivers and carriers tables have proper authentication fields

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure drivers table exists with authentication fields
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if table already exists but missing fields
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index for drivers email lookup
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);

-- Ensure carriers table exists with authentication fields
CREATE TABLE IF NOT EXISTS carriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  usdot_number VARCHAR(50) UNIQUE NOT NULL,
  carrier_size VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add columns if table already exists but missing fields
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS usdot_number VARCHAR(50) UNIQUE;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS carrier_size VARCHAR(20);
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create index for carriers email lookup
CREATE INDEX IF NOT EXISTS idx_carriers_email ON carriers(email);
CREATE INDEX IF NOT EXISTS idx_carriers_usdot ON carriers(usdot_number);

-- Add comments for documentation
COMMENT ON TABLE drivers IS 'Driver authentication and profile information';
COMMENT ON TABLE carriers IS 'Carrier company authentication and profile information';
COMMENT ON COLUMN drivers.email IS 'Unique email address for driver authentication';
COMMENT ON COLUMN drivers.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN carriers.email IS 'Unique email address for carrier authentication';
COMMENT ON COLUMN carriers.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN carriers.usdot_number IS 'Unique USDOT number for carrier identification';

-- ============================================
-- CDL Ticket Management System - Database Schema
-- ============================================
-- This file sets up all the tables (like filing cabinets) 
-- for storing data in your app

-- ============================================
-- ENUMS (Dropdown Lists)
-- ============================================
-- Think of these as pre-approved lists of options

-- User roles (who can do what)
CREATE TYPE user_role AS ENUM (
  'driver',           -- CDL drivers who submit tickets
  'carrier',          -- Carrier companies managing drivers
  'operator',         -- Case managers who organize cases
  'attorney',         -- Lawyers who handle cases
  'admin'            -- System administrators
);

-- Customer types (how they pay)
CREATE TYPE customer_type AS ENUM (
  'subscriber_driver',    -- Driver with subscription
  'subscriber_carrier',   -- Carrier company with subscription
  'one_time_driver',      -- Driver paying once
  'one_time_carrier'      -- Carrier paying once
);

-- Case statuses (where the case is in the process)
CREATE TYPE case_status AS ENUM (
  'new',                      -- Just submitted
  'reviewed',                 -- Manager looked at it
  'assigned_to_attorney',     -- Attorney has it
  'waiting_for_driver',       -- Need info from driver
  'send_info_to_attorney',    -- Sending details to attorney
  'attorney_paid',            -- Attorney got paid
  'call_court',              -- Need to contact court
  'check_with_manager',      -- Attorney needs manager help
  'pay_attorney',            -- Time to pay attorney
  'closed'                   -- All done!
);

-- Violation types (what kind of ticket)
CREATE TYPE violation_type AS ENUM (
  'speeding',
  'parking',
  'traffic_signal',
  'reckless_driving',
  'dui',
  'other'
);

-- ============================================
-- TABLES (Filing Cabinets)
-- ============================================

-- Users table (everyone who uses the app)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'driver',
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- For case managers: which states they handle
  assigned_states TEXT[],  -- Array like ['CA', 'NY', 'TX']
  
  -- For attorneys: where they can practice law
  jurisdictions JSONB,     -- Like: {"states": ["CA"], "counties": ["Los Angeles"]}
  
  -- Supabase auth link
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Subscriptions (who pays monthly/yearly)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_type customer_type NOT NULL,
  status VARCHAR(50) DEFAULT 'active',  -- active, cancelled, expired
  plan_name VARCHAR(100),               -- e.g., "Monthly CDL Protection"
  price_per_month DECIMAL(10,2),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cases (the tickets/violations)
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(50) UNIQUE NOT NULL,  -- Like "CASE-2024-001"
  
  -- Who submitted it
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  customer_name VARCHAR(255) NOT NULL,
  driver_phone VARCHAR(20),
  customer_type customer_type NOT NULL,
  
  -- Where/when it happened
  state VARCHAR(2) NOT NULL,              -- e.g., 'CA', 'NY'
  town VARCHAR(100),
  county VARCHAR(100),
  violation_date DATE NOT NULL,
  
  -- What happened
  violation_type violation_type NOT NULL,
  violation_details TEXT,
  
  -- Case management
  status case_status DEFAULT 'new',
  assigned_operator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_attorney_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Important dates
  court_date DATE,
  next_action_date DATE,
  
  -- Money stuff
  attorney_price DECIMAL(10,2),
  price_cdl DECIMAL(10,2),
  subscriber_paid BOOLEAN DEFAULT FALSE,
  court_fee DECIMAL(10,2),
  court_fee_paid_by VARCHAR(50),  -- 'driver', 'carrier', 'company'
  
  -- Additional info
  carrier VARCHAR(255),          -- Carrier company name
  who_sent VARCHAR(50),          -- 'driver', 'carrier', 'api'
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attorney_price_set_at TIMESTAMP WITH TIME ZONE,  -- For 24-hour rule
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Files (uploaded documents)
CREATE TABLE case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,           -- Supabase storage URL
  file_type VARCHAR(50),             -- 'ticket', 'evidence', 'resolution'
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Log (who did what, when)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,      -- e.g., 'Status changed to Reviewed'
  details JSONB,                     -- Additional info
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications (messages to users)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),                  -- 'assignment', 'delay', 'status_change'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Assignment Rules (how cases get auto-assigned)
CREATE TABLE assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state VARCHAR(2) NOT NULL,
  operator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1,        -- Higher = more important
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES (Make searches faster)
-- ============================================
-- Think of these like tabs in a filing cabinet

CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_state ON cases(state);
CREATE INDEX idx_cases_driver_id ON cases(driver_id);
CREATE INDEX idx_cases_assigned_operator ON cases(assigned_operator_id);
CREATE INDEX idx_cases_assigned_attorney ON cases(assigned_attorney_id);
CREATE INDEX idx_cases_case_number ON cases(case_number);
CREATE INDEX idx_cases_created_at ON cases(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- ============================================
-- FUNCTIONS (Automatic helpers)
-- ============================================

-- Auto-generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.case_number := 'CASE-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                     LPAD(NEXTVAL('case_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for case numbers
CREATE SEQUENCE case_number_seq START 1;

-- Trigger to auto-generate case numbers
CREATE TRIGGER set_case_number
  BEFORE INSERT ON cases
  FOR EACH ROW
  WHEN (NEW.case_number IS NULL)
  EXECUTE FUNCTION generate_case_number();

-- Auto-update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply auto-update to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (Who can see what)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Cases policies
CREATE POLICY "Drivers can view their own cases"
  ON cases FOR SELECT
  USING (
    driver_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Operators can view assigned cases"
  ON cases FOR SELECT
  USING (
    assigned_operator_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Attorneys can view assigned cases"
  ON cases FOR SELECT
  USING (
    assigned_attorney_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all cases"
  ON cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- ============================================
-- INITIAL DATA (Starting information)
-- ============================================

-- Insert a default admin user (you'll use this to login first time)
-- Password will be set through Supabase Auth
INSERT INTO users (email, role, full_name, phone) VALUES
  ('admin@cdltickets.com', 'admin', 'System Administrator', '555-0100');

-- Insert some example assignment rules
-- (These tell the system which state goes to which case manager)
-- You'll add real ones later through the admin panel

COMMENT ON TABLE users IS 'All users of the system (drivers, operators, attorneys, admins)';
COMMENT ON TABLE cases IS 'Traffic violation cases/tickets';
COMMENT ON TABLE subscriptions IS 'User subscription plans and billing';
COMMENT ON TABLE case_files IS 'Documents attached to cases';
COMMENT ON TABLE activity_log IS 'Audit trail of all actions';
COMMENT ON TABLE notifications IS 'User notifications and alerts';
COMMENT ON TABLE assignment_rules IS 'Rules for auto-assigning cases to operators';

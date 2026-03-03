CREATE TABLE carriers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  usdot_number VARCHAR(50) NOT NULL UNIQUE,
  carrier_size VARCHAR(20) NOT NULL CHECK (carrier_size IN ('small', 'medium', 'large')),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carriers_email ON carriers(email);
CREATE INDEX idx_carriers_usdot ON carriers(usdot_number);

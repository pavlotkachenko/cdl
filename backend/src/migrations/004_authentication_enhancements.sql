-- Migration 004: Authentication Enhancements
-- Adds password reset tokens, refresh tokens, and session management

-- Add password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add refresh tokens table for JWT rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    replaced_by_token VARCHAR(500)
);

-- Add user sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_id UUID REFERENCES refresh_tokens(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Add columns to users table for auth enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token_id ON user_sessions(refresh_token_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- RLS Policies
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own password reset tokens
DROP POLICY IF EXISTS password_reset_tokens_select_policy ON password_reset_tokens;
CREATE POLICY password_reset_tokens_select_policy ON password_reset_tokens
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can only view their own refresh tokens
DROP POLICY IF EXISTS refresh_tokens_select_policy ON refresh_tokens;
CREATE POLICY refresh_tokens_select_policy ON refresh_tokens
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can only view their own sessions
DROP POLICY IF EXISTS user_sessions_select_policy ON user_sessions;
CREATE POLICY user_sessions_select_policy ON user_sessions
    FOR SELECT
    USING (user_id = auth.uid());

-- Only system can insert/update these tables (handled by backend)
DROP POLICY IF EXISTS password_reset_tokens_insert_policy ON password_reset_tokens;
CREATE POLICY password_reset_tokens_insert_policy ON password_reset_tokens
    FOR INSERT
    WITH CHECK (false);

DROP POLICY IF EXISTS refresh_tokens_insert_policy ON refresh_tokens;
CREATE POLICY refresh_tokens_insert_policy ON refresh_tokens
    FOR INSERT
    WITH CHECK (false);

DROP POLICY IF EXISTS user_sessions_insert_policy ON user_sessions;
CREATE POLICY user_sessions_insert_policy ON user_sessions
    FOR INSERT
    WITH CHECK (false);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to revoke all user sessions (for logout all devices)
CREATE OR REPLACE FUNCTION revoke_user_sessions(p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE refresh_tokens 
    SET revoked = TRUE, revoked_at = NOW()
    WHERE user_id = p_user_id AND revoked = FALSE;
    
    DELETE FROM user_sessions WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens for secure password recovery';
COMMENT ON TABLE refresh_tokens IS 'Stores JWT refresh tokens for token rotation';
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions across devices';
COMMENT ON COLUMN users.email_verified IS 'Whether user has verified their email address';
COMMENT ON COLUMN users.failed_login_attempts IS 'Counter for failed login attempts (for account lockout)';
COMMENT ON COLUMN users.account_locked_until IS 'Timestamp until which account is locked after too many failed attempts';
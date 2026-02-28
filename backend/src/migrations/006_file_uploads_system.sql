-- Migration 006: File Upload System
-- Supabase Storage integration with metadata tracking

-- Create files table for tracking uploaded files
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL, -- In bytes
    storage_path VARCHAR(500) NOT NULL, -- Path in Supabase Storage
    storage_bucket VARCHAR(100) DEFAULT 'case-documents',
    file_type VARCHAR(50) NOT NULL, -- 'ticket', 'license', 'insurance', 'court_document', 'other'
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    virus_scan_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'clean', 'infected', 'error'
    virus_scan_result TEXT,
    scanned_at TIMESTAMP,
    thumbnail_path VARCHAR(500), -- For images/PDFs
    metadata JSONB, -- Additional file metadata
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create file versions table for tracking file updates
CREATE TABLE IF NOT EXISTS file_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_id, version_number)
);

-- Create file access logs for audit trail
CREATE TABLE IF NOT EXISTS file_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'upload', 'download', 'view', 'delete', 'share'
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create file shares table for sharing files with specific users
CREATE TABLE IF NOT EXISTS file_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES users(id),
    shared_with UUID NOT NULL REFERENCES users(id),
    can_download BOOLEAN DEFAULT TRUE,
    can_delete BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_id, shared_with)
);

-- Create file categories table
CREATE TABLE IF NOT EXISTS file_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50),
    allowed_mime_types TEXT[], -- Array of allowed MIME types
    max_file_size BIGINT, -- In bytes
    requires_case BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add file-related columns to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS ticket_photo_id UUID REFERENCES files(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS license_photo_id UUID REFERENCES files(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS insurance_photo_id UUID REFERENCES files(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS required_documents_uploaded BOOLEAN DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_case_id ON files(case_id);
CREATE INDEX IF NOT EXISTS idx_files_message_id ON files(message_id);
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_deleted ON files(deleted);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON file_versions(file_id);

CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_created_at ON file_access_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with ON file_shares(shared_with);

-- RLS Policies
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_categories ENABLE ROW LEVEL SECURITY;

-- Users can view their own files
DROP POLICY IF EXISTS files_select_own_policy ON files;
CREATE POLICY files_select_own_policy ON files
    FOR SELECT
    USING (user_id = auth.uid() OR uploaded_by = auth.uid());

-- Users can view files for their cases
DROP POLICY IF EXISTS files_select_case_policy ON files;
CREATE POLICY files_select_case_policy ON files
    FOR SELECT
    USING (
        case_id IN (
            SELECT id FROM cases
            WHERE driver_id = auth.uid()
            OR assigned_attorney_id = auth.uid()
            OR assigned_operator_id = auth.uid()
        )
    );

-- Users can view files shared with them
DROP POLICY IF EXISTS files_select_shared_policy ON files;
CREATE POLICY files_select_shared_policy ON files
    FOR SELECT
    USING (
        id IN (
            SELECT file_id FROM file_shares
            WHERE shared_with = auth.uid()
        )
    );

-- Users can insert their own files
DROP POLICY IF EXISTS files_insert_policy ON files;
CREATE POLICY files_insert_policy ON files
    FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());

-- Users can update their own files
DROP POLICY IF EXISTS files_update_policy ON files;
CREATE POLICY files_update_policy ON files
    FOR UPDATE
    USING (uploaded_by = auth.uid())
    WITH CHECK (uploaded_by = auth.uid());

-- Users can soft-delete their own files
DROP POLICY IF EXISTS files_delete_policy ON files;
CREATE POLICY files_delete_policy ON files
    FOR DELETE
    USING (uploaded_by = auth.uid() OR user_id = auth.uid());

-- File versions policies (similar to files)
DROP POLICY IF EXISTS file_versions_select_policy ON file_versions;
CREATE POLICY file_versions_select_policy ON file_versions
    FOR SELECT
    USING (
        file_id IN (SELECT id FROM files WHERE user_id = auth.uid() OR uploaded_by = auth.uid())
    );

-- File access logs - users can view their own access logs
DROP POLICY IF EXISTS file_access_logs_select_policy ON file_access_logs;
CREATE POLICY file_access_logs_select_policy ON file_access_logs
    FOR SELECT
    USING (user_id = auth.uid());

-- File shares - users can view shares they created or received
DROP POLICY IF EXISTS file_shares_select_policy ON file_shares;
CREATE POLICY file_shares_select_policy ON file_shares
    FOR SELECT
    USING (shared_by = auth.uid() OR shared_with = auth.uid());

-- Everyone can view active file categories
DROP POLICY IF EXISTS file_categories_select_policy ON file_categories;
CREATE POLICY file_categories_select_policy ON file_categories
    FOR SELECT
    USING (is_active = TRUE);

-- Function to log file access
CREATE OR REPLACE FUNCTION log_file_access()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.download_count > OLD.download_count THEN
            INSERT INTO file_access_logs (file_id, user_id, action)
            VALUES (NEW.id, NEW.user_id, 'download');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log file downloads
DROP TRIGGER IF EXISTS log_file_download_trigger ON files;
CREATE TRIGGER log_file_download_trigger
    AFTER UPDATE ON files
    FOR EACH ROW
    WHEN (NEW.download_count > OLD.download_count)
    EXECUTE FUNCTION log_file_access();

-- Function to get total storage used by user
CREATE OR REPLACE FUNCTION get_user_storage_usage(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_total_bytes BIGINT;
BEGIN
    SELECT COALESCE(SUM(file_size), 0) INTO v_total_bytes
    FROM files
    WHERE user_id = p_user_id AND deleted = FALSE;
    
    RETURN v_total_bytes;
END;
$$ LANGUAGE plpgsql;

-- Function to get storage usage by case
CREATE OR REPLACE FUNCTION get_case_storage_usage(p_case_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_total_bytes BIGINT;
BEGIN
    SELECT COALESCE(SUM(file_size), 0) INTO v_total_bytes
    FROM files
    WHERE case_id = p_case_id AND deleted = FALSE;
    
    RETURN v_total_bytes;
END;
$$ LANGUAGE plpgsql;

-- Function to soft delete file and log it
CREATE OR REPLACE FUNCTION soft_delete_file(p_file_id UUID, p_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE files
    SET deleted = TRUE,
        deleted_at = NOW(),
        deleted_by = p_user_id,
        updated_at = NOW()
    WHERE id = p_file_id;
    
    INSERT INTO file_access_logs (file_id, user_id, action)
    VALUES (p_file_id, p_user_id, 'delete');
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old soft-deleted files (30 days)
CREATE OR REPLACE FUNCTION cleanup_deleted_files()
RETURNS void AS $$
BEGIN
    -- This would typically trigger a backend job to delete from Supabase Storage
    -- Then hard delete from database
    DELETE FROM files
    WHERE deleted = TRUE 
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to check required documents for case
CREATE OR REPLACE FUNCTION check_required_documents(p_case_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_ticket BOOLEAN;
    v_has_license BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM files 
        WHERE case_id = p_case_id 
        AND file_type = 'ticket' 
        AND deleted = FALSE
    ) INTO v_has_ticket;
    
    SELECT EXISTS (
        SELECT 1 FROM files 
        WHERE case_id = p_case_id 
        AND file_type = 'license' 
        AND deleted = FALSE
    ) INTO v_has_license;
    
    RETURN v_has_ticket AND v_has_license;
END;
$$ LANGUAGE plpgsql;

-- Insert default file categories
INSERT INTO file_categories (name, description, allowed_mime_types, max_file_size, requires_case) VALUES
    ('Ticket Photo', 'Photo of traffic ticket', 
     ARRAY['image/jpeg', 'image/png', 'image/heic', 'application/pdf'], 
     10485760, TRUE), -- 10MB
    
    ('Driver License', 'Photo of driver license',
     ARRAY['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
     10485760, TRUE),
    
    ('Insurance Card', 'Photo of insurance card',
     ARRAY['image/jpeg', 'image/png', 'image/heic', 'application/pdf'],
     10485760, TRUE),
    
    ('Court Document', 'Court-related documents',
     ARRAY['application/pdf', 'image/jpeg', 'image/png'],
     52428800, TRUE), -- 50MB
    
    ('Supporting Document', 'Additional supporting documents',
     ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
     52428800, FALSE)
ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE files IS 'Tracks all uploaded files with metadata and storage paths';
COMMENT ON TABLE file_versions IS 'Stores version history when files are updated';
COMMENT ON TABLE file_access_logs IS 'Audit log of all file access actions';
COMMENT ON TABLE file_shares IS 'Tracks files shared between users';
COMMENT ON TABLE file_categories IS 'Defines allowed file types and constraints';
COMMENT ON COLUMN files.storage_path IS 'Full path to file in Supabase Storage bucket';
COMMENT ON COLUMN files.virus_scan_status IS 'Result of virus scanning (if enabled)';
COMMENT ON COLUMN files.deleted IS 'Soft delete flag - file marked for deletion but not removed yet';
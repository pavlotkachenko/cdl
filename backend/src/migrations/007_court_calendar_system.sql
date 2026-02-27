-- Migration 007: Court Calendar System
-- Court date tracking with automated reminders and Google Calendar sync

-- Create court_dates table
CREATE TABLE IF NOT EXISTS court_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date TIMESTAMP NOT NULL,
    location VARCHAR(255),
    court_name VARCHAR(255),
    court_address TEXT,
    court_room VARCHAR(100),
    hearing_type VARCHAR(100), -- 'arraignment', 'trial', 'pretrial', 'sentencing'
    judge_name VARCHAR(255),
    duration_minutes INTEGER DEFAULT 60,
    all_day BOOLEAN DEFAULT FALSE,
    notes TEXT,
    google_calendar_event_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'rescheduled', 'cancelled', 'completed'
    reminder_sent BOOLEAN DEFAULT FALSE,
    attended BOOLEAN,
    outcome TEXT,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court date reminders table
CREATE TABLE IF NOT EXISTS court_date_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_date_id UUID NOT NULL REFERENCES court_dates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'in_app', 'push'
    remind_at TIMESTAMP NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    failed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court date attendees table (for multiple people per court date)
CREATE TABLE IF NOT EXISTS court_date_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_date_id UUID NOT NULL REFERENCES court_dates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'driver', 'attorney', 'witness', 'interpreter'
    required BOOLEAN DEFAULT TRUE,
    confirmed BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP,
    declined BOOLEAN DEFAULT FALSE,
    declined_reason TEXT,
    attended BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(court_date_id, user_id)
);

-- Create court locations table for frequently used courts
CREATE TABLE IF NOT EXISTS court_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    phone VARCHAR(20),
    website VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    parking_info TEXT,
    security_info TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court calendar sync settings
CREATE TABLE IF NOT EXISTS calendar_sync_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    google_calendar_enabled BOOLEAN DEFAULT FALSE,
    google_refresh_token TEXT,
    google_calendar_id VARCHAR(255),
    outlook_calendar_enabled BOOLEAN DEFAULT FALSE,
    outlook_refresh_token TEXT,
    apple_calendar_enabled BOOLEAN DEFAULT FALSE,
    default_reminder_hours INTEGER DEFAULT 24, -- Default reminder 24 hours before
    additional_reminders INTEGER[], -- Array of hours before event: [168, 24, 1] = 1 week, 1 day, 1 hour
    sync_past_events BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create court date history for tracking changes
CREATE TABLE IF NOT EXISTS court_date_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_date_id UUID NOT NULL REFERENCES court_dates(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'rescheduled', 'cancelled'
    old_date TIMESTAMP,
    new_date TIMESTAMP,
    old_location VARCHAR(255),
    new_location VARCHAR(255),
    reason TEXT,
    changes JSONB, -- Full change log
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_court_dates_case_id ON court_dates(case_id);
CREATE INDEX IF NOT EXISTS idx_court_dates_user_id ON court_dates(user_id);
CREATE INDEX IF NOT EXISTS idx_court_dates_date ON court_dates(date);
CREATE INDEX IF NOT EXISTS idx_court_dates_status ON court_dates(status);
CREATE INDEX IF NOT EXISTS idx_court_dates_created_at ON court_dates(created_at);

CREATE INDEX IF NOT EXISTS idx_court_date_reminders_court_date_id ON court_date_reminders(court_date_id);
CREATE INDEX IF NOT EXISTS idx_court_date_reminders_user_id ON court_date_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_court_date_reminders_remind_at ON court_date_reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_court_date_reminders_sent ON court_date_reminders(sent);

CREATE INDEX IF NOT EXISTS idx_court_date_attendees_court_date_id ON court_date_attendees(court_date_id);
CREATE INDEX IF NOT EXISTS idx_court_date_attendees_user_id ON court_date_attendees(user_id);

CREATE INDEX IF NOT EXISTS idx_court_locations_city ON court_locations(city);
CREATE INDEX IF NOT EXISTS idx_court_locations_state ON court_locations(state);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_settings_user_id ON calendar_sync_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_court_date_history_court_date_id ON court_date_history(court_date_id);

-- RLS Policies
ALTER TABLE court_date_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_date_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_date_history ENABLE ROW LEVEL SECURITY;

-- Users can view reminders for their court dates
DROP POLICY IF EXISTS court_date_reminders_select_policy ON court_date_reminders;
CREATE POLICY court_date_reminders_select_policy ON court_date_reminders
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can view attendees for their court dates
DROP POLICY IF EXISTS court_date_attendees_select_policy ON court_date_attendees;
CREATE POLICY court_date_attendees_select_policy ON court_date_attendees
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        court_date_id IN (
            SELECT id FROM court_dates
            WHERE user_id = auth.uid() OR
            case_id IN (SELECT id FROM cases WHERE driver_id = auth.uid() OR assigned_attorney_id = auth.uid())
        )
    );

-- Users can update their own attendance
DROP POLICY IF EXISTS court_date_attendees_update_policy ON court_date_attendees;
CREATE POLICY court_date_attendees_update_policy ON court_date_attendees
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Everyone can view court locations
DROP POLICY IF EXISTS court_locations_select_policy ON court_locations;
CREATE POLICY court_locations_select_policy ON court_locations
    FOR SELECT
    USING (is_active = TRUE);

-- Users can view and update their own calendar sync settings
DROP POLICY IF EXISTS calendar_sync_settings_select_policy ON calendar_sync_settings;
CREATE POLICY calendar_sync_settings_select_policy ON calendar_sync_settings
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS calendar_sync_settings_update_policy ON calendar_sync_settings;
CREATE POLICY calendar_sync_settings_update_policy ON calendar_sync_settings
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS calendar_sync_settings_insert_policy ON calendar_sync_settings;
CREATE POLICY calendar_sync_settings_insert_policy ON calendar_sync_settings
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can view history for their court dates
DROP POLICY IF EXISTS court_date_history_select_policy ON court_date_history;
CREATE POLICY court_date_history_select_policy ON court_date_history
    FOR SELECT
    USING (
        court_date_id IN (
            SELECT id FROM court_dates WHERE user_id = auth.uid()
        )
    );

-- Function to create automatic reminders when court date is created
CREATE OR REPLACE FUNCTION create_court_date_reminders()
RETURNS TRIGGER AS $$
DECLARE
    v_reminder_hours INTEGER[];
    v_hour INTEGER;
    v_user_id UUID;
BEGIN
    -- Get reminder settings for the user
    SELECT additional_reminders INTO v_reminder_hours
    FROM calendar_sync_settings
    WHERE user_id = NEW.user_id;

    -- Use default if no settings
    IF v_reminder_hours IS NULL THEN
        v_reminder_hours := ARRAY[168, 24, 1]; -- 1 week, 1 day, 1 hour
    END IF;

    -- Create reminders for each attendee
    FOR v_user_id IN
        SELECT user_id FROM court_date_attendees WHERE court_date_id = NEW.id
    LOOP
        FOREACH v_hour IN ARRAY v_reminder_hours
        LOOP
            INSERT INTO court_date_reminders (court_date_id, user_id, reminder_type, remind_at)
            VALUES (
                NEW.id,
                v_user_id,
                'email',
                NEW.date - INTERVAL '1 hour' * v_hour
            );

            -- Also create SMS reminder for 1 day before
            IF v_hour = 24 THEN
                INSERT INTO court_date_reminders (court_date_id, user_id, reminder_type, remind_at)
                VALUES (
                    NEW.id,
                    v_user_id,
                    'sms',
                    NEW.date - INTERVAL '1 hour' * v_hour
                );
            END IF;
        END LOOP;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create reminders
DROP TRIGGER IF EXISTS create_court_date_reminders_trigger ON court_dates;
CREATE TRIGGER create_court_date_reminders_trigger
    AFTER INSERT ON court_dates
    FOR EACH ROW
    EXECUTE FUNCTION create_court_date_reminders();

-- Function to log court date changes
CREATE OR REPLACE FUNCTION log_court_date_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO court_date_history (
            court_date_id,
            changed_by,
            action,
            old_date,
            new_date,
            old_location,
            new_location,
            changes
        ) VALUES (
            NEW.id,
            NEW.updated_by,
            CASE
                WHEN OLD.date != NEW.date THEN 'rescheduled'
                WHEN OLD.status != NEW.status AND NEW.status = 'cancelled' THEN 'cancelled'
                ELSE 'updated'
            END,
            OLD.date,
            NEW.date,
            OLD.location,
            NEW.location,
            jsonb_build_object(
                'old', row_to_json(OLD),
                'new', row_to_json(NEW)
            )
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO court_date_history (
            court_date_id,
            changed_by,
            action,
            new_date,
            new_location
        ) VALUES (
            NEW.id,
            NEW.created_by,
            'created',
            NEW.date,
            NEW.location
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log changes
DROP TRIGGER IF EXISTS log_court_date_change_trigger ON court_dates;
CREATE TRIGGER log_court_date_change_trigger
    AFTER INSERT OR UPDATE ON court_dates
    FOR EACH ROW
    EXECUTE FUNCTION log_court_date_change();

-- Function to get upcoming court dates for user
CREATE OR REPLACE FUNCTION get_upcoming_court_dates(p_user_id UUID, p_days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
    id UUID,
    date TIMESTAMP,
    location VARCHAR,
    case_id UUID,
    case_number VARCHAR,
    hearing_type VARCHAR,
    days_until INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cd.id,
        cd.date,
        cd.location,
        cd.case_id,
        c.case_number,
        cd.hearing_type,
        EXTRACT(DAY FROM cd.date - NOW())::INTEGER as days_until
    FROM court_dates cd
    LEFT JOIN cases c ON cd.case_id = c.id
    WHERE cd.user_id = p_user_id
    AND cd.date BETWEEN NOW() AND NOW() + INTERVAL '1 day' * p_days_ahead
    AND cd.status = 'scheduled'
    ORDER BY cd.date ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to process due reminders (to be called by cron job)
CREATE OR REPLACE FUNCTION process_due_reminders()
RETURNS INTEGER AS $$
DECLARE
    v_processed_count INTEGER := 0;
    v_reminder RECORD;
BEGIN
    FOR v_reminder IN
        SELECT r.*, cd.date as court_date, cd.location, c.case_number
        FROM court_date_reminders r
        JOIN court_dates cd ON r.court_date_id = cd.id
        LEFT JOIN cases c ON cd.case_id = c.id
        WHERE r.remind_at <= NOW()
        AND r.sent = FALSE
        AND r.failed = FALSE
        AND cd.status = 'scheduled'
    LOOP
        -- Mark as sent (actual sending handled by backend)
        UPDATE court_date_reminders
        SET sent = TRUE, sent_at = NOW()
        WHERE id = v_reminder.id;

        v_processed_count := v_processed_count + 1;
    END LOOP;

    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;

-- Insert common court locations (example data)
INSERT INTO court_locations (name, address, city, state, zip_code, phone) VALUES
    ('Los Angeles Traffic Court', '110 N Grand Ave', 'Los Angeles', 'CA', '90012', '213-974-5411'),
    ('San Francisco Traffic Court', '850 Bryant St', 'San Francisco', 'CA', '94103', '415-551-4000'),
    ('San Diego Traffic Court', '1555 6th Ave', 'San Diego', 'CA', '92101', '619-844-2700'),
    ('Orange County Traffic Court', '700 Civic Center Dr W', 'Santa Ana', 'CA', '92701', '657-622-8398')
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE court_date_reminders IS 'Automated reminders for upcoming court dates';
COMMENT ON TABLE court_date_attendees IS 'Tracks who should attend each court date';
COMMENT ON TABLE court_locations IS 'Frequently used court locations with details';
COMMENT ON TABLE calendar_sync_settings IS 'User settings for syncing with external calendars';
COMMENT ON TABLE court_date_history IS 'Audit log of all court date changes';
COMMENT ON COLUMN court_dates.google_calendar_event_id IS 'Google Calendar event ID for synced events';
COMMENT ON COLUMN court_date_reminders.remind_at IS 'When the reminder should be sent';
COMMENT ON COLUMN calendar_sync_settings.additional_reminders IS 'Array of hours before event for additional reminders';

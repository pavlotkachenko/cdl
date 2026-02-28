-- Migration 013: Invoice Generation and Management
-- Professional PDF invoices with payment tracking

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE, -- INV-2026-0001
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_rate DECIMAL(5, 4) DEFAULT 0, -- e.g., 0.0875 for 8.75%
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    discount_reason TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date TIMESTAMP,
    currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT, -- Additional notes or terms
    terms TEXT, -- Payment terms
    pdf_url TEXT, -- URL to PDF in storage
    pdf_generated_at TIMESTAMP,
    sent_to_email VARCHAR(255),
    sent_at TIMESTAMP,
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent_at TIMESTAMP,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice line items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
    taxable BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice payment history table
CREATE TABLE IF NOT EXISTS invoice_payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice templates table for customization
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_email VARCHAR(255),
    company_phone VARCHAR(20),
    company_logo_url TEXT,
    tax_id VARCHAR(50), -- Tax ID or EIN
    payment_instructions TEXT,
    terms_and_conditions TEXT,
    footer_text TEXT,
    primary_color VARCHAR(7) DEFAULT '#1976d2', -- Hex color for branding
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invoice reminders table for automated reminders
CREATE TABLE IF NOT EXISTS invoice_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'before_due', 'on_due', 'overdue_1', 'overdue_7', 'overdue_14'
    scheduled_for DATE NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    email_subject VARCHAR(255),
    email_body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add invoice-related columns to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS invoice_required BOOLEAN DEFAULT FALSE;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_case_id ON invoices(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);

CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_payment_history_invoice_id ON invoice_payment_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payment_history_payment_id ON invoice_payment_history(payment_id);

CREATE INDEX IF NOT EXISTS idx_invoice_templates_is_default ON invoice_templates(is_default);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_is_active ON invoice_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_invoice_reminders_invoice_id ON invoice_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_scheduled_for ON invoice_reminders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_invoice_reminders_sent ON invoice_reminders(sent);

-- RLS Policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_reminders ENABLE ROW LEVEL SECURITY;

-- Users can view their own invoices
DROP POLICY IF EXISTS invoices_select_policy ON invoices;
CREATE POLICY invoices_select_policy ON invoices
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can view line items for their invoices
DROP POLICY IF EXISTS invoice_line_items_select_policy ON invoice_line_items;
CREATE POLICY invoice_line_items_select_policy ON invoice_line_items
    FOR SELECT
    USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
        )
    );

-- Users can view payment history for their invoices
DROP POLICY IF EXISTS invoice_payment_history_select_policy ON invoice_payment_history;
CREATE POLICY invoice_payment_history_select_policy ON invoice_payment_history
    FOR SELECT
    USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
        )
    );

-- Everyone can view active templates (for admin selection)
DROP POLICY IF EXISTS invoice_templates_select_policy ON invoice_templates;
CREATE POLICY invoice_templates_select_policy ON invoice_templates
    FOR SELECT
    USING (is_active = TRUE);

-- Users can view reminders for their invoices
DROP POLICY IF EXISTS invoice_reminders_select_policy ON invoice_reminders;
CREATE POLICY invoice_reminders_select_policy ON invoice_reminders
    FOR SELECT
    USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE user_id = auth.uid()
        )
    );

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_count INTEGER;
    v_invoice_number VARCHAR(50);
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    SELECT COUNT(*) + 1 INTO v_count
    FROM invoices
    WHERE EXTRACT(YEAR FROM issue_date) = EXTRACT(YEAR FROM CURRENT_DATE);
    
    v_invoice_number := 'INV-' || v_year || '-' || LPAD(v_count::VARCHAR, 4, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate invoice totals
CREATE OR REPLACE FUNCTION calculate_invoice_totals(p_invoice_id UUID)
RETURNS void AS $$
DECLARE
    v_subtotal DECIMAL(10, 2);
    v_tax_amount DECIMAL(10, 2);
    v_total DECIMAL(10, 2);
    v_tax_rate DECIMAL(5, 4);
    v_discount DECIMAL(10, 2);
BEGIN
    -- Get current discount and tax rate
    SELECT discount_amount, tax_rate INTO v_discount, v_tax_rate
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Calculate subtotal from line items
    SELECT COALESCE(SUM(amount), 0) INTO v_subtotal
    FROM invoice_line_items
    WHERE invoice_id = p_invoice_id;
    
    -- Apply discount
    v_subtotal := v_subtotal - COALESCE(v_discount, 0);
    
    -- Calculate tax on taxable items
    SELECT COALESCE(SUM(amount * v_tax_rate), 0) INTO v_tax_amount
    FROM invoice_line_items
    WHERE invoice_id = p_invoice_id
    AND taxable = TRUE;
    
    -- Calculate total
    v_total := v_subtotal + v_tax_amount;
    
    -- Update invoice
    UPDATE invoices
    SET 
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        amount = v_total,
        updated_at = NOW()
    WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate totals when line items change
CREATE OR REPLACE FUNCTION recalculate_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_invoice_totals(OLD.invoice_id);
    ELSE
        PERFORM calculate_invoice_totals(NEW.invoice_id);
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS recalculate_invoice_totals_trigger ON invoice_line_items;
CREATE TRIGGER recalculate_invoice_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_invoice_totals();

-- Function to mark invoice as paid
CREATE OR REPLACE FUNCTION mark_invoice_paid(
    p_invoice_id UUID,
    p_payment_id UUID,
    p_amount DECIMAL
)
RETURNS void AS $$
BEGIN
    -- Update invoice status
    UPDATE invoices
    SET 
        status = 'paid',
        paid_date = NOW(),
        payment_id = p_payment_id,
        updated_at = NOW()
    WHERE id = p_invoice_id;
    
    -- Add to payment history
    INSERT INTO invoice_payment_history (
        invoice_id,
        payment_id,
        amount,
        payment_date
    ) VALUES (
        p_invoice_id,
        p_payment_id,
        p_amount,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check for overdue invoices and update status
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER := 0;
BEGIN
    UPDATE invoices
    SET status = 'overdue', updated_at = NOW()
    WHERE status IN ('sent', 'draft')
    AND due_date < CURRENT_DATE
    RETURNING 1 INTO v_updated_count;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create invoice reminders
CREATE OR REPLACE FUNCTION create_invoice_reminders(p_invoice_id UUID, p_due_date DATE)
RETURNS void AS $$
BEGIN
    -- Reminder 7 days before due date
    INSERT INTO invoice_reminders (invoice_id, reminder_type, scheduled_for)
    VALUES (p_invoice_id, 'before_due', p_due_date - INTERVAL '7 days');
    
    -- Reminder on due date
    INSERT INTO invoice_reminders (invoice_id, reminder_type, scheduled_for)
    VALUES (p_invoice_id, 'on_due', p_due_date);
    
    -- Reminder 1 day overdue
    INSERT INTO invoice_reminders (invoice_id, reminder_type, scheduled_for)
    VALUES (p_invoice_id, 'overdue_1', p_due_date + INTERVAL '1 day');
    
    -- Reminder 7 days overdue
    INSERT INTO invoice_reminders (invoice_id, reminder_type, scheduled_for)
    VALUES (p_invoice_id, 'overdue_7', p_due_date + INTERVAL '7 days');
    
    -- Reminder 14 days overdue
    INSERT INTO invoice_reminders (invoice_id, reminder_type, scheduled_for)
    VALUES (p_invoice_id, 'overdue_14', p_due_date + INTERVAL '14 days');
END;
$$ LANGUAGE plpgsql;

-- Trigger to create reminders when invoice is created
CREATE OR REPLACE FUNCTION create_reminders_on_invoice_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != 'draft' THEN
        PERFORM create_invoice_reminders(NEW.id, NEW.due_date);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_reminders_trigger ON invoices;
CREATE TRIGGER create_reminders_trigger
    AFTER INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION create_reminders_on_invoice_insert();

-- Function to get outstanding invoices for user
CREATE OR REPLACE FUNCTION get_outstanding_invoices(p_user_id UUID)
RETURNS TABLE (
    invoice_id UUID,
    invoice_number VARCHAR,
    amount DECIMAL,
    due_date DATE,
    days_overdue INTEGER,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id as invoice_id,
        i.invoice_number,
        i.amount,
        i.due_date,
        CASE 
            WHEN i.due_date < CURRENT_DATE THEN (CURRENT_DATE - i.due_date)::INTEGER
            ELSE 0
        END as days_overdue,
        i.status
    FROM invoices i
    WHERE i.user_id = p_user_id
    AND i.status IN ('sent', 'overdue')
    ORDER BY i.due_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Insert default invoice template
INSERT INTO invoice_templates (
    name,
    company_name,
    company_address,
    company_email,
    payment_instructions,
    terms_and_conditions,
    footer_text,
    is_default
) VALUES (
    'Default Template',
    'CDL Ticket Management',
    '123 Legal Street, Suite 100
Los Angeles, CA 90001',
    'billing@cdltickets.com',
    'Payment is due within 30 days of invoice date.
Accepted payment methods: Credit Card, ACH Transfer, Check.
Make checks payable to: CDL Ticket Management',
    'Late payments may be subject to a 1.5% monthly finance charge.
All services are subject to our Terms of Service available at cdltickets.com/terms',
    'Thank you for your business!',
    TRUE
) ON CONFLICT (name) DO NOTHING;

-- Comments
COMMENT ON TABLE invoices IS 'Professional invoices for case services with PDF generation';
COMMENT ON TABLE invoice_line_items IS 'Individual line items on an invoice';
COMMENT ON TABLE invoice_payment_history IS 'Tracks all payments made against an invoice';
COMMENT ON TABLE invoice_templates IS 'Customizable invoice templates with branding';
COMMENT ON TABLE invoice_reminders IS 'Automated reminder schedule for unpaid invoices';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number (e.g., INV-2026-0001)';
COMMENT ON COLUMN invoices.pdf_url IS 'URL to generated PDF in storage (Supabase Storage)';
COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, sent, paid, overdue, cancelled, refunded';
COMMENT ON COLUMN invoice_line_items.taxable IS 'Whether this line item should be included in tax calculation';
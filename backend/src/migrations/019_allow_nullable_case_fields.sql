-- Allow state, violation_date, and violation_type to be nullable
-- so cases can be submitted from the landing page without these fields

ALTER TABLE cases ALTER COLUMN state DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN violation_date DROP NOT NULL;
ALTER TABLE cases ALTER COLUMN violation_type DROP NOT NULL;

-- Sprint 054 CT-1: Index on carrier for case table filter performance
CREATE INDEX IF NOT EXISTS idx_cases_carrier ON cases(carrier);

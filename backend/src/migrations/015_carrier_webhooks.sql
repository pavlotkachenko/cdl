-- Sprint 036 WH-1: Carrier outbound webhooks
CREATE TABLE IF NOT EXISTS carrier_webhooks (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url         TEXT         NOT NULL,
  events      TEXT[]       NOT NULL DEFAULT '{}',
  secret      TEXT         NOT NULL,
  active      BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carrier_webhooks_carrier ON carrier_webhooks(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_webhooks_active  ON carrier_webhooks(carrier_id, active);

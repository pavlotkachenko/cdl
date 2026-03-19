-- ============================================
-- MIGRATION 026: Payment Card Details
-- Adds card_brand, card_last4, receipt_url to payments table
-- for rich payment history display
-- ============================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_brand VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(4);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;

COMMENT ON COLUMN payments.card_brand IS 'Card brand from Stripe: visa, mastercard, amex, discover, etc.';
COMMENT ON COLUMN payments.card_last4 IS 'Last 4 digits of the card used for payment';
COMMENT ON COLUMN payments.receipt_url IS 'Stripe receipt URL for completed payments';

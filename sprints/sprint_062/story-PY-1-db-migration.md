# Story PY-1 — DB Migration: Add card_brand, card_last4 to payments

## Status: DONE

## Description
Add `card_brand` and `card_last4` columns to the `payments` table so the frontend can display the payment method card icon (VISA, MC, AMEX, etc.) and masked card number without calling the Stripe API at read time.

## Migration File
`backend/src/migrations/026_payment_card_details.sql`

## Schema Changes
```sql
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_brand VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS card_last4 VARCHAR(4);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_url TEXT;
```

## Hidden Requirements
1. **card_brand values**: Must match Stripe's `payment_method.card.brand` enum: `visa`, `mastercard`, `amex`, `discover`, `diners`, `jcb`, `unionpay`, `unknown`
2. **card_last4**: 4-digit string, not integer (preserves leading zeros for some card schemes)
3. **receipt_url**: Stripe provides `charges.data[0].receipt_url` on successful charges — store it for direct receipt access
4. **Backward compatibility**: Existing rows will have NULL for these columns — frontend must handle gracefully
5. **No data migration**: New fields are populated on new payments only; existing payments show "Card" as fallback

## Acceptance Criteria
- [x] Migration file creates all three columns with correct types
- [x] Columns are nullable (existing rows unaffected)
- [x] No constraints that would break existing payment inserts
- [x] Migration is idempotent (IF NOT EXISTS)

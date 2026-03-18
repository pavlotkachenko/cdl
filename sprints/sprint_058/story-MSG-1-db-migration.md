# Story MSG-1: DB Migration — Add conversation_type and last_message columns

## Status: DONE

## Description
Add new columns to the `conversations` table to support multiple conversation types (attorney, operator, support) and store the last message preview text for efficient conversation list rendering.

## Schema Changes

### Migration: `023_conversation_type_and_preview.sql`

```sql
-- Add conversation_type to distinguish attorney, operator, and support conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(20) DEFAULT 'attorney_case';

-- Add last_message to store preview text (avoids N+1 queries on conversation list)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS last_message TEXT;

-- Make attorney_id nullable (operator/support conversations don't have an attorney)
ALTER TABLE conversations
  ALTER COLUMN attorney_id DROP NOT NULL;

-- Add operator_id for operator conversations
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES auth.users(id);

-- Index on conversation_type for filtered queries
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_operator_id ON conversations(operator_id);
```

### Column Details

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `conversation_type` | VARCHAR(20) | `'attorney_case'` | Distinguishes: `attorney_case`, `operator`, `support` |
| `last_message` | TEXT | NULL | Preview text of last message for conversation list |
| `operator_id` | UUID (nullable) | NULL | FK to auth.users for operator conversations |

### Conversation Types
- `attorney_case`: Driver <-> Attorney, linked to a case (existing behavior)
- `operator`: Driver <-> Case Coordinator/Operator
- `support`: Driver <-> CDL Support (general)

## Acceptance Criteria
- [x] Migration file created at `backend/src/migrations/023_conversation_type_and_preview.sql`
- [x] Migration runs without errors on existing database
- [x] Existing conversations get `conversation_type = 'attorney_case'` default
- [x] `attorney_id` is now nullable
- [x] New indexes created

## Dependencies
- None (foundational change)

## Files to Create/Modify
- `backend/src/migrations/023_conversation_type_and_preview.sql` (create)

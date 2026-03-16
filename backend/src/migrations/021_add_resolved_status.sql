-- Migration 021: Add 'resolved' to case_status enum
-- A case can be resolved (outcome determined) but not yet closed (final paperwork pending).
-- This distinction supports the operator workflow where resolved != closed.

ALTER TYPE case_status ADD VALUE IF NOT EXISTS 'resolved' BEFORE 'closed';

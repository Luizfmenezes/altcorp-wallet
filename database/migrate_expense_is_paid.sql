-- Migration: Add is_paid column to expenses table
-- Date: 2026-03-21

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
UPDATE expenses SET is_paid = FALSE WHERE is_paid IS NULL;

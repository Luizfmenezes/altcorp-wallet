-- Migration: Add new fields to incomes table for pay_day, accounting month, and recurring support
-- Run this on existing databases

ALTER TABLE incomes ADD COLUMN IF NOT EXISTS pay_day INTEGER;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS accounting_month INTEGER;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS accounting_year INTEGER;
ALTER TABLE incomes ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Backfill: set accounting_month/year = month/year for existing records
UPDATE incomes SET accounting_month = month WHERE accounting_month IS NULL AND month IS NOT NULL;
UPDATE incomes SET accounting_year = year WHERE accounting_year IS NULL AND year IS NOT NULL;

-- Migration script to add missing columns to invoice_items table
-- This script is safe to run multiple times (idempotent)

-- Add owner column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'owner'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN owner VARCHAR(100) NOT NULL DEFAULT 'Titular';
    END IF;
END $$;

-- Add is_recurring column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'is_recurring'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add frequency column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'frequency'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN frequency frequency_type;
    END IF;
END $$;

-- Add installment_info column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'installment_info'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN installment_info JSON;
    END IF;
END $$;

-- Remove old installments column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'installments'
    ) THEN
        ALTER TABLE invoice_items DROP COLUMN installments;
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
END $$;

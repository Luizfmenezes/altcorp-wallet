-- Migration script to fix invoice_items table structure
-- Run this if you already have an existing database

-- Add missing columns to invoice_items if they don't exist
DO $$ 
BEGIN
    -- Add owner column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'owner'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN owner VARCHAR(100) NOT NULL DEFAULT 'Shared';
        RAISE NOTICE 'Added owner column to invoice_items';
    END IF;

    -- Add is_recurring column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'is_recurring'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added is_recurring column to invoice_items';
    END IF;

    -- Add frequency column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'frequency'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN frequency frequency_type;
        RAISE NOTICE 'Added frequency column to invoice_items';
    END IF;

    -- Add installment_info column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'installment_info'
    ) THEN
        ALTER TABLE invoice_items ADD COLUMN installment_info JSONB;
        RAISE NOTICE 'Added installment_info column to invoice_items';
    END IF;

    -- Drop old installments column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoice_items' AND column_name = 'installments'
    ) THEN
        ALTER TABLE invoice_items DROP COLUMN installments;
        RAISE NOTICE 'Dropped old installments column from invoice_items';
    END IF;
END $$;

COMMIT;

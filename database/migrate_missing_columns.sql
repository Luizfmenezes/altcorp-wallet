-- Migration: colunas faltantes identificadas em 2026-03-24
-- Aplica todas as colunas que estão no model mas não existiam no banco

-- 1. expenses.is_paid
ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. cards.icon
ALTER TABLE cards
    ADD COLUMN IF NOT EXISTS icon VARCHAR(100);

-- 3. cards.closing_day
ALTER TABLE cards
    ADD COLUMN IF NOT EXISTS closing_day INTEGER;

-- 4. cards.credit_limit
ALTER TABLE cards
    ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15, 2);

-- Confirmar
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name IN ('expenses', 'cards')
  AND column_name IN ('is_paid', 'icon', 'closing_day', 'credit_limit')
ORDER BY table_name, column_name;

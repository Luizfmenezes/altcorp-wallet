-- Adicionar campo icon à tabela cards
ALTER TABLE cards ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT NULL;

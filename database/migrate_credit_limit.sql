-- Migration: Adicionar coluna credit_limit na tabela cards
-- Data: 2026-03-17

ALTER TABLE cards ADD COLUMN IF NOT EXISTS credit_limit DOUBLE PRECISION DEFAULT NULL;

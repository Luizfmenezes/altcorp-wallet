-- Migration: adiciona coluna people na tabela users
-- Data: 2026-03-24
-- Descrição: Adiciona campo JSONB para armazenar lista de pessoas associadas ao usuário

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS people JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Confirmar
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'people';
